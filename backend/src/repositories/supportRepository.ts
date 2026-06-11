import { supabase } from '../config/supabase.js';

export class SupportRepository {
  static async getTicketsByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getTicketById(ticketId: string, tenantId: string) {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    return data;
  }

  static async createTicket(ticket: {
    tenant_id: string;
    subject: string;
    description: string;
    category: string;
    priority: string;
    created_by: string;
  }) {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert(ticket)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTicket(ticketId: string, updates: Partial<any>, tenantId: string) {
    const { data, error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteTicket(ticketId: string, tenantId: string) {
    const { error } = await supabase
      .from('support_tickets')
      .delete()
      .eq('id', ticketId)
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return true;
  }

  // --- Support Comments / Messages ---
  static async getCommentsByTicket(ticketId: string) {
    const { data, error } = await supabase
      .from('support_comments')
      .select('*, user:users(full_name, email)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createComment(comment: {
    ticket_id: string;
    user_id: string;
    content: string;
  }) {
    const { data, error } = await supabase
      .from('support_comments')
      .insert(comment)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // --- SLA Rules ---
  static async getSlaRules(tenantId: string) {
    const { data, error } = await supabase
      .from('support_sla_rules')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return data || [];
  }

  static async createSlaRule(rule: {
    tenant_id: string;
    priority: string;
    response_time_hours: number;
    resolution_time_hours: number;
  }) {
    const { data, error } = await supabase
      .from('support_sla_rules')
      .insert(rule)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // --- Categories ---
  static async getCategories(tenantId: string) {
    const { data, error } = await supabase
      .from('support_categories')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return data || [];
  }

  static async createCategory(category: {
    tenant_id: string;
    name: string;
    description?: string;
  }) {
    const { data, error } = await supabase
      .from('support_categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // --- SLA Breaches ---
  static async getSlaBreaches(tenantId: string) {
    const { data, error } = await supabase
      .from('support_sla_breaches')
      .select('*, ticket:support_tickets(subject, priority, status)')
      .eq('tenant_id', tenantId)
      .order('breached_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createSlaBreach(breach: {
    tenant_id: string;
    ticket_id: string;
    breach_type: 'response' | 'resolution';
    target_time: string;
  }) {
    const { data, error } = await supabase
      .from('support_sla_breaches')
      .insert(breach)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // --- CSAT Ratings ---
  static async getCsatRatings(tenantId: string) {
    const { data, error } = await supabase
      .from('support_cstat_ratings')
      .select('*, ticket:support_tickets(subject)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createCsatRating(rating: {
    tenant_id: string;
    ticket_id: string;
    rating: number;
    feedback?: string;
  }) {
    const { data, error } = await supabase
      .from('support_cstat_ratings')
      .insert(rating)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // --- Knowledge Base ---
  static async getKbArticles(tenantId: string) {
    const { data, error } = await supabase
      .from('support_knowledge_base')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createKbArticle(article: {
    tenant_id: string;
    title: string;
    content: string;
    category?: string;
    is_published?: boolean;
    created_by: string;
  }) {
    const { data, error } = await supabase
      .from('support_knowledge_base')
      .insert(article)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateKbArticle(id: string, updates: Partial<any>, tenantId: string) {
    const { data, error } = await supabase
      .from('support_knowledge_base')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteKbArticle(id: string, tenantId: string) {
    const { error } = await supabase
      .from('support_knowledge_base')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return true;
  }
}
