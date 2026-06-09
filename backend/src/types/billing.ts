export interface BillingPlan {
  id: string;
  name: string;
  code: string;
  price_cents: number;
  currency: string;
  features: string; // JSON string of features list
  storage_limit_bytes: number;
  created_at?: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string | null;
  status: 'active' | 'past_due' | 'unpaid' | 'canceled' | 'trialing';
  current_period_end: string;
  stripe_subscription_id?: string;
  razorpay_subscription_id?: string;
  paddle_subscription_id?: string;
  provider: 'stripe' | 'razorpay' | 'paddle' | 'offline';
  trial_start?: string;
  trial_end?: string;
  cancel_at_period_end?: boolean;
  coupon_code?: string;
  tax_rate_percentage?: number;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  amount_cents: number;
  currency: string;
  status: 'paid' | 'unpaid' | 'past_due' | 'void' | 'refunded';
  due_date: string;
  stripe_invoice_id?: string;
  razorpay_invoice_id?: string;
  paddle_invoice_id?: string;
  tax_amount_cents?: number;
  tax_type?: 'GST' | 'VAT' | 'None';
  created_at?: string;
}

export interface PaymentGatewayConfig {
  provider: 'stripe' | 'razorpay' | 'paddle';
  apiKey: string;
  webhookSecret: string;
}
