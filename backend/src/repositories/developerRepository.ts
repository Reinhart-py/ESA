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

  static async getActiveWebhooks(tenantId: string) {
    const { data, error } = await supabase
      .from('webhooks_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }
}
