import { supabase } from '../config/supabase.js';

export class AuditRepository {
  static async getLogsByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createLog(log: {
    tenant_id: string | null;
    user_id: string | null;
    user_identity: string;
    action: string;
    category: string;
    details: any;
    ip_address: string | null;
  }) {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert(log)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
