import { supabase } from '../config/supabase.js';

export class MessageRepository {
  /**
   * Get all threads for a tenant, with latest message and participant count.
   */
  static async getThreadsByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('message_threads')
      .select(`
        *,
        participants:message_participants (
          user_id,
          user:users (id, full_name, email, avatar_url)
        ),
        messages (
          id, content, created_at, sender_id,
          sender:users (id, full_name, avatar_url)
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single thread with all messages and participants.
   */
  static async getThreadById(threadId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('message_threads')
      .select(`
        *,
        participants:message_participants (
          user_id,
          user:users (id, full_name, email, avatar_url)
        )
      `)
      .eq('id', threadId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all messages in a thread (newest at end).
   */
  static async getMessagesByThread(threadId: string, limit = 100) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users (id, full_name, avatar_url)
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new thread with participants.
   */
  static async createThread(
    tenantId: string,
    subject: string,
    participantIds: string[]
  ) {
    // Create thread
    const { data: thread, error: threadErr } = await supabase
      .from('message_threads')
      .insert({ tenant_id: tenantId, subject })
      .select()
      .single();

    if (threadErr) throw threadErr;

    // Add participants
    const participants = [...new Set(participantIds)].map(userId => ({
      thread_id: thread.id,
      user_id: userId
    }));

    const { error: partErr } = await supabase
      .from('message_participants')
      .insert(participants);

    if (partErr) throw partErr;

    return thread;
  }

  /**
   * Send a message in a thread.
   */
  static async createMessage(message: {
    thread_id: string;
    sender_id: string;
    content: string;
    attachment_file_ids?: string[];
  }) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        thread_id: message.thread_id,
        sender_id: message.sender_id,
        content: message.content,
        attachment_file_ids: message.attachment_file_ids || []
      })
      .select(`
        *,
        sender:users (id, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Add a participant to an existing thread.
   */
  static async addParticipant(threadId: string, userId: string) {
    const { error } = await supabase
      .from('message_participants')
      .upsert({ thread_id: threadId, user_id: userId });

    if (error) throw error;
    return { success: true };
  }

  /**
   * Get message read receipts for a thread.
   */
  static async getReadReceipts(threadId: string) {
    const { data, error } = await supabase
      .from('message_read_receipts')
      .select(`
        *,
        user:users (id, full_name, avatar_url)
      `)
      .eq('thread_id', threadId)
      .order('read_at', { ascending: false });

    if (error) return []; // Non-fatal if table doesn't exist yet
    return data || [];
  }

  /**
   * Mark a thread as read for a user.
   */
  static async markThreadRead(threadId: string, userId: string) {
    const { error } = await supabase
      .from('message_read_receipts')
      .upsert({
        thread_id: threadId,
        user_id: userId,
        read_at: new Date().toISOString()
      });

    if (error) return; // Non-fatal
  }

  /**
   * Get threads for a specific user (where they're a participant).
   */
  static async getThreadsForUser(userId: string, tenantId: string) {
    const { data: participantRows, error: pErr } = await supabase
      .from('message_participants')
      .select('thread_id')
      .eq('user_id', userId);

    if (pErr) throw pErr;
    const threadIds = (participantRows || []).map(r => r.thread_id);
    if (!threadIds.length) return [];

    const { data, error } = await supabase
      .from('message_threads')
      .select(`
        *,
        participants:message_participants (
          user_id,
          user:users (id, full_name, email, avatar_url)
        )
      `)
      .in('id', threadIds)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
