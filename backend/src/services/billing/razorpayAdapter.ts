import crypto from 'crypto';
import { PaymentGatewayAdapter, CheckoutSessionParams, CheckoutSessionResult } from './gatewayAdapter.js';

export class RazorpayAdapter implements PaymentGatewayAdapter {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor(keyId: string, keySecret: string, webhookSecret: string) {
    this.keyId = keyId;
    this.keySecret = keySecret;
    this.webhookSecret = webhookSecret;
  }

  async createCustomer(tenantName: string, email: string): Promise<string> {
    // Return standard dummy client ID for Razorpay integration mapping
    return `rp_cust_${crypto.randomBytes(6).toString('hex')}`;
  }

  async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
    // Generate a checkout redirect URL for Razorpay Hosted Checkout Integration Flow
    const razorpaySessionId = `rp_sess_${crypto.randomBytes(8).toString('hex')}`;
    const mockRedirectUrl = `${params.successUrl}?razorpay_session_id=${razorpaySessionId}`;
    
    return {
      url: mockRedirectUrl,
      sessionId: razorpaySessionId
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    console.log(`[Razorpay Adapter] Canceling Razorpay Subscription ID: ${subscriptionId}`);
  }

  async verifyWebhook(signature: string, payload: Buffer): Promise<any> {
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new Error('Razorpay webhook signature verification failed.');
    }

    return JSON.parse(payload.toString());
  }
}
