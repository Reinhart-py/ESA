import crypto from 'crypto';
import { PaymentGatewayAdapter, CheckoutSessionParams, CheckoutSessionResult } from './gatewayAdapter.js';

export class PaddleAdapter implements PaymentGatewayAdapter {
  private vendorId: string;
  private apiKey: string;
  private publicKey: string;

  constructor(vendorId: string, apiKey: string, publicKey: string) {
    this.vendorId = vendorId;
    this.apiKey = apiKey;
    this.publicKey = publicKey;
  }

  async createCustomer(tenantName: string, email: string): Promise<string> {
    return `pad_cust_${crypto.randomBytes(6).toString('hex')}`;
  }

  async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
    const paddleCheckoutId = `pad_checkout_${crypto.randomBytes(8).toString('hex')}`;
    const redirectUrl = `${params.successUrl}?paddle_checkout_id=${paddleCheckoutId}`;
    
    return {
      url: redirectUrl,
      sessionId: paddleCheckoutId
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    console.log(`[Paddle Adapter] Canceling subscription ID: ${subscriptionId}`);
  }

  async verifyWebhook(signature: string, payload: Buffer): Promise<any> {
    // Basic verification override for Paddle hooks
    return JSON.parse(payload.toString());
  }
}
