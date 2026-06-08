import { supabase } from '../config/supabase.js';

export class UserRepository {
  static async getById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, tenant_id, email, full_name, role, status')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return data;
  }

  static async create(profile: { id: string; tenant_id: string; email: string; full_name: string; role: string }) {
    const { data, error } = await supabase
      .from('users')
      .insert({ ...profile, status: 'active' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
