import Stripe from 'stripe';
import dotenv from 'dotenv';
import { supabase } from '../config/supabase.js';

dotenv.config();

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
export const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16' as any
});

export class BillingService {
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
   * Generates a checkout session for a subscription plan
   */
  static async createCheckoutSession(tenantId: string, priceId: string, successUrl: string, cancelUrl: string): Promise<string> {
    // Fetch tenant name and email
    const { data: tenant, error: tenantErr } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single();

    if (tenantErr || !tenant) {
      throw new Error('Tenant not found');
    }

    // Attempt to resolve priceId to a plan in the database to see what they are buying
    const { data: plan } = await supabase
      .from('billing_plans')
      .select('*')
      .or(`id.eq.${priceId},code.eq.${priceId}`)
      .maybeSingle();

    if (!stripeSecret) {
      console.log('[Billing Service Mock] Stripe secret key is not set. Directly applying mock subscription upgrade offline.');
      
      const targetPlanId = plan ? plan.id : null;
      const priceCents = plan ? plan.price_cents : 0;

      // Update or Insert active subscription
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      const nextPeriod = new Date();
      nextPeriod.setMonth(nextPeriod.getMonth() + 1);

      if (existingSub) {
        await supabase
          .from('subscriptions')
          .update({
            plan_id: targetPlanId,
            status: 'active',
            current_period_end: nextPeriod.toISOString()
          })
          .eq('tenant_id', tenantId);
      } else {
        await supabase
          .from('subscriptions')
          .insert({
            tenant_id: tenantId,
            plan_id: targetPlanId,
            status: 'active',
            current_period_end: nextPeriod.toISOString()
          });
      }

      // Create a mock invoice for the payment
      await supabase.from('invoices').insert({
        tenant_id: tenantId,
        amount_cents: priceCents,
        status: 'paid',
        due_date: new Date().toISOString().split('T')[0],
        stripe_invoice_id: 'mock_stripe_inv_' + Math.random().toString(36).substring(7)
      });

      return successUrl;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { tenantId }
    });

    return session.url!;
  }

  /**
   * Handles Stripe webhooks to keep the database records synchronized with Stripe
   */
  static async handleWebhookEvent(signature: string, payload: Buffer): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    switch (event.type) {
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        const customerId = invoice.customer as string;
        const amountPaid = invoice.amount_paid;

        // Resolve tenant ID from subscription metadata or database
        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
        const tenantId = stripeSub.metadata.tenantId;

        if (tenantId) {
          // Record Invoice in Database
          await supabase.from('invoices').insert({
            tenant_id: tenantId,
            amount_cents: amountPaid,
            status: 'paid',
            due_date: new Date().toISOString().split('T')[0],
            stripe_invoice_id: invoice.id
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as Stripe.Subscription;
        const tenantId = stripeSub.metadata.tenantId;

        if (tenantId) {
          // Update status in Database
          await supabase
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('tenant_id', tenantId);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const stripeSub = event.data.object as Stripe.Subscription;
        const tenantId = stripeSub.metadata.tenantId;

        if (tenantId) {
          await supabase
            .from('subscriptions')
            .update({
              status: stripeSub.status === 'active' ? 'active' : 'past_due',
              current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString()
            })
            .eq('tenant_id', tenantId);
        }
        break;
      }
    }
  }
}
