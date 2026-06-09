import { supabase } from '../config/supabase.js';

export interface UserMfa {
  user_id: string;
  secret: string;
  is_enabled: boolean;
  backup_codes: string[];
  created_at?: string;
}

export class MfaRepository {
  static async getByUserId(userId: string): Promise<UserMfa | null> {
    const { data, error } = await supabase
      .from('user_mfa')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async upsert(mfa: Partial<UserMfa> & { user_id: string }): Promise<UserMfa> {
    const { data, error } = await supabase
      .from('user_mfa')
      .upsert(mfa)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_mfa')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }
}
