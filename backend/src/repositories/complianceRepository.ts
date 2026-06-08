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

  // --- PHASE 9 ADDITIONS ---

  // Templates
  static async getTemplates() {
    const { data, error } = await supabase
      .from('compliance_templates')
      .select('*');

    if (error) throw error;
    return data || [];
  }

  static async getTemplatesByCountry(countryCode: string) {
    const { data, error } = await supabase
      .from('compliance_templates')
      .select('*')
      .eq('country_code', countryCode);

    if (error) throw error;
    return data || [];
  }

  static async createTemplate(template: {
    title: string;
    description?: string;
    type: string;
    frequency: string;
    country_code: string;
    month_offset?: number;
    day_offset?: number;
    compliance_score_impact?: number;
  }) {
    const { data, error } = await supabase
      .from('compliance_templates')
      .insert(template)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Alerts
  static async createAlert(alert: {
    tenant_id: string;
    obligation_id: string;
    alert_type: 'Warning' | 'Late' | 'Escalation';
  }) {
    const { data, error } = await supabase
      .from('compliance_alerts')
      .insert(alert)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getAlertsByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('compliance_alerts')
      .select('*, compliance_obligations(title, due_date)')
      .eq('tenant_id', tenantId)
      .order('sent_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Live Score Calculator
  static async calculateComplianceScore(tenantId: string): Promise<number> {
    const obligations = await this.getObligationsByTenant(tenantId);
    if (obligations.length === 0) return 100;

    let score = 100;
    const now = new Date();

    for (const ob of obligations) {
      const isFiled = ob.status === 'Filed';
      const isLate = ob.status === 'Late';
      const isOverdue = new Date(ob.due_date) < now && !isFiled;

      if (isLate || isOverdue) {
        const impact = ob.compliance_score_impact !== undefined ? ob.compliance_score_impact : 10;
        score -= impact;
      }
    }

    const finalScore = Math.max(0, score);

    // Save score to database
    await supabase
      .from('tenants')
      .update({ compliance_score: finalScore })
      .eq('id', tenantId);

    return finalScore;
  }
}
