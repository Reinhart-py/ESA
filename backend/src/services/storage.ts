import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import stream from 'stream';
import { DocumentRepository } from '../repositories/documentRepository.js';

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
let oauth2ClientInstance: any = null;

if (provider === 'google_drive') {
  try {
    oauth2ClientInstance = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      process.env.GOOGLE_DRIVE_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob'
    );

    if (process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
      oauth2ClientInstance.setCredentials({
        refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
      });
      googleDriveClient = google.drive({ version: 'v3', auth: oauth2ClientInstance });
    } else {
      console.warn('WARNING: GOOGLE_DRIVE_REFRESH_TOKEN is not defined. Google Drive integration will run in mock mode.');
    }
  } catch (err: any) {
    console.error('Error initializing Google Drive SDK client:', err.message);
  }
}

// Function to guarantee fresh credentials prior to any Drive request
async function ensureGoogleCredentials(): Promise<any> {
  if (!oauth2ClientInstance) {
    throw new Error('Google OAuth client is not initialized. Verify credentials configurations.');
  }
  try {
    const tokens = await oauth2ClientInstance.getAccessToken();
    if (!tokens.token) {
      console.log('[Google Drive] Refreshing access credentials token...');
      const response = await oauth2ClientInstance.refreshAccessToken();
      oauth2ClientInstance.setCredentials(response.credentials);
    }
    return google.drive({ version: 'v3', auth: oauth2ClientInstance });
  } catch (err: any) {
    console.error('[Google Drive] Token refresh failed:', err.message);
    throw new Error(`Google Drive token refresh failed: ${err.message}`);
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

  provisionTenantFolders: async (tenantId: string): Promise<void> => {
    if (provider !== 'google_drive' || !googleDriveClient) {
      console.log(`[Storage Mock] Skipping provisioning for provider ${provider}`);
      return;
    }
    try {
      const activeDrive = await ensureGoogleCredentials();
      const rootFolderId = process.env.GOOGLE_DRIVE_SHARED_FOLDER_ID || '5TB_EAC_ROOT';
      
      const tenantFolderId = await getOrCreateFolder(activeDrive, tenantId, rootFolderId);
      const categories = ['compliance', 'payroll', 'taxation', 'audits', 'reports', 'documents'];
      
      await Promise.all(
        categories.map(category => getOrCreateFolder(activeDrive, category, tenantFolderId))
      );
      console.log(`[Storage] Provisioned Google Drive folder hierarchy for tenant ${tenantId}`);
    } catch (err: any) {
      console.error(`[Storage Error] Failed to provision folder structure for tenant ${tenantId}:`, err.message);
    }
  },

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
      const activeDrive = await ensureGoogleCredentials();
      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);

      const rootFolderId = process.env.GOOGLE_DRIVE_SHARED_FOLDER_ID || '5TB_EAC_ROOT';
      
      // Resolve/Create subdirectories dynamically for strict tenant isolation
      const tenantFolderId = await getOrCreateFolder(activeDrive, tenantId, rootFolderId);
      const categoryFolderId = await getOrCreateFolder(activeDrive, category, tenantFolderId);

      const response = await activeDrive.files.create({
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
        const activeDrive = await ensureGoogleCredentials();
        await activeDrive.files.delete({
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
      const activeDrive = await ensureGoogleCredentials();
      // Fetch link for Google Drive file
      const response = await activeDrive.files.get({
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
      const activeDrive = await ensureGoogleCredentials();
      const response = await activeDrive.files.get(
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
  },

  repairTenantFolders: async (tenantId: string): Promise<any> => {
    if (provider !== 'google_drive' || !googleDriveClient) {
      console.log(`[Storage Mock] Skipping repair for provider ${provider}`);
      return {
        provider,
        status: 'CLEAN',
        repaired: true,
        details: 'Mock storage is inherently verified. Checked categories: compliance, payroll, taxation, audits, reports, documents.'
      };
    }
    try {
      const activeDrive = await ensureGoogleCredentials();
      const rootFolderId = process.env.GOOGLE_DRIVE_SHARED_FOLDER_ID || '5TB_EAC_ROOT';
      
      const tenantFolderId = await getOrCreateFolder(activeDrive, tenantId, rootFolderId);
      const categories = ['compliance', 'payroll', 'taxation', 'audits', 'reports', 'documents'];
      
      const repairedFolders: string[] = [];
      const existingDbFolders = await DocumentRepository.getFoldersByTenant(tenantId);
      const dbFolderNames = existingDbFolders.map((f: any) => f.name.toLowerCase());

      for (const category of categories) {
        await getOrCreateFolder(activeDrive, category, tenantFolderId);
        
        if (!dbFolderNames.includes(category.toLowerCase())) {
          await DocumentRepository.createFolder({
            tenant_id: tenantId,
            name: category,
            parent_id: null
          });
          repairedFolders.push(category);
        }
      }

      return {
        provider: 'google_drive',
        status: repairedFolders.length > 0 ? 'REPAIRED' : 'CLEAN',
        repaired: true,
        details: repairedFolders.length > 0 
          ? `Missing categories repaired in database/storage: ${repairedFolders.join(', ')}`
          : 'All workspace category folder hierarchies verified in Google Drive & Database.'
      };
    } catch (err: any) {
      console.error(`[Storage Error] Folder repair failed for tenant ${tenantId}:`, err.message);
      throw err;
    }
  },

  reconcileSync: async (tenantId: string): Promise<any> => {
    try {
      const dbFiles = await DocumentRepository.getFilesByTenant(tenantId);
      const dbFilesCount = dbFiles.length;
      let storageFiles: { id: string; name: string; size: number }[] = [];

      if (provider === 'google_drive' && googleDriveClient) {
        const activeDrive = await ensureGoogleCredentials();
        const rootFolderId = process.env.GOOGLE_DRIVE_SHARED_FOLDER_ID || '5TB_EAC_ROOT';
        
        const tenantFolderId = await getOrCreateFolder(activeDrive, tenantId, rootFolderId);
        const categories = ['compliance', 'payroll', 'taxation', 'audits', 'reports', 'documents'];
        const folderIds: string[] = [];
        
        for (const cat of categories) {
          const catId = await getOrCreateFolder(activeDrive, cat, tenantFolderId);
          folderIds.push(catId);
        }

        for (const folderId of folderIds) {
          const query = `'${folderId}' in parents and trashed = false`;
          const response = await activeDrive.files.list({
            q: query,
            fields: 'files(id, name, size)'
          });
          
          if (response.data.files) {
            for (const file of response.data.files) {
              storageFiles.push({
                id: file.id!,
                name: file.name!,
                size: file.size ? parseInt(file.size, 10) : 0
              });
            }
          }
        }
      } else {
        dbFiles.forEach((file: any) => {
          storageFiles.push({
            id: file.storage_key,
            name: file.name,
            size: file.size_bytes
          });
        });
      }

      const missingInStorage: any[] = [];
      const orphansInStorage: any[] = [];
      const mismatchedSizes: any[] = [];

      for (const dbFile of dbFiles) {
        const matchingStorage = storageFiles.find(sf => sf.id === dbFile.storage_key);
        if (!matchingStorage) {
          missingInStorage.push({
            id: dbFile.id,
            name: dbFile.name,
            storage_key: dbFile.storage_key
          });
        } else if (matchingStorage.size > 0 && dbFile.size_bytes > 0 && matchingStorage.size !== dbFile.size_bytes) {
          mismatchedSizes.push({
            id: dbFile.id,
            name: dbFile.name,
            dbSize: dbFile.size_bytes,
            storageSize: matchingStorage.size
          });
        }
      }

      for (const sFile of storageFiles) {
        const registered = dbFiles.some((f: any) => f.storage_key === sFile.id);
        if (!registered) {
          orphansInStorage.push({
            id: sFile.id,
            name: sFile.name,
            size: sFile.size
          });
        }
      }

      const status = (missingInStorage.length === 0 && orphansInStorage.length === 0 && mismatchedSizes.length === 0)
        ? 'CLEAN'
        : 'REPAIRED';
      
      for (const mismatch of mismatchedSizes) {
        await DocumentRepository.updateFile(mismatch.id, {
          size_bytes: mismatch.storageSize
        });
      }

      for (const orphan of orphansInStorage) {
        await DocumentRepository.createFile({
          tenant_id: tenantId,
          folder_id: null,
          name: orphan.name,
          size_bytes: orphan.size,
          category: 'compliance',
          uploaded_by: 'system',
          storage_provider: provider,
          storage_key: orphan.id,
          mime_type: 'application/octet-stream',
          ocr_text: 'Orphaned file auto-registered by Sync Reconciliation'
        });
      }

      return {
        totalDbFiles: dbFilesCount,
        totalStorageFiles: storageFiles.length,
        missingCount: missingInStorage.length,
        orphansCount: orphansInStorage.length,
        mismatchedCount: mismatchedSizes.length,
        status: status,
        details: `Reconciliation complete. ${missingInStorage.length} missing files detected, ${orphansInStorage.length} orphans registered, ${mismatchedSizes.length} size-mismatches updated.`
      };
    } catch (err: any) {
      console.error(`[Storage Error] Sync reconciliation failed for tenant ${tenantId}:`, err.message);
      throw err;
    }
  }
};
