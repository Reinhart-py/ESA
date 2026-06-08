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

  static async getComments(taskId: string) {
    const { data, error } = await supabase
      .from('task_comments')
      .select('*, users(full_name)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createComment(comment: { task_id: string; user_id: string; content: string }) {
    const { data, error } = await supabase
      .from('task_comments')
      .insert(comment)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getDependencies(taskId: string) {
    const { data, error } = await supabase
      .from('task_dependencies')
      .select('depends_on_task_id')
      .eq('task_id', taskId);

    if (error) throw error;
    return data || [];
  }

  static async addDependency(taskId: string, dependsOnId: string) {
    const { data, error } = await supabase
      .from('task_dependencies')
      .insert({ task_id: taskId, depends_on_task_id: dependsOnId })
      .select();

    if (error) throw error;
    return data;
  }
}
