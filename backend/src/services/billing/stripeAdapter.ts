import Stripe from 'stripe';
import { PaymentGatewayAdapter, CheckoutSessionParams, CheckoutSessionResult } from './gatewayAdapter.js';

export class StripeAdapter implements PaymentGatewayAdapter {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(apiKey: string, webhookSecret: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16' as any
    });
    this.webhookSecret = webhookSecret;
  }

  async createCustomer(tenantName: string, email: string): Promise<string> {
    const customer = await this.stripe.customers.create({
      name: tenantName,
      email: email
    });
    return customer.id;
  }

  async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: {
            name: `EAC Solutions Plan - ${params.priceId.toUpperCase()}`
          },
          unit_amount: params.amountCents,
          recurring: { interval: 'month' }
        },
        quantity: 1
      }],
      mode: 'subscription',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: { tenantId: params.tenantId }
    });

    return {
      url: session.url || '',
      sessionId: session.id
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.stripe.subscriptions.cancel(subscriptionId);
  }

  async verifyWebhook(signature: string, payload: Buffer): Promise<any> {
    return this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
  }
}
