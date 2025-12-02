import {
  Injectable,
  OnModuleInit,
  Logger,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as Minio from 'minio';
import { InjectMinio } from 'src/decorators/minio.decorator';
import { UploadResponse } from 'src/interfaces/file.interface';

@Injectable()
export class FilesService implements OnModuleInit {
  private readonly logger = new Logger(FilesService.name);
  private readonly bucketName: string;
  private readonly minioEndpoint: string;
  private readonly minioPort: string;
  private readonly minioUseSSL: boolean;

  constructor(
    @InjectMinio() private readonly minioClient: Minio.Client,
    private readonly configService: ConfigService,
  ) {
    this.bucketName =
      this.configService.get<string>('MINIO_BUCKET_NAME') || 'default-bucket';
    this.minioEndpoint =
      this.configService.get<string>('MINIO_ENDPOINT') || 'localhost';
    this.minioPort = this.configService.get<string>('MINIO_PORT') || '9000';
    this.minioUseSSL =
      this.configService.get<boolean>('MINIO_USE_SSL') || false;
  }

  /**
   * Initialize MinIO bucket on module startup
   * - Creates bucket if it doesn't exist
   * - Sets public read policy for the bucket
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.ensureBucketExists();
      await this.setBucketPublicPolicy();
      this.logger.log(
        `MinIO initialized successfully. Bucket: ${this.bucketName}`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize MinIO', error.stack);
      throw new InternalServerErrorException('Failed to initialize storage');
    }
  }

  /**
   * Ensures the bucket exists, creates it if not
   */
  private async ensureBucketExists(): Promise<void> {
    const exists = await this.minioClient.bucketExists(this.bucketName);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
      this.logger.log(`Bucket '${this.bucketName}' created`);
    }
  }

  /**
   * Sets public read policy for the bucket
   * Allows anonymous GET requests to all objects
   */
  private async setBucketPublicPolicy(): Promise<void> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucketName}/*`],
        },
      ],
    };

    try {
      await this.minioClient.setBucketPolicy(
        this.bucketName,
        JSON.stringify(policy),
      );
      this.logger.debug(`Public policy set for bucket '${this.bucketName}'`);
    } catch (error) {
      this.logger.warn('Failed to set bucket policy', error.message);
    }
  }

  /**
   * List all available buckets
   * @returns Array of bucket information
   */
  async listBuckets(): Promise<{ name: string; creationDate: Date }[]> {
    try {
      const buckets = await this.minioClient.listBuckets();
      return buckets.map((b) => ({
        name: b.name,
        creationDate: b.creationDate,
      }));
    } catch (error) {
      this.logger.error('Failed to list buckets', error.stack);
      throw new InternalServerErrorException('Failed to retrieve buckets');
    }
  }

  /**
   * Get public URL for a file
   * @param objectName - Name of the object in storage
   * @returns Public URL to access the file
   */
  getFilePublicUrl(objectName: string): string {
    const protocol = this.minioUseSSL ? 'https' : 'http';
    return `${protocol}://${this.minioEndpoint}:${this.minioPort}/${this.bucketName}/${objectName}`;
  }

  /**
   * Generate presigned URL for temporary access to private files
   * @param objectName - Name of the object in storage
   * @param expiresInSec - URL expiration time in seconds (default: 1 hour)
   * @returns Presigned URL for temporary access
   */
  async getFilePresignedUrl(
    objectName: string,
    expiresInSec = 3600,
  ): Promise<string> {
    try {
      return await this.minioClient.presignedUrl(
        'GET',
        this.bucketName,
        objectName,
        expiresInSec,
      );
    } catch (error) {
      this.logger.error('Failed to generate presigned URL', error.stack);
      throw new InternalServerErrorException(
        'Failed to generate file access URL',
      );
    }
  }

  /**
   * Upload file to MinIO storage
   * @param file - Multer file object
   * @returns Upload response with file metadata and URL
   */
  async uploadFile(file: Express.Multer.File): Promise<UploadResponse> {
    const objectName = this.generateObjectName(file.originalname);

    try {
      const metadata = {
        'Content-Type': file.mimetype,
        'Original-Name': file.originalname,
      };

      const objInfo = await this.minioClient.putObject(
        this.bucketName,
        objectName,
        file.buffer,
        file.size,
        metadata,
      );

      this.logger.log(`File uploaded successfully: ${objectName}`);

      return {
        bucket: this.bucketName,
        objectName,
        etag: objInfo.etag,
        versionId: objInfo.versionId ?? null,
        size: file.size,
        mimetype: file.mimetype,
        url: this.getFilePublicUrl(objectName),
      };
    } catch (error) {
      this.logger.error('Failed to upload file', error.stack);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  /**
   * Generate unique object name with UUID prefix
   * @param originalName - Original filename
   * @returns Generated object name
   */
  private generateObjectName(originalName: string): string {
    const timestamp = Date.now();
    const uuid = randomUUID();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${timestamp}-${uuid}-${sanitizedName}`;
  }

  /**
   * Get file metadata by ID (UUID prefix)
   * @param id - UUID or prefix to search for
   * @returns File metadata or null if not found
   */
  async getFileById(id: string): Promise<UploadResponse | null> {
    try {
      const stream = this.minioClient.listObjectsV2(this.bucketName, '', true);

      for await (const obj of stream) {
        if (obj.name.includes(id)) {
          const stat = await this.minioClient.statObject(
            this.bucketName,
            obj.name,
          );

          return {
            bucket: this.bucketName,
            objectName: obj.name,
            etag: obj.etag,
            versionId: obj.versionId ?? null,
            size: obj.size,
            mimetype:
              stat.metaData?.['content-type'] || 'application/octet-stream',
            url: this.getFilePublicUrl(obj.name),
          };
        }
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to get file by ID', error.stack);
      throw new InternalServerErrorException('Failed to retrieve file');
    }
  }

  /**
   * Delete file from storage
   * @param objectName - Name of the object to delete
   */
  async deleteFile(objectName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, objectName);
      this.logger.log(`File deleted successfully: ${objectName}`);
    } catch (error) {
      this.logger.error('Failed to delete file', error.stack);
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  /**
   * Check if file exists in storage
   * @param objectName - Name of the object to check
   * @returns True if file exists, false otherwise
   */
  async fileExists(objectName: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(this.bucketName, objectName);
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata
   * @param objectName - Name of the object
   * @returns File stat information
   */
  async getFileMetadata(objectName: string): Promise<Minio.BucketItemStat> {
    try {
      return await this.minioClient.statObject(this.bucketName, objectName);
    } catch (error) {
      if (error.code === 'NotFound') {
        throw new NotFoundException('File not found');
      }
      this.logger.error('Failed to get file metadata', error.stack);
      throw new InternalServerErrorException(
        'Failed to retrieve file metadata',
      );
    }
  }
}
