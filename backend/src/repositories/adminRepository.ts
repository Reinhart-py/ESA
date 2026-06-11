import { supabase } from '../config/supabase.js';

export class AdminRepository {
  // Tenant Management
  static async getTenants(search?: string, type?: string) {
    let query = supabase.from('tenants').select('*');
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (type) {
      query = query.eq('business_type', type);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async createTenant(tenant: { name: string; business_type: string; country?: string; storage_limit_bytes?: number }) {
    const { data, error } = await supabase
      .from('tenants')
      .insert(tenant)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async getTenantDetails(id: string) {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    
    // Also fetch active suspension if any
    const { data: suspension } = await supabase
      .from('admin_tenant_suspensions')
      .select('*')
      .eq('tenant_id', id)
      .maybeSingle();

    return { ...data, suspension };
  }

  static async updateTenant(id: string, updates: Partial<{ name: string; business_type: string; country: string; storage_limit_bytes: number; compliance_score: number }>) {
    const { data, error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Suspensions
  static async suspendTenant(tenantId: string, suspendedBy: string, reason: string) {
    // 1. Insert suspension log
    const { error: suspensionErr } = await supabase
      .from('admin_tenant_suspensions')
      .insert({ tenant_id: tenantId, reason, suspended_by: suspendedBy });
    if (suspensionErr) throw suspensionErr;

    // 2. Set all tenant users to suspended
    const { error: userErr } = await supabase
      .from('users')
      .update({ status: 'suspended' })
      .eq('tenant_id', tenantId);
    if (userErr) throw userErr;

    // 3. Log security incident
    await this.logSecurityEvent({
      event_type: 'tenant.suspended',
      severity: 'high',
      message: `Tenant ${tenantId} suspended by admin ${suspendedBy}. Reason: ${reason}`,
      user_identity: suspendedBy
    });

    return { success: true };
  }

  static async unsuspendTenant(tenantId: string, unsuspendedBy: string) {
    // 1. Delete suspension log
    const { error: suspensionErr } = await supabase
      .from('admin_tenant_suspensions')
      .delete()
      .eq('tenant_id', tenantId);
    if (suspensionErr) throw suspensionErr;

    // 2. Set all tenant users to active
    const { error: userErr } = await supabase
      .from('users')
      .update({ status: 'active' })
      .eq('tenant_id', tenantId);
    if (userErr) throw userErr;

    // 3. Log security incident
    await this.logSecurityEvent({
      event_type: 'tenant.unsuspended',
      severity: 'medium',
      message: `Tenant ${tenantId} unsuspended by admin ${unsuspendedBy}`,
      user_identity: unsuspendedBy
    });

    return { success: true };
  }

  // Security Events Logs
  static async getSecurityEvents(eventType?: string, severity?: string) {
    let query = supabase.from('admin_security_events').select('*');
    if (eventType) {
      query = query.eq('event_type', eventType);
    }
    if (severity) {
      query = query.eq('severity', severity);
    }
    const { data, error } = await query.order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    return data || [];
  }

  static async logSecurityEvent(event: { event_type: string; severity?: string; message: string; user_identity?: string; ip_address?: string; details?: any }) {
    const { data, error } = await supabase
      .from('admin_security_events')
      .insert(event)
      .select()
      .single();
    if (error) {
      console.error('Failed to log security event:', error);
      return null;
    }
    return data;
  }

  // System Parameters
  static async getSystemParameters() {
    const { data, error } = await supabase
      .from('admin_system_parameters')
      .select('*')
      .order('key', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  static async updateSystemParameter(key: string, value: string, description?: string) {
    const { data, error } = await supabase
      .from('admin_system_parameters')
      .upsert({ key, value, description, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Telemetry
  static async getGlobalTelemetry() {
    const { data, error } = await supabase
      .from('admin_global_telemetry')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);
    if (error) throw error;
    return data || [];
  }

  static async recordTelemetry(telemetry: { cpu_usage: number; memory_usage_bytes: number; request_count?: number; error_count?: number; latency_ms_avg?: number }) {
    const { data, error } = await supabase
      .from('admin_global_telemetry')
      .insert(telemetry)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Migrations
  static async getMigrations() {
    const { data, error } = await supabase
      .from('admin_migration_history')
      .select('*')
      .order('applied_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async logMigration(migration: { version: string; name: string }) {
    const { data, error } = await supabase
      .from('admin_migration_history')
      .insert(migration)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // IP Whitelists
  static async getIpWhitelists() {
    const { data, error } = await supabase
      .from('admin_ip_whitelists')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async addIpWhitelist(ip: { ip_address: string; description?: string; created_by: string }) {
    const { data, error } = await supabase
      .from('admin_ip_whitelists')
      .insert(ip)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async deleteIpWhitelist(id: string) {
    const { error } = await supabase
      .from('admin_ip_whitelists')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  }
}
