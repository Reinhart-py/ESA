import { supabase } from '../config/supabase.js';

export class AiRepository {
  // Chat Logs
  static async getChatLogs(tenantId: string, userId: string) {
    const { data, error } = await supabase
      .from('ai_chat_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;
    return data || [];
  }

  static async logChat(log: {
    tenant_id: string;
    user_id: string;
    user_query: string;
    ai_response: string;
  }) {
    const { data, error } = await supabase
      .from('ai_chat_logs')
      .insert(log)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Document Embeddings
  static async saveDocEmbeddings(embeddings: Array<{
    tenant_id: string;
    document_id: string;
    chunk_content: string;
    embedding: number[];
  }>) {
    const { data, error } = await supabase
      .from('ai_document_embeddings')
      .insert(embeddings)
      .select();

    if (error) throw error;
    return data || [];
  }

  static async searchDocChunks(tenantId: string, queryTerms: string[]) {
    // Basic fallback keyword matching query
    let query = supabase
      .from('ai_document_embeddings')
      .select('*')
      .eq('tenant_id', tenantId);

    if (queryTerms.length > 0) {
      // Apply primary search query term filter
      query = query.ilike('chunk_content', `%${queryTerms[0]}%`);
    }

    const { data, error } = await query.limit(5);
    if (error) throw error;
    return data || [];
  }
}
