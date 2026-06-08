import { supabase } from '../config/supabase.js';

export class InviteRepository {
  static async createInvite(invite: {
    tenant_id: string;
    email: string;
    role: string;
    token: string;
    expires_at: string;
  }) {
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        tenant_id: invite.tenant_id,
        email: invite.email,
        role: invite.role,
        token: invite.token,
        expires_at: invite.expires_at,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getInviteByToken(token: string) {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (error) return null;
    return data;
  }

  static async updateInviteStatus(id: string, status: 'pending' | 'accepted' | 'expired') {
    const { data, error } = await supabase
      .from('invitations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
