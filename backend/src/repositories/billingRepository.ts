import { supabase } from '../config/supabase.js';

export class BillingRepository {
  static async getSubscriptionByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, billing_plans(*)')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async getInvoicesByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
