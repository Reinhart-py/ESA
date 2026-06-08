import { supabase } from '../config/supabase.js';

export class AdminService {
  /**
   * Compiles system-wide SaaS stats and health metrics
   */
  static async getAdminMetrics() {
    // 1. Tenants count & storage usage
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, storage_used_bytes, name');

    if (tenantsError) throw tenantsError;

    let totalStorageUsed = 0;
    for (const t of tenants || []) {
      totalStorageUsed += Number(t.storage_used_bytes || 0);
    }

    // 2. Professionals count
    const { count: prosCount, error: prosError } = await supabase
      .from('professional_profiles')
      .select('*', { count: 'exact', head: true });

    if (prosError) throw prosError;

    // 3. Billing subscription MRR/ARR estimates
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*, billing_plans(*)');

    if (subError) throw subError;

    let systemMrrCents = 0;
    let activeSubscriptions = 0;
    for (const sub of subscriptions || []) {
      if (sub.status === 'active' && sub.billing_plans) {
        systemMrrCents += sub.billing_plans.price_cents;
        activeSubscriptions++;
      }
    }

    // 4. Open tickets count
    const { data: tickets, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id')
      .eq('status', 'Open');

    if (ticketError) throw ticketError;

    return {
      totalTenants: tenants?.length || 0,
      totalStorageUsedBytes: totalStorageUsed,
      totalProfessionals: prosCount || 0,
      systemMonthlyRevenueCents: systemMrrCents,
      activeSubscriptionsCount: activeSubscriptions,
      openTicketsCount: tickets?.length || 0
    };
  }

  /**
   * Retrieves professional profiles that are currently unverified
   */
  static async getPendingProfessionals() {
    const { data, error } = await supabase
      .from('professional_profiles')
      .select('*, users(full_name, email)')
      .eq('is_verified', false);

    if (error) throw error;
    return data || [];
  }

  /**
   * Approves or rejects a professional profile verification
   */
  static async verifyProfessional(userId: string, isVerified: boolean) {
    const { data, error } = await supabase
      .from('professional_profiles')
      .update({ is_verified: isVerified })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Updates custom storage quotas for a tenant
   */
  static async updateTenantQuota(tenantId: string, quotaBytes: number) {
    const { data, error } = await supabase
      .from('tenants')
      .update({ storage_limit_bytes: quotaBytes })
      .eq('id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
