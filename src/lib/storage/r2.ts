import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface UploadOptions {
  folder?: 'products' | 'categories' | 'banners' | 'users' | 'blog' | 'uploads';
  filename?: string;
  contentType: string;
  maxSizeBytes?: number;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
];

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export class R2StorageService {
  private client: S3Client | null = null;
  private bucketName: string;
  private endpoint: string;
  private publicUrl: string;
  private isConfigured: boolean;

  constructor() {
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
    this.endpoint = process.env.R2_ENDPOINT || '';
    this.bucketName = process.env.R2_BUCKET_NAME || '';
    this.publicUrl = process.env.R2_PUBLIC_URL || '';

    this.isConfigured = Boolean(
      accessKeyId && secretAccessKey && this.endpoint && this.bucketName
    );

    if (this.isConfigured) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: this.endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  /**
   * Validates file type and size before processing.
   */
  validateFile(
    file: { size: number; type: string },
    maxSizeBytes: number = DEFAULT_MAX_SIZE
  ): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return {
        valid: false,
        error: `Unsupported image format: ${file.type}. Allowed formats: JPG, PNG, WebP, GIF, AVIF, SVG.`,
      };
    }

    if (file.size > maxSizeBytes) {
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
      return {
        valid: false,
        error: `Image file exceeds maximum allowed size of ${maxMb}MB.`,
      };
    }

    return { valid: true };
  }

  /**
   * Generates a clean, collision-free object key.
   */
  generateKey(folder: string = 'uploads', originalFilename?: string, extension?: string): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    
    let ext = extension || 'webp';
    if (originalFilename) {
      const parts = originalFilename.split('.');
      if (parts.length > 1) {
        ext = parts.pop()!.toLowerCase();
      }
    }
    
    // Clean extension
    ext = ext.replace(/[^a-z0-9]/g, '');

    return `${folder}/${timestamp}-${randomStr}.${ext}`;
  }

  /**
   * Uploads a Buffer/Uint8Array directly to Cloudflare R2.
   */
  async upload(
    buffer: Buffer | Uint8Array,
    options: UploadOptions
  ): Promise<UploadResult> {
    const folder = options.folder || 'uploads';
    const key = this.generateKey(folder, options.filename);
    const contentType = options.contentType || 'image/webp';

    // In local development without R2 credentials, fallback to data URI / local placeholder
    if (!this.isConfigured || !this.client) {
      console.warn(
        '[R2 Storage] R2 credentials not fully configured in environment. Using fallback data representation.'
      );
      const base64 = Buffer.from(buffer).toString('base64');
      const dataUri = `data:${contentType};base64,${base64}`;
      return {
        key,
        url: dataUri,
        size: buffer.byteLength,
        contentType,
      };
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    await this.client.send(command);

    const url = this.getPublicUrl(key);

    return {
      key,
      url,
      size: buffer.byteLength,
      contentType,
    };
  }

  /**
   * Deletes an object from Cloudflare R2 by key.
   */
  async delete(keyOrUrl: string): Promise<boolean> {
    if (!keyOrUrl) return false;

    const key = this.extractKey(keyOrUrl);
    if (!key) return false;

    if (!this.isConfigured || !this.client) {
      console.warn('[R2 Storage] Skipping delete: R2 not configured');
      return true;
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch (err) {
      console.error(`[R2 Storage] Error deleting key ${key}:`, err);
      return false;
    }
  }

  /**
   * Fetches an object body stream and metadata from R2.
   */
  async getObject(keyOrUrl: string) {
    const key = this.extractKey(keyOrUrl);
    if (!key || !this.isConfigured || !this.client) return null;

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const response = await this.client.send(command);
      return {
        body: response.Body,
        contentType: response.ContentType || 'application/octet-stream',
        contentLength: response.ContentLength,
        eTag: response.ETag,
      };
    } catch (err: any) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        return null;
      }
      console.error(`[R2 Storage] Error retrieving object ${key}:`, err);
      return null;
    }
  }

  /**
   * Checks whether an object exists in the R2 bucket.
   */
  async exists(keyOrUrl: string): Promise<boolean> {
    const key = this.extractKey(keyOrUrl);
    if (!key || !this.isConfigured || !this.client) return false;

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the display URL for a given object key.
   * If R2_PUBLIC_URL is configured (e.g. custom domain), uses that.
   * Otherwise returns the internal proxy URL `/api/images/${key}`.
   */
  getPublicUrl(key: string): string {
    if (!key) return '';
    if (key.startsWith('http://') || key.startsWith('https://') || key.startsWith('data:')) {
      return key;
    }

    const cleanKey = key.replace(/^\/+/, '');

    if (this.publicUrl) {
      const base = this.publicUrl.replace(/\/+$/, '');
      return `${base}/${cleanKey}`;
    }

    // Default proxy route
    return `/api/images/${cleanKey}`;
  }

  /**
   * Extracts the R2 key from a full URL or returns the key if already formatted.
   */
  extractKey(keyOrUrl: string): string {
    if (!keyOrUrl) return '';
    if (!keyOrUrl.startsWith('http://') && !keyOrUrl.startsWith('https://') && !keyOrUrl.startsWith('/api/images/')) {
      return keyOrUrl.replace(/^\/+/, '');
    }

    try {
      if (keyOrUrl.startsWith('/api/images/')) {
        return keyOrUrl.replace('/api/images/', '');
      }

      const url = new URL(keyOrUrl);
      if (url.pathname.startsWith('/api/images/')) {
        return url.pathname.replace('/api/images/', '');
      }

      return url.pathname.replace(/^\/+/, '');
    } catch {
      return keyOrUrl;
    }
  }

  /**
   * Generates a presigned upload URL for direct browser-to-R2 uploads if desired.
   */
  async getPresignedUploadUrl(
    options: UploadOptions
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string } | null> {
    if (!this.isConfigured || !this.client) return null;

    const folder = options.folder || 'uploads';
    const key = this.generateKey(folder, options.filename);
    const contentType = options.contentType || 'image/webp';

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 3600 });
    const publicUrl = this.getPublicUrl(key);

    return {
      uploadUrl,
      key,
      publicUrl,
    };
  }
}

// Export singleton instance
export const r2Storage = new R2StorageService();
