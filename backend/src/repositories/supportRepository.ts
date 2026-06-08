import { supabase } from '../config/supabase.js';

export class SupportRepository {
  static async getTicketsByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return data || [];
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
}
