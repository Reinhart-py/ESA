import { supabase } from '../config/supabase.js';

export class DocumentRepository {
  static async getFoldersByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return data || [];
  }

  static async getFilesByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_deleted', false);

    if (error) throw error;
    return data || [];
  }

  static async getFileById(fileId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    return data;
  }

  static async createFolder(folder: { tenant_id: string; name: string; parent_id: string | null }) {
    const { data, error } = await supabase
      .from('folders')
      .insert(folder)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createFile(file: {
    tenant_id: string;
    folder_id: string | null;
    name: string;
    size_bytes: number;
    category: string;
    uploaded_by: string;
    storage_provider: string;
    storage_key: string;
    mime_type: string;
  }) {
    const { data, error } = await supabase
      .from('files')
      .insert(file)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async softDeleteFile(fileId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('files')
      .update({ is_deleted: true })
      .eq('id', fileId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
