import { supabase } from '../config/supabase.js';

export class SecurityRepository {
  // User Sessions
  static async getSessionsByUser(userId: string) {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createSession(session: {
    tenant_id: string;
    user_id: string;
    token: string;
    ip_address?: string;
    user_agent?: string;
    expires_at?: string;
  }) {
    const { data, error } = await supabase
      .from('user_sessions')
      .insert(session)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteSession(sessionId: string, userId: string) {
    const { data, error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Saved Searches
  static async getSavedSearches(userId: string) {
    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createSavedSearch(search: {
    tenant_id: string;
    user_id: string;
    name: string;
    query: string;
    filters?: any;
  }) {
    const { data, error } = await supabase
      .from('saved_searches')
      .insert(search)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteSavedSearch(id: string, userId: string) {
    const { data, error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Security Incidents
  static async getIncidentsByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('security_incident_reports')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createIncident(incident: {
    tenant_id: string;
    severity: string;
    title: string;
    description: string;
  }) {
    const { data, error } = await supabase
      .from('security_incident_reports')
      .insert(incident)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async resolveIncident(id: string, userId: string) {
    const { data, error } = await supabase
      .from('security_incident_reports')
      .update({
        status: 'resolved',
        resolved_by: userId,
        resolved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
