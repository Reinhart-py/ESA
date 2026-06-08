import { supabase } from '../config/supabase.js';

export class ComplianceFilingRepository {
  static async getCompliancePacks() {
    const { data, error } = await supabase
      .from('compliance_packs')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createCompliancePack(pack: {
    name: string;
    country_code: string;
    authority: string;
    description?: string;
    rules: any[];
  }) {
    const { data, error } = await supabase
      .from('compliance_packs')
      .insert(pack)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getFilingSubmissions(tenantId: string) {
    const { data, error } = await supabase
      .from('filing_submissions')
      .select(`
        *,
        obligation:compliance_obligations (*),
        evidence:files (*)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getFilingSubmissionById(id: string, tenantId: string) {
    const { data, error } = await supabase
      .from('filing_submissions')
      .select(`
        *,
        obligation:compliance_obligations (*),
        evidence:files (*)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    return data;
  }

  static async createFilingSubmission(submission: {
    tenant_id: string;
    obligation_id: string;
    status: 'Draft' | 'Under Review';
    evidence_file_id?: string | null;
    comments?: string | null;
  }) {
    const { data, error } = await supabase
      .from('filing_submissions')
      .insert(submission)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateFilingSubmission(
    id: string,
    tenantId: string,
    update: {
      status?: 'Draft' | 'Under Review' | 'Approved' | 'Rejected' | 'Filed';
      evidence_file_id?: string | null;
      comments?: string | null;
      reviewed_by?: string | null;
      reviewed_at?: string | null;
    }
  ) {
    const { data, error } = await supabase
      .from('filing_submissions')
      .update(update)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
