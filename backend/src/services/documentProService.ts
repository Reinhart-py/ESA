import crypto from 'crypto';
import * as archiver from 'archiver';
import { DocumentProRepository } from '../repositories/documentProRepository.js';
import { DocumentRepository } from '../repositories/documentRepository.js';
import { StorageService } from './storage.js';

export class DocumentProService {
  /**
   * Create an expiring secure share link for a file
   */
  static async generateSecureShare(tenantId: string, fileId: string, expiresInHours: number = 24) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

    return await DocumentProRepository.createSecureShare({
      tenant_id: tenantId,
      file_id: fileId,
      share_token: token,
      expires_at: expiresAt
    });
  }

  /**
   * Validate guest share token and retrieve file meta
   */
  static async validateShareToken(shareToken: string) {
    const share = await DocumentProRepository.getSecureShareByToken(shareToken);
    if (!share) {
      throw new Error('Invalid guest share token');
    }

    if (new Date() > new Date(share.expires_at)) {
      throw new Error('This secure share link has expired');
    }

    return share;
  }

  /**
   * Electronically sign a document vault item and generate cryptographic SHA-256 validation log
   */
  static async esignDocument(
    esignRequestId: string,
    tenantId: string,
    ipAddress: string,
    signatureText: string
  ) {
    const request = await DocumentProRepository.getESignRequestById(esignRequestId, tenantId);
    if (!request) {
      throw new Error('E-Sign request not found');
    }

    if (request.status === 'Signed') {
      throw new Error('Document is already signed');
    }

    const timestamp = new Date().toISOString();
    // Cryptographic audit footprint
    const signPayload = `${esignRequestId}|${tenantId}|${request.file_id}|${request.signer_email}|${signatureText}|${ipAddress}|${timestamp}`;
    const hash = crypto.createHash('sha256').update(signPayload).digest('hex');

    // Update Sign Request
    const signedRequest = await DocumentProRepository.signDocument(esignRequestId, tenantId, {
      signature_hash: hash,
      signed_at: timestamp,
      ip_address: ipAddress,
      status: 'Signed'
    });

    // Update File status to Approved
    await DocumentRepository.updateFileStatus(request.file_id, tenantId, 'Approved');

    return signedRequest;
  }

  /**
   * Package multiple file selections into a compressed ZIP stream
   */
  static async packageBulkZip(fileIds: string[], tenantId: string): Promise<any> {
    const archive = (archiver as any)('zip', {
      zlib: { level: 9 } // maximum compression
    });

    // We process asynchronously and pipe into the archive
    process.nextTick(async () => {
      try {
        for (const fileId of fileIds) {
          const file = await DocumentRepository.getFileById(fileId, tenantId);
          if (file && !file.is_deleted) {
            const fileStream = await StorageService.getFileStreamOrBuffer(file.storage_key);
            archive.append(fileStream, { name: file.name });
          }
        }
        await archive.finalize();
      } catch (err: any) {
        archive.emit('error', err);
      }
    });

    return archive;
  }
}
