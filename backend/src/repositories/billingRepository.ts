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

  // Invoices CRUD
  static async createInvoice(invoice: { tenant_id: string; amount_cents: number; currency?: string; status: string; due_date: string }) {
    const { data, error } = await supabase
      .from('invoices')
      .insert(invoice)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getInvoicesByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        items:billing_invoice_items(*)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getInvoiceById(id: string, tenantId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        items:billing_invoice_items(*)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateInvoice(id: string, tenantId: string, updates: any) {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteInvoice(id: string, tenantId: string) {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return true;
  }

  // Invoice Items
  static async createInvoiceItems(items: Array<{ invoice_id: string; description: string; quantity?: number; unit_price_cents: number; tax_rate_id?: string; product_id?: string }>) {
    const { data, error } = await supabase
      .from('billing_invoice_items')
      .insert(items)
      .select();

    if (error) throw error;
    return data;
  }

  // Products
  static async getProducts(tenantId: string) {
    const { data, error } = await supabase
      .from('billing_products')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  static async createProduct(product: { tenant_id: string; name: string; price_cents: number; sku?: string }) {
    const { data, error } = await supabase
      .from('billing_products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Coupons
  static async getCoupons(tenantId: string) {
    const { data, error } = await supabase
      .from('billing_coupons')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('code');

    if (error) throw error;
    return data || [];
  }

  static async createCoupon(coupon: { tenant_id: string; code: string; discount_percent: number; expires_at?: string }) {
    const { data, error } = await supabase
      .from('billing_coupons')
      .insert(coupon)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Tax Rates
  static async getTaxRates(tenantId: string) {
    const { data, error } = await supabase
      .from('billing_tax_rates')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  static async createTaxRate(taxRate: { tenant_id: string; name: string; rate_percent: number }) {
    const { data, error } = await supabase
      .from('billing_tax_rates')
      .insert(taxRate)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Payment Intents
  static async createPaymentIntent(intent: { tenant_id: string; invoice_id: string; stripe_payment_intent_id: string; amount_cents: number; status: string }) {
    const { data, error } = await supabase
      .from('billing_payment_intents')
      .insert(intent)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Dunning Logs
  static async createDunningLog(log: { tenant_id: string; invoice_id: string; attempt_number: number; notification_sent?: boolean; next_retry_at?: string }) {
    const { data, error } = await supabase
      .from('billing_dunning_logs')
      .insert(log)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
