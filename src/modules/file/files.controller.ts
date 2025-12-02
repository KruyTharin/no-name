import {
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  HttpCode,
  NotFoundException,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { FilesService } from './files.service';
import { UploadResponse } from '@/interfaces/file.interface';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'File uploaded successfully',
    schema: {
      example: {
        bucket: 'my-bucket',
        objectName: '1733123456789-uuid-example.jpg',
        etag: 'abc123',
        versionId: null,
        size: 1024,
        mimetype: 'image/jpeg',
        url: 'http://localhost:9000/my-bucket/1733123456789-uuid-example.jpg',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or file validation failed',
  })
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          // Uncomment to restrict file types:
          // new FileTypeValidator({ fileType: /(jpg|jpeg|png|pdf)$/ }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ): Promise<UploadResponse> {
    return this.filesService.uploadFile(file);
  }

  @Get(':identifier')
  @ApiOperation({
    summary: 'Get file by filename or ID',
    description:
      'Retrieve file metadata by exact filename or search by ID (UUID/timestamp). Returns file information including URL.',
  })
  @ApiParam({
    name: 'identifier',
    description:
      'Full filename (e.g., "1733123456789-uuid-example.jpg") or ID to search (e.g., UUID or timestamp)',
    example: '1733123456789-uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File found and metadata returned',
    schema: {
      example: {
        bucket: 'my-bucket',
        objectName: '1733123456789-uuid-example.jpg',
        etag: 'abc123',
        versionId: null,
        size: 1024,
        mimetype: 'image/jpeg',
        url: 'http://localhost:9000/my-bucket/1733123456789-uuid-example.jpg',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found',
  })
  async getFile(
    @Param('identifier') identifier: string,
  ): Promise<UploadResponse> {
    // First, try to find by exact filename
    const existsByFilename = await this.filesService.fileExists(identifier);

    if (existsByFilename) {
      const metadata = await this.filesService.getFileMetadata(identifier);
      return {
        bucket: this.filesService['bucketName'],
        objectName: identifier,
        etag: metadata.etag,
        versionId: metadata.versionId ?? null,
        size: metadata.size,
        mimetype:
          metadata.metaData?.['content-type'] || 'application/octet-stream',
        url: this.filesService.getFilePublicUrl(identifier),
      };
    }

    // If not found by exact filename, search by ID
    const file = await this.filesService.getFileById(identifier);
    if (!file) {
      throw new NotFoundException(
        `File not found with identifier: ${identifier}`,
      );
    }

    return file;
  }

  @Delete(':identifier')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete file by filename or ID',
    description:
      'Delete a file by exact filename or search by ID (UUID/timestamp)',
  })
  @ApiParam({
    name: 'identifier',
    description: 'Full filename or ID to search',
    example: '1733123456789-uuid-example.jpg',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'File deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'File not found',
  })
  async deleteFile(@Param('identifier') identifier: string): Promise<void> {
    // First, try exact filename
    const existsByFilename = await this.filesService.fileExists(identifier);

    if (existsByFilename) {
      await this.filesService.deleteFile(identifier);
      return;
    }

    // If not found by exact filename, search by ID
    const file = await this.filesService.getFileById(identifier);
    if (!file) {
      throw new NotFoundException(
        `File not found with identifier: ${identifier}`,
      );
    }

    await this.filesService.deleteFile(file.objectName);
  }
}
