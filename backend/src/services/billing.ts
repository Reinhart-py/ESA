import { supabase } from '../config/supabase.js';
import { StripeAdapter } from './billing/stripeAdapter.js';
import { RazorpayAdapter } from './billing/razorpayAdapter.js';
import { PaddleAdapter } from './billing/paddleAdapter.js';
import { PaymentGatewayAdapter } from './billing/gatewayAdapter.js';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const stripeWebhook = process.env.STRIPE_WEBHOOK_SECRET || '';

const razorpayKey = process.env.RAZORPAY_KEY_ID || '';
const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || '';
const razorpayWebhook = process.env.RAZORPAY_WEBHOOK_SECRET || '';

const paddleVendor = process.env.PADDLE_VENDOR_ID || '';
const paddleApiKey = process.env.PADDLE_API_KEY || '';
const paddlePublicKey = process.env.PADDLE_PUBLIC_KEY || '';

export class BillingService {
  /**
   * Resolves active billing adapter matching workspace country profile.
   */
  static getAdapterForCountry(country: string): PaymentGatewayAdapter {
    const activeCountry = (country || 'US').toUpperCase();
    
    if (activeCountry === 'IN' && razorpayKey) {
      return new RazorpayAdapter(razorpayKey, razorpaySecret, razorpayWebhook);
    }
    
    if (['GB', 'DE', 'FR', 'IT', 'ES', 'NL'].includes(activeCountry) && paddleVendor) {
      return new PaddleAdapter(paddleVendor, paddleApiKey, paddlePublicKey);
    }
    
    // Default to Stripe for US and general global operations
    if (stripeSecret) {
      return new StripeAdapter(stripeSecret, stripeWebhook);
    }
    
    // Offline / Mock Fallback interface
    return {
      createCustomer: async () => 'mock_cust_id',
      createCheckoutSession: async (params) => ({
        url: `${params.successUrl}?mock_session_id=mock_sess_${Math.random().toString(36).substring(7)}`,
        sessionId: 'mock_sess_id'
      }),
      cancelSubscription: async () => {},
      verifyWebhook: async () => ({})
    };
  }

  static async bootstrapBillingPlans() {
    const { data: existing, error } = await supabase
      .from('billing_plans')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    if (existing && existing.length > 0) return;

    console.log('[Billing Service] Seeding default billing plans...');

    const defaultPlans = [
      {
        name: 'Starter Compliance Plan',
        code: 'starter',
        price_cents: 4900,
        currency: 'USD',
        features: JSON.stringify({ list: ['Standard Ledger', 'Compliance Checklists', 'Basic Vault (5GB)', 'Up to 3 Users'] }),
        storage_limit_bytes: 5 * 1024 * 1024 * 1024
      },
      {
        name: 'Growth Business Pro',
        code: 'pro',
        price_cents: 9900,
        currency: 'USD',
        features: JSON.stringify({ list: ['Advanced Ledger Pro', 'Dedicated Support Thread', 'Standard Vault (20GB)', 'Up to 10 Users', 'AI Copilot Engine'] }),
        storage_limit_bytes: 20 * 1024 * 1024 * 1024
      },
      {
        name: 'Enterprise Advisory Unlimited',
        code: 'enterprise',
        price_cents: 24900,
        currency: 'USD',
        features: JSON.stringify({ list: ['Dedicated Accountant Review', 'All Regional Compliance Packs', 'Enterprise Vault (100GB)', 'Unlimited Workspace Users', 'Priority Support Desk'] }),
        storage_limit_bytes: 100 * 1024 * 1024 * 1024
      }
    ];

    for (const plan of defaultPlans) {
      await supabase.from('billing_plans').insert(plan);
    }
  }

