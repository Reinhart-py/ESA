import { TaskRepository } from '../repositories/taskRepository.js';
import { supabase } from '../config/supabase.js';

export class TaskService {
  /**
   * Helper to recursively scan task dependency trees and detect circular dependency paths
   */
  static async checkCircularDependency(taskId: string, dependsOnId: string): Promise<boolean> {
    if (taskId === dependsOnId) return true;

    const { data: deps, error } = await supabase
      .from('task_dependencies')
      .select('depends_on_task_id')
      .eq('task_id', dependsOnId);

    if (error || !deps || deps.length === 0) return false;

    for (const dep of deps) {
      if (dep.depends_on_task_id === taskId) {
        return true;
      }
      const isCircular = await this.checkCircularDependency(taskId, dep.depends_on_task_id);
      if (isCircular) {
        return true;
      }
    }

    return false;
  }

  static async linkDependency(taskId: string, dependsOnId: string) {
    const isCircular = await this.checkCircularDependency(taskId, dependsOnId);
    if (isCircular) {
      throw new Error('Circular dependency detected between tasks');
    }

    return await TaskRepository.addDependency(taskId, dependsOnId);
  }
}
