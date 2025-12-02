export interface UploadResponse {
  bucket: string;
  objectName: string;
  etag: string;
  versionId?: string | null;
  size: number;
  mimetype?: string;
  url: string;
}
