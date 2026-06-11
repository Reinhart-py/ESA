import { supabase } from '../config/supabase.js';

export class CrmRepository {
  // Accounts
  static async createAccount(account: { tenant_id: string; name: string; industry?: string; website?: string; annual_revenue?: string }) {
    const { data, error } = await supabase.from('crm_accounts').insert(account).select().single();
    if (error) throw error;
    return data;
  }

  static async getAccounts(tenantId: string) {
    const { data, error } = await supabase.from('crm_accounts').select('*').eq('tenant_id', tenantId).order('name');
    if (error) throw error;
    return data || [];
  }

  // Contacts
  static async createContact(contact: { tenant_id: string; account_id?: string; first_name: string; last_name: string; email: string; phone?: string; job_title?: string }) {
    const { data, error } = await supabase.from('crm_contacts').insert(contact).select().single();
    if (error) throw error;
    return data;
  }

  static async getContacts(tenantId: string) {
    const { data, error } = await supabase.from('crm_contacts').select('*, account:crm_accounts(*)').eq('tenant_id', tenantId).order('last_name');
    if (error) throw error;
    return data || [];
  }

  // Leads
  static async createLead(lead: { tenant_id: string; first_name: string; last_name: string; company?: string; email: string; phone?: string; source?: string; assigned_to?: string }) {
    const { data, error } = await supabase.from('crm_leads').insert(lead).select().single();
    if (error) throw error;
    return data;
  }

  static async getLeads(tenantId: string) {
    const { data, error } = await supabase.from('crm_leads').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async updateLead(id: string, tenantId: string, updates: any) {
    const { data, error } = await supabase.from('crm_leads').update(updates).eq('id', id).eq('tenant_id', tenantId).select().single();
    if (error) throw error;
    return data;
  }

  static async deleteLead(id: string, tenantId: string) {
    const { error } = await supabase.from('crm_leads').delete().eq('id', id).eq('tenant_id', tenantId);
    if (error) throw error;
    return true;
  }

  // Deals
  static async createDeal(deal: { tenant_id: string; account_id?: string; title: string; amount_cents: number; stage?: string; probability?: number; assigned_to?: string }) {
    const { data, error } = await supabase.from('crm_deals').insert(deal).select().single();
    if (error) throw error;
    return data;
  }

  static async getDeals(tenantId: string) {
    const { data, error } = await supabase.from('crm_deals').select('*, account:crm_accounts(*)').eq('tenant_id', tenantId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async updateDealStage(id: string, tenantId: string, stage: string, probability: number) {
    const { data, error } = await supabase.from('crm_deals').update({ stage, probability }).eq('id', id).eq('tenant_id', tenantId).select().single();
    if (error) throw error;
    return data;
  }

  // Activities
  static async logActivity(activity: { tenant_id: string; lead_id?: string; deal_id?: string; activity_type: string; subject: string; details?: string; logged_by?: string }) {
    const { data, error } = await supabase.from('crm_activities').insert(activity).select().single();
    if (error) throw error;
    return data;
  }

  static async getActivitiesByLead(leadId: string, tenantId: string) {
    const { data, error } = await supabase.from('crm_activities').select('*').eq('lead_id', leadId).eq('tenant_id', tenantId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
}
