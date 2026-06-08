import { supabase } from '../config/supabase.js';

export interface Notification {
  id?: string;
  tenant_id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'compliance' | 'task' | 'message' | 'document' | 'billing' | 'system' | 'marketplace';
  is_read?: boolean;
  reference_id?: string;
  created_at?: string;
}

export class NotificationRepository {
  /**
   * Creates a new notification for a user.
   */
  static async create(notification: Notification) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        tenant_id: notification.tenant_id,
        user_id: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        is_read: false,
        reference_id: notification.reference_id || null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Creates notifications for multiple users at once (broadcast).
   */
  static async broadcast(
    tenantId: string,
    userIds: string[],
    title: string,
    message: string,
    type: Notification['type'],
    referenceId?: string
  ) {
    const rows = userIds.map(userId => ({
      tenant_id: tenantId,
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
      reference_id: referenceId || null
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(rows)
      .select();

    if (error) throw error;
    return data || [];
  }

  /**
   * Gets all notifications for a user (newest first).
   */
  static async getByUser(userId: string, tenantId: string, limit = 50) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Gets unread count for a user.
   */
  static async getUnreadCount(userId: string, tenantId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Marks a single notification as read.
   */
  static async markRead(notificationId: string, userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Marks all notifications as read for a user.
   */
  static async markAllRead(userId: string, tenantId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('is_read', false);

    if (error) throw error;
    return { success: true };
  }

  /**
   * Deletes a notification.
   */
  static async delete(notificationId: string, userId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }
}
