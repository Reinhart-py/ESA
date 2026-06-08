import { supabase } from '../config/supabase.js';

export class KYCRepository {
  static async createVerification(verification: {
    tenant_id: string;
    user_id: string;
    document_type: string;
    document_status: string;
  }) {
    const { data, error } = await supabase
      .from('kyc_verifications')
      .insert(verification)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getVerificationsByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('kyc_verifications')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return data || [];
  }

  static async updateVerificationStatus(
    id: string,
    status: 'pending' | 'verified' | 'rejected',
    verifiedBy: string,
    notes?: string
  ) {
    const { data, error } = await supabase
      .from('kyc_verifications')
      .update({
        document_status: status,
        verified_at: new Date().toISOString(),
        verified_by: verifiedBy,
        notes: notes || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
