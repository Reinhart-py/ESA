import { supabase } from '../config/supabase.js';

export class DeveloperRepository {
  // API Keys
  static async createApiKey(key: {
    tenant_id: string;
    key_name: string;
    key_prefix: string;
    hashed_key: string;
    expires_at?: string | null;
  }) {
    const { data, error } = await supabase
      .from('api_keys')
      .insert(key)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getApiKeysByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async deleteApiKey(id: string, tenantId: string) {
    const { data, error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getApiKeyByHashedKey(hashedKey: string) {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('hashed_key', hashedKey)
      .single();

    if (error) return null;
    return data;
  }

  // Webhook Configuration
  static async createWebhookConfig(config: {
    tenant_id: string;
    url: string;
    secret: string;
  }) {
    const { data, error } = await supabase
      .from('webhooks_config')
      .insert(config)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getWebhookConfigsByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('webhooks_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async deleteWebhookConfig(id: string, tenantId: string) {
    const { data, error } = await supabase
      .from('webhooks_config')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateWebhookConfig(id: string, tenantId: string, updates: { url?: string; secret?: string; is_active?: boolean }) {
    const { data, error } = await supabase
      .from('webhooks_config')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }


  static async getActiveWebhooks(tenantId: string) {
    const { data, error } = await supabase
      .from('webhooks_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  // Webhook Delivery Logs
  static async getWebhookLogs(tenantId: string, webhookId?: string) {
    let query = supabase
      .from('developer_webhook_delivery_logs')
      .select('*')
      .eq('tenant_id', tenantId);
    
    if (webhookId) {
      query = query.eq('webhook_id', webhookId);
    }
    
    const { data, error } = await query.order('delivered_at', { ascending: false }).limit(100);
    if (error) throw error;
    return data || [];
  }

  static async logWebhookDelivery(entry: {
    tenant_id: string;
    webhook_id: string;
    event_type: string;
    payload: any;
    response_status: number;
    response_body?: string;
  }) {
    const { data, error } = await supabase
      .from('developer_webhook_delivery_logs')
      .insert(entry)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Rate Limits
  static async getRateLimits(tenantId: string) {
    const { data, error } = await supabase
      .from('developer_api_rate_limits')
      .select('*, api_keys(key_name)')
      .eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
  }

  static async setRateLimit(limit: {
    tenant_id: string;
    api_key_id: string;
    max_requests_per_minute: number;
  }) {
    const { data, error } = await supabase
      .from('developer_api_rate_limits')
      .upsert(limit, { onConflict: 'api_key_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // SDK Releases
  static async getSdkReleases() {
    const { data, error } = await supabase
      .from('developer_sdk_releases')
      .select('*')
      .order('released_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async createSdkRelease(release: {
    version: string;
    language: string;
    download_url: string;
  }) {
    const { data, error } = await supabase
      .from('developer_sdk_releases')
      .insert(release)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // API Documentation
  static async getApiDocs() {
    const { data, error } = await supabase
      .from('developer_api_docs')
      .select('*')
      .order('endpoint', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async createApiDoc(doc: {
    endpoint: string;
    method: string;
    description: string;
    request_schema?: any;
    response_schema?: any;
  }) {
    const { data, error } = await supabase
      .from('developer_api_docs')
      .insert(doc)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Webhook Queue
  static async getWebhookQueue(tenantId: string) {
    const { data, error } = await supabase
      .from('developer_webhook_events_queue')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async enqueueWebhookEvent(event: {
    tenant_id: string;
    event_type: string;
    payload: any;
    status?: string;
  }) {
    const { data, error } = await supabase
      .from('developer_webhook_events_queue')
      .insert(event)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async updateQueueItemStatus(
    id: string,
    status: string,
    attempts: number,
    nextAttemptAt?: string
  ) {
    const updatePayload: any = { status, attempts };
    if (nextAttemptAt) {
      updatePayload.next_attempt_at = nextAttemptAt;
    }
    const { data, error } = await supabase
      .from('developer_webhook_events_queue')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Developer API request logs from audit_logs
  static async getApiLogs(tenantId: string) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('category', 'Developer')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return data || [];
  }
}

