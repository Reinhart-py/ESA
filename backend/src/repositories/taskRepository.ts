import { supabase } from '../config/supabase.js';

export class TaskRepository {
  static async getTasksByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return data || [];
  }

  static async createTask(task: {
    tenant_id: string;
    title: string;
    description: string;
    due_date: string;
    priority: string;
    assigned_to?: string;
    created_by: string;
  }) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
