import { supabase } from '../config/supabase.js';

export class ComplianceRepository {
  static async getObligationsByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('compliance_obligations')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return data || [];
  }

  static async getObligationById(id: string, tenantId: string) {
    const { data, error } = await supabase
      .from('compliance_obligations')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    return data;
  }

  static async createObligation(obligation: {
    tenant_id: string;
    title: string;
    due_date: string;
    type: string;
    assigned_specialist_id: string | null;
    notes: string;
    compliance_score_impact?: number;
  }) {
    const { data, error } = await supabase
      .from('compliance_obligations')
      .insert(obligation)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateObligationStatus(id: string, tenantId: string, status: string) {
    const { data, error } = await supabase
      .from('compliance_obligations')
      .update({ status })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
