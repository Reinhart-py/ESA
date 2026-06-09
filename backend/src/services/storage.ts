import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import stream from 'stream';

dotenv.config();

const provider = process.env.STORAGE_PROVIDER || 'google_drive';

// AWS S3 / Cloudflare R2 Client
let s3Client: S3Client | null = null;
if (provider === 'cloudflare_r2' || provider === 'aws_s3') {
  const endpoint = provider === 'cloudflare_r2'
    ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined;

  s3Client = new S3Client({
    region: process.env.STORAGE_REGION || 'auto',
    endpoint: endpoint,
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || '',
    },
  });
}

// Google Drive Auth Configuration
let googleDriveClient: any = null;
if (provider === 'google_drive') {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      process.env.GOOGLE_DRIVE_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob'
    );

    if (process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
      });
      googleDriveClient = google.drive({ version: 'v3', auth: oauth2Client });
    } else {
      console.warn('WARNING: GOOGLE_DRIVE_REFRESH_TOKEN is not defined. Google Drive integration will run in mock mode.');
    }
  } catch (err: any) {
    console.error('Error initializing Google Drive SDK client:', err.message);
  }
}

// Helper to locate or create a specific directory under a parent directory
async function getOrCreateFolder(drive: any, folderName: string, parentId: string): Promise<string> {
  try {
    const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;
    const response = await drive.files.list({
      q: query,
      fields: 'files(id)'
    });

    const files = response.data.files;
    if (files && files.length > 0) {
      return files[0].id!;
    }
  } catch (err: any) {
    console.warn(`Warning: listing folder failed for parent: ${parentId}. Retrying under root context.`, err.message);
  }

  try {
    const requestBody: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };
    if (parentId && parentId !== '5TB_EAC_ROOT') {
      requestBody.parents = [parentId];
    }

    const newFolder = await drive.files.create({
      requestBody,
      fields: 'id'
    });

    return newFolder.data.id!;
  } catch (err: any) {
    // Ultimate fallback if parent ID is completely invalid
    const newFolder = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id'
    });
    return newFolder.data.id!;
  }
}

export const StorageService = {
  getProviderName: () => provider,

  uploadFile: async (
    fileName: string,
    mimeType: string,
    buffer: Buffer,
    tenantId: string,
    category: string
  ): Promise<string> => {
    const fileKey = `${tenantId}/${category}/${Date.now()}_${fileName}`;
    const bucket = process.env.STORAGE_BUCKET_NAME || 'eac-solutions-vault';

    if ((provider === 'cloudflare_r2' || provider === 'aws_s3') && s3Client) {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: fileKey,
        Body: buffer,
        ContentType: mimeType,
      });
      await s3Client.send(command);
      return fileKey;
    } else if (provider === 'google_drive' && googleDriveClient) {
      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);

      const rootFolderId = process.env.GOOGLE_DRIVE_SHARED_FOLDER_ID || '5TB_EAC_ROOT';
      
      // Resolve/Create subdirectories dynamically for strict tenant isolation
      const tenantFolderId = await getOrCreateFolder(googleDriveClient, tenantId, rootFolderId);
      const categoryFolderId = await getOrCreateFolder(googleDriveClient, category, tenantFolderId);

      const response = await googleDriveClient.files.create({
        requestBody: {
          name: fileName,
          parents: [categoryFolderId],
          mimeType: mimeType
        },
        media: {
          mimeType: mimeType,
          body: bufferStream
        }
      });

      if (!response.data.id) {
        throw new Error('Failed to create file in Google Drive');
      }

      return response.data.id;
    } else {
      // In-Memory Fallback / Mock
      console.log(`[Storage Mock] Uploaded ${fileName} to storage provider ${provider}`);
      return `mock_key_${Date.now()}_${fileName}`;
    }
  },

  deleteFile: async (storageKey: string): Promise<boolean> => {
    const bucket = process.env.STORAGE_BUCKET_NAME || 'eac-solutions-vault';

    if ((provider === 'cloudflare_r2' || provider === 'aws_s3') && s3Client) {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: storageKey,
      });
      await s3Client.send(command);
      return true;
    } else if (provider === 'google_drive' && googleDriveClient) {
      try {
        await googleDriveClient.files.delete({
          fileId: storageKey
        });
      } catch (err: any) {
        if (err.status !== 404) {
          throw err;
        }
      }
      return true;
    } else {
      console.log(`[Storage Mock] Deleted ${storageKey} from storage provider ${provider}`);
      return true;
    }
  },

  getDownloadUrl: async (storageKey: string): Promise<string> => {
    const bucket = process.env.STORAGE_BUCKET_NAME || 'eac-solutions-vault';

    if ((provider === 'cloudflare_r2' || provider === 'aws_s3') && s3Client) {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: storageKey,
      });
      return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } else if (provider === 'google_drive' && googleDriveClient) {
      // Fetch link for Google Drive file
      const response = await googleDriveClient.files.get({
        fileId: storageKey,
        fields: 'webViewLink, webContentLink'
      });
      return response.data.webContentLink || response.data.webViewLink || '';
    } else {
      return `/mock-download/${storageKey}`;
    }
  },

  getFileStreamOrBuffer: async (storageKey: string): Promise<stream.Readable> => {
    const bucket = process.env.STORAGE_BUCKET_NAME || 'eac-solutions-vault';

    if ((provider === 'cloudflare_r2' || provider === 'aws_s3') && s3Client) {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: storageKey,
      });
      const response = await s3Client.send(command);
      if (response.Body) {
        return response.Body as stream.Readable;
      }
      throw new Error('S3 body is empty');
    } else if (provider === 'google_drive' && googleDriveClient) {
      const response = await googleDriveClient.files.get(
        { fileId: storageKey, alt: 'media' },
        { responseType: 'stream' }
      );
      return response.data;
    } else {
      const s = new stream.Readable();
      s.push(`EAC Solutions Vault: Mock file contents for ${storageKey}`);
      s.push(null);
      return s;
    }
  }
};
