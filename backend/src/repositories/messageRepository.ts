import { supabase } from '../config/supabase.js';

export class MessageRepository {
  static async getThreadsByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('message_threads')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return data || [];
  }

  static async getMessagesByThreads(threadIds: string[]) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .in('thread_id', threadIds);

    if (error) throw error;
    return data || [];
  }

  static async createMessage(message: { thread_id: string; sender_id: string; content: string }) {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
