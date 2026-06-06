// Swappable Enterprise Storage Service
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config();

const provider = process.env.STORAGE_PROVIDER || "google_drive";

// 1. R2/S3 Configuration Client
let s3Client = null;
if (provider === "cloudflare_r2" || provider === "aws_s3") {
  const endpoint = provider === "cloudflare_r2" 
    ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` 
    : undefined;

  s3Client = new S3Client({
    region: process.env.STORAGE_REGION || "auto",
    endpoint: endpoint,
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || "",
    },
  });
}

// 2. Google Drive Configuration Mock Client (swappable with googleapis library)
class GoogleDriveClient {
  constructor() {
    this.authConfig = {
      clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
      sharedFolderId: process.env.GOOGLE_DRIVE_SHARED_FOLDER_ID || "5TB_EAC_ROOT"
    };
  }

  async uploadFile(fileName, mimeType, buffer) {
    console.log(`[GoogleDriveClient] Uploading ${fileName} to Drive. Configured Folder: ${this.authConfig.sharedFolderId}`);
    // Swappable with actual implementation:
    // const drive = google.drive({ version: 'v3', auth });
    // const response = await drive.files.create({ requestBody: { name: fileName, parents: [this.authConfig.sharedFolderId] }, media: { body: buffer } });
    // return response.data.id;
    return `gdrive_file_id_${Date.now()}`;
  }

  async deleteFile(fileId) {
    console.log(`[GoogleDriveClient] Deleting file ${fileId} from Drive.`);
    // drive.files.delete({ fileId });
    return true;
  }
}

const gDriveClient = new GoogleDriveClient();

export const StorageService = {
  getProviderName: () => provider,

  // Generates a pre-signed URL or a mock Google Drive upload link
  getUploadEndpoint: async (fileName, category, tenantId) => {
    const fileKey = `${tenantId}/${category}/${Date.now()}_${fileName}`;
    const bucket = process.env.STORAGE_BUCKET_NAME || "eac-solutions-vault";

    if (s3Client) {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: fileKey,
      });
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      return {
        provider,
        uploadUrl,
        fileKey,
        bucket
      };
    } else {
      // Return simulated upload descriptor for Google Drive
      return {
        provider: "google_drive",
        uploadUrl: `/api/documents/upload-drive-mock`,
        fileKey: `gdrive_path_${fileKey}`,
        bucket: "5TB_GoogleDrive_EAC"
      };
    }
  },

  // Direct file delete interface
  deleteObject: async (fileKey, bucket) => {
    if (s3Client) {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: fileKey,
      });
      await s3Client.send(command);
      return true;
    } else {
      await gDriveClient.deleteFile(fileKey);
      return true;
    }
  }
};
