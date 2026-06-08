import Stripe from 'stripe';
import dotenv from 'dotenv';
import { supabase } from '../config/supabase.js';

dotenv.config();

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
export const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16' as any
});

export class BillingService {
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
