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
    content_hash?: string;
    retention_until?: string;
    is_legal_hold?: boolean;
    ocr_text?: string;
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
    // Check retention and legal hold before deletion
    const currentFile = await supabase
      .from('files')
      .select('retention_until, is_legal_hold')
      .eq('id', fileId)
      .eq('tenant_id', tenantId)
      .single();

    if (currentFile.data) {
      if (currentFile.data.is_legal_hold) {
        throw new Error('This document is flagged under legal hold and cannot be deleted.');
      }
      if (currentFile.data.retention_until && new Date(currentFile.data.retention_until) > new Date()) {
        throw new Error('This document is within its retention period and cannot be deleted.');
      }
    }

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

  static async updateFileStatus(fileId: string, tenantId: string, status: 'Reviewing' | 'Approved' | 'Rejected') {
    const { data, error } = await supabase
      .from('files')
      .update({ status })
      .eq('id', fileId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getDeletedFilesByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_deleted', true);

    if (error) throw error;
    return data || [];
  }

  static async restoreFile(fileId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('files')
      .update({ is_deleted: false })
      .eq('id', fileId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateFileRetention(fileId: string, tenantId: string, retentionUntil: string | null, isLegalHold: boolean) {
    const { data, error } = await supabase
      .from('files')
      .update({
        retention_until: retentionUntil,
        is_legal_hold: isLegalHold
      })
      .eq('id', fileId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async checkDuplicateHash(tenantId: string, contentHash: string) {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('content_hash', contentHash)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async searchFilesByOcrText(tenantId: string, query: string) {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_deleted', false)
      .ilike('ocr_text', `%${query}%`);

    if (error) throw error;
    return data || [];
  }

  static async getFileByName(tenantId: string, name: string, folderId: string | null) {
    let queryBuilder = supabase
      .from('files')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('name', name)
      .eq('is_deleted', false);
    
    if (folderId) {
      queryBuilder = queryBuilder.eq('folder_id', folderId);
    } else {
      queryBuilder = queryBuilder.is('folder_id', null);
    }
    
    const { data, error } = await queryBuilder.maybeSingle();
    if (error) throw error;
    return data;
  }

  static async createVersion(version: { file_id: string; version: number; size_bytes: number; storage_key: string; uploaded_by: string | null }) {
    const { data, error } = await supabase
      .from('file_versions')
      .insert(version)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async updateFile(fileId: string, updates: Partial<any>) {
    const { data, error } = await supabase
      .from('files')
      .update(updates)
      .eq('id', fileId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async getFileVersions(fileId: string) {
    const { data, error } = await supabase
      .from('file_versions')
      .select('*')
      .eq('file_id', fileId)
      .order('version', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getVersionById(versionId: string) {
    const { data, error } = await supabase
      .from('file_versions')
      .select('*')
      .eq('id', versionId)
      .single();
    if (error) throw error;
    return data;
  }

  static async deleteVersion(versionId: string) {
    const { error } = await supabase
      .from('file_versions')
      .delete()
      .eq('id', versionId);
    if (error) throw error;
    return true;
  }

  static async getStorageAnalytics(tenantId: string) {
    const { data, error } = await supabase
      .from('files')
      .select('size_bytes, category, created_at')
      .eq('tenant_id', tenantId)
      .eq('is_deleted', false);
    if (error) throw error;
    return data || [];
  }
}

