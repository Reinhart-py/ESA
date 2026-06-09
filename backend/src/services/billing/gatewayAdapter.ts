export interface CheckoutSessionParams {
  tenantId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  currency: string;
  amountCents: number;
}

export interface CheckoutSessionResult {
  url: string;
  sessionId: string;
}

export interface PaymentGatewayAdapter {
  createCustomer(tenantName: string, email: string): Promise<string>;
  createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  verifyWebhook(signature: string, payload: Buffer): Promise<any>;
}
