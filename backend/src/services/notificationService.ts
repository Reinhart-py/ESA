import { NotificationRepository } from '../repositories/notificationRepository.js';
import { EmailService } from './email.js';

export interface NotificationEvent {
  tenantId: string;
  userId: string;
  type: 'compliance' | 'task' | 'message' | 'document' | 'billing' | 'system' | 'marketplace';
  title: string;
  message: string;
  referenceId?: string;
  sendEmail?: boolean;
}

export class NotificationService {
  /**
   * Dispatches a notification to the database and optionally triggers an email alert.
   */
  static async send(event: NotificationEvent) {
    // 1. Write in-app notification to Database via repository
    const notification = await NotificationRepository.create({
      tenant_id: event.tenantId,
      user_id: event.userId,
      title: event.title,
      message: event.message,
      type: event.type,
      reference_id: event.referenceId
    });

    // 2. Dispatch mock/real email if specified
    if (event.sendEmail) {
      try {
        await EmailService.sendEmail({
          to: event.userId, // Using userId as placeholder for email target lookup
          subject: event.title,
          body: `
            <h3>EAC Solutions Notification Alert</h3>
            <p>${event.message}</p>
            <hr />
            <p style="font-size: 0.8rem; color: #666;">This is an automated operational alert regarding your EAC Solutions tenant workspace.</p>
          `
        });
      } catch (err) {
        console.error('Failed to dispatch email alert for notification:', err);
      }
    }

    return notification;
  }

  /**
   * Send notification for task assignments.
   */
  static async notifyTaskAssigned(tenantId: string, userId: string, taskTitle: string, taskId: string) {
    return this.send({
      tenantId,
      userId,
      type: 'task',
      title: 'New Task Assigned',
      message: `You have been assigned to task: "${taskTitle}". Please review details in your tasks console.`,
      referenceId: taskId,
      sendEmail: true
    });
  }

  /**
   * Send notification for upcoming compliance deadlines.
   */
  static async notifyComplianceDeadline(tenantId: string, userId: string, obligationTitle: string, dueDate: string, obligationId: string) {
    return this.send({
      tenantId,
      userId,
      type: 'compliance',
      title: 'Compliance Obligation Upcoming',
      message: `The filing obligation "${obligationTitle}" is due on ${dueDate}. Please submit evidence assets.`,
      referenceId: obligationId,
      sendEmail: true
    });
  }

  /**
   * Send notification for messages.
   */
  static async notifyMessageReceived(tenantId: string, userId: string, senderName: string, threadId: string) {
    return this.send({
      tenantId,
      userId,
      type: 'message',
      title: 'New Message from Steward',
      message: `Your professional accounting steward ${senderName} sent you a new message.`,
      referenceId: threadId,
      sendEmail: false
    });
  }

  /**
   * Send notification for shared documents.
   */
  static async notifyFileShared(tenantId: string, userId: string, fileName: string, fileId: string) {
    return this.send({
      tenantId,
      userId,
      type: 'document',
      title: 'Document Shared in Vault',
      message: `A new document "${fileName}" has been shared with your workspace vault.`,
      referenceId: fileId,
      sendEmail: false
    });
  }
}
