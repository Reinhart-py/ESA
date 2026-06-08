import { supabase } from '../config/supabase.js';

export class DocumentProRepository {
  // Secure Shares
  static async createSecureShare(share: {
    tenant_id: string;
    file_id: string;
    share_token: string;
    expires_at: string;
  }) {
    const { data, error } = await supabase
      .from('secure_shares')
      .insert(share)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getSecureShareByToken(shareToken: string) {
    const { data, error } = await supabase
      .from('secure_shares')
      .select(`
        *,
        file:files (*)
      `)
      .eq('share_token', shareToken)
      .single();

    if (error) throw error;
    return data;
  }

  // E-Sign Requests
  static async createESignRequest(req: {
    tenant_id: string;
    file_id: string;
    signer_email: string;
  }) {
    const { data, error } = await supabase
      .from('esign_requests')
      .insert(req)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getESignRequestsByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('esign_requests')
      .select(`
        *,
        file:files (*)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getESignRequestById(id: string, tenantId: string) {
    const { data, error } = await supabase
      .from('esign_requests')
      .select(`
        *,
        file:files (*)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    return data;
  }

  static async signDocument(
    id: string,
    tenantId: string,
    update: {
      signature_hash: string;
      signed_at: string;
      ip_address: string;
      status: 'Signed';
    }
  ) {
    const { data, error } = await supabase
      .from('esign_requests')
      .update(update)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
