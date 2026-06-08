import { supabase } from '../config/supabase.js';

export class TenantRepository {
  static async getAll() {
    const { data, error } = await supabase
      .from('tenants')
      .select('*');

    if (error) throw error;
    return data || [];
  }

  static async create(tenant: { name: string; business_type: string }) {
    const { data, error } = await supabase
      .from('tenants')
      .insert(tenant)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
