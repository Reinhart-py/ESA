import { supabase } from '../config/supabase.js';

export class ProfessionalRepository {
  static async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('professional_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async upsertProfile(profile: {
    id: string;
    bio?: string;
    hourly_rate_cents?: number;
    specializations?: string[];
    is_verified?: boolean;
    availability_status?: 'available' | 'busy' | 'unavailable';
    rating_average?: number;
  }) {
    const { data, error } = await supabase
      .from('professional_profiles')
      .upsert(profile)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async listVerified() {
    const { data, error } = await supabase
      .from('professional_profiles')
      .select(`
        *,
        users (
          full_name,
          email,
          role
        )
      `)
      .eq('is_verified', true);

    if (error) throw error;
    return data || [];
  }

  static async updateVerification(userId: string, isVerified: boolean) {
    const { data, error } = await supabase
      .from('professional_profiles')
      .update({ is_verified: isVerified })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
