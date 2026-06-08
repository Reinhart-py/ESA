import { supabase } from '../config/supabase.js';

export class SearchRepository {
  static async searchAll(tenantId: string, query: string) {
    const term = `%${query}%`;

    const [files, tasks, obligations] = await Promise.all([
      supabase
        .from('files')
        .select('id, name, category')
        .eq('tenant_id', tenantId)
        .ilike('name', term),
      supabase
        .from('tasks')
        .select('id, title, description')
        .eq('tenant_id', tenantId)
        .or(`title.ilike.${term},description.ilike.${term}`),
      supabase
        .from('compliance_obligations')
        .select('id, title, notes')
        .eq('tenant_id', tenantId)
        .or(`title.ilike.${term},notes.ilike.${term}`)
    ]);

    return {
      files: files.data || [],
      tasks: tasks.data || [],
      obligations: obligations.data || []
    };
  }
}