  /**
   * Generates a checkout session for a subscription plan matching client geographic profile.
   */
  static async createCheckoutSession(tenantId: string, priceId: string, successUrl: string, cancelUrl: string): Promise<string> {
    const { data: tenant, error: tenantErr } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (tenantErr || !tenant) {
      throw new Error('Tenant not found');
    }

    const { data: plan } = await supabase
      .from('billing_plans')
      .select('*')
      .or(`id.eq.${priceId},code.eq.${priceId}`)
      .maybeSingle();

    const planId = plan ? plan.id : null;
    let priceCents = plan ? plan.price_cents : 0;
    const currency = plan ? plan.currency : 'USD';

    // Apply Coupon if matching global rules
    let appliedDiscountCents = 0;
    const { data: activeCoupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('active', true)
      .maybeSingle();

    if (activeCoupon) {
      if (activeCoupon.percent_off) {
        appliedDiscountCents = Math.round(priceCents * (activeCoupon.percent_off / 100));
      } else if (activeCoupon.amount_off_cents) {
        appliedDiscountCents = activeCoupon.amount_off_cents;
      }
      priceCents = Math.max(0, priceCents - appliedDiscountCents);
    }

    // Resolve Regional Taxes
    let taxPercentage = 0;
    let taxType: 'GST' | 'VAT' | 'None' = 'None';
    const country = (tenant.country || 'US').toUpperCase();

    if (country === 'IN') {
      taxPercentage = 18; // 18% GST standard rate
      taxType = 'GST';
    } else if (['GB', 'DE', 'FR', 'IT', 'ES', 'NL'].includes(country)) {
      taxPercentage = 20; // 20% VAT standard regional rate
      taxType = 'VAT';
    }

    const taxAmountCents = Math.round(priceCents * (taxPercentage / 100));
    const finalAmountCents = priceCents + taxAmountCents;

    // Use active adapter routing
    const adapter = this.getAdapterForCountry(country);
    
    // Resolve gateway provider name representation
    let providerName: 'stripe' | 'razorpay' | 'paddle' | 'offline' = 'offline';
    if (country === 'IN' && razorpayKey) providerName = 'razorpay';
    else if (['GB', 'DE', 'FR', 'IT', 'ES', 'NL'].includes(country) && paddleVendor) providerName = 'paddle';
    else if (stripeSecret) providerName = 'stripe';

    // If offline configuration is triggered, seed mock entries
    if (providerName === 'offline') {
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      const nextPeriod = new Date();
      nextPeriod.setMonth(nextPeriod.getMonth() + 1);

      const subData = {
        tenant_id: tenantId,
        plan_id: planId,
        status: 'active',
        current_period_end: nextPeriod.toISOString(),
        provider: 'offline',
        tax_rate_percentage: taxPercentage,
        coupon_code: activeCoupon?.code || null
      };

      if (existingSub) {
        await supabase.from('subscriptions').update(subData).eq('tenant_id', tenantId);
      } else {
        await supabase.from('subscriptions').insert(subData);
      }

      // Record invoice including tax breakdown metrics
      await supabase.from('invoices').insert({
        tenant_id: tenantId,
        amount_cents: finalAmountCents,
        currency,
        status: 'paid',
        due_date: new Date().toISOString().split('T')[0],
        stripe_invoice_id: 'mock_inv_' + Math.random().toString(36).substring(7),
        tax_amount_cents: taxAmountCents,
        tax_type: taxType
      });

      return successUrl;
    }

    const session = await adapter.createCheckoutSession({
      tenantId,
      priceId: plan?.code || 'starter',
      successUrl,
      cancelUrl,
      currency,
      amountCents: finalAmountCents
    });

    return session.url;
  }

  /**
   * Unified Webhook Event router with signature validations.
   */
  static async handleWebhookEvent(provider: 'stripe' | 'razorpay' | 'paddle', signature: string, payload: Buffer): Promise<void> {
    const adapter = this.getAdapterForCountry(provider === 'razorpay' ? 'IN' : (provider === 'paddle' ? 'GB' : 'US'));
    const event = await adapter.verifyWebhook(signature, payload);

    // Record raw payload audit log for idempotency verification
    await supabase.from('billing_logs').insert({
      provider,
      event_type: event.type || 'webhook_event',
      payload: JSON.stringify(event),
      created_at: new Date().toISOString()
    });

    // Gateway-agnostic actions mapper
    if (provider === 'stripe') {
      switch (event.type) {
        case 'invoice.paid': {
          const invoiceObj = event.data.object;
          const subId = invoiceObj.subscription;
          
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('tenant_id')
            .eq('stripe_subscription_id', subId)
            .maybeSingle();

          if (sub?.tenant_id) {
            await supabase.from('invoices').insert({
              tenant_id: sub.tenant_id,
              amount_cents: invoiceObj.amount_paid,
              currency: invoiceObj.currency.toUpperCase(),
              status: 'paid',
              due_date: new Date().toISOString().split('T')[0],
              stripe_invoice_id: invoiceObj.id
            });
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const subObj = event.data.object;
          await supabase
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('stripe_subscription_id', subObj.id);
          break;
        }
        case 'customer.subscription.updated': {
          const subObj = event.data.object;
          await supabase
            .from('subscriptions')
            .update({
              status: subObj.status === 'active' ? 'active' : 'past_due',
              current_period_end: new Date(subObj.current_period_end * 1000).toISOString()
            })
            .eq('stripe_subscription_id', subObj.id);
          break;
        }
      }
    }
  }
}
