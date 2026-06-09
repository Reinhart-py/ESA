import { supabase } from '../config/supabase.js';
import { DocumentRepository } from '../repositories/documentRepository.js';
import { AuditRepository } from '../repositories/auditRepository.js';
import { EmailService } from './email.js';

export class WorkflowService {
  static async approveDocument(fileId: string, tenantId: string, userId: string, reviewerIdentity: string): Promise<any> {
    const file = await DocumentRepository.getFileById(fileId, tenantId);
    if (!file) throw new Error('Document not found');

    const updated = await DocumentRepository.updateFile(fileId, {
      status: 'Approved',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString()
    });

    // Write audit log
    await AuditRepository.createLog({
      tenant_id: tenantId,
      user_id: userId,
      user_identity: reviewerIdentity,
      action: `Approved document: ${file.name}`,
      category: 'Files',
      details: { fileId, status: 'Approved' },
      ip_address: null
    });

    // Try to notify the owner/uploader
    if (file.uploaded_by) {
      try {
        const { data: owner } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', file.uploaded_by)
          .single();

        if (owner && owner.email) {
          await EmailService.sendDeadlineNotification(
            owner.email,
            owner.full_name || 'Uploader',
            `Document Approved: ${file.name}`,
            `Your uploaded document has been approved by ${reviewerIdentity}.`
          );
        }
      } catch (err: any) {
        console.warn('Failed to send approval email notification:', err.message);
      }
    }

    return updated;
  }

  static async rejectDocument(fileId: string, tenantId: string, userId: string, reviewerIdentity: string, reason: string): Promise<any> {
    const file = await DocumentRepository.getFileById(fileId, tenantId);
    if (!file) throw new Error('Document not found');

    const updated = await DocumentRepository.updateFile(fileId, {
      status: 'Rejected',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason
    });

    await AuditRepository.createLog({
      tenant_id: tenantId,
      user_id: userId,
      user_identity: reviewerIdentity,
      action: `Rejected document: ${file.name}`,
      category: 'Files',
      details: { fileId, status: 'Rejected', reason },
      ip_address: null
    });

    if (file.uploaded_by) {
      try {
        const { data: owner } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', file.uploaded_by)
          .single();

        if (owner && owner.email) {
          await EmailService.sendDeadlineNotification(
            owner.email,
            owner.full_name || 'Uploader',
            `Document Rejected: ${file.name}`,
            `Your uploaded document has been rejected. Reason: ${reason}`
          );
        }
      } catch (err: any) {
        console.warn('Failed to send rejection email notification:', err.message);
      }
    }

    return updated;
  }

  static async assignReviewer(fileId: string, tenantId: string, assigneeId: string, userId: string, identity: string): Promise<any> {
    const file = await DocumentRepository.getFileById(fileId, tenantId);
    if (!file) throw new Error('Document not found');

    const updated = await DocumentRepository.updateFile(fileId, {
      assigned_reviewer_id: assigneeId
    });

    await AuditRepository.createLog({
      tenant_id: tenantId,
      user_id: userId,
      user_identity: identity,
      action: `Assigned review for ${file.name}`,
      category: 'Files',
      details: { fileId, assigneeId },
      ip_address: null
    });

    return updated;
  }

  static async runEscalationRoutine(): Promise<any> {
    // Escalate any "Reviewing" document that was uploaded more than 48 hours ago and not yet approved/rejected.
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: pendingFiles, error } = await supabase
      .from('files')
      .select('*')
      .eq('status', 'Reviewing')
      .lt('created_at', fortyEightHoursAgo)
      .eq('is_deleted', false);

    if (error) throw error;
    if (!pendingFiles || pendingFiles.length === 0) {
      return { status: 'CLEAN', escalatedCount: 0 };
    }

    const escalated: string[] = [];
    for (const file of pendingFiles) {
      // Auto escalate: flag in details/logs and assign to admin or notify tenant owner
      await DocumentRepository.updateFile(file.id, {
        is_escalated: true
      });

      // Write system log
      await AuditRepository.createLog({
        tenant_id: file.tenant_id,
        user_id: null,
        user_identity: 'System Scheduler',
        action: `Escalated document review: ${file.name}`,
        category: 'Files',
        details: { fileId: file.id, reason: 'Pending review > 48 hours' },
        ip_address: null
      });

      escalated.push(file.name);
    }

    return {
      status: 'ESCALATED',
      escalatedCount: pendingFiles.length,
      details: `Escalated ${pendingFiles.length} files: ${escalated.join(', ')}`
    };
  }

  static async runExpirationRoutine(): Promise<any> {
    // Find files whose retention_until has elapsed, and mark them as expired / eligible for purge
    const now = new Date().toISOString();

    const { data: expiredFiles, error } = await supabase
      .from('files')
      .select('*')
      .lte('retention_until', now)
      .eq('is_deleted', false);

    if (error) throw error;
    if (!expiredFiles || expiredFiles.length === 0) {
      return { status: 'CLEAN', expiredCount: 0 };
    }

    for (const file of expiredFiles) {
      // Mark as expired
      await DocumentRepository.updateFile(file.id, {
        retention_expired: true
      });

      await AuditRepository.createLog({
        tenant_id: file.tenant_id,
        user_id: null,
        user_identity: 'System Scheduler',
        action: `Document retention period expired: ${file.name}`,
        category: 'Files',
        details: { fileId: file.id, retentionUntil: file.retention_until },
        ip_address: null
      });
    }

    return {
      status: 'EXPIRED',
      expiredCount: expiredFiles.length,
      details: `Retention expired for ${expiredFiles.length} files.`
    };
  }
}
