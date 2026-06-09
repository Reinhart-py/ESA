import { supabase } from '../config/supabase.js';

export interface SearchFilters {
  category?: string;
  status?: string;
  minSize?: number;
  maxSize?: number;
  startDate?: string;
  endDate?: string;
}

export class SearchRepository {
  static async searchAll(tenantId: string, query: string, filters: SearchFilters = {}) {
    const term = `%${query}%`;
    const lowerQuery = query.toLowerCase();

    // 1. Files Search with advanced filters
    let filesQuery = supabase
      .from('files')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_deleted', false);

    if (query.trim()) {
      filesQuery = filesQuery.or(`name.ilike.${term},ocr_text.ilike.${term}`);
    }

    if (filters.category) {
      filesQuery = filesQuery.eq('category', filters.category);
    }
    if (filters.status) {
      filesQuery = filesQuery.eq('status', filters.status);
    }
    if (filters.minSize !== undefined) {
      filesQuery = filesQuery.gte('size_bytes', filters.minSize);
    }
    if (filters.maxSize !== undefined) {
      filesQuery = filesQuery.lte('size_bytes', filters.maxSize);
    }
    if (filters.startDate) {
      filesQuery = filesQuery.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      filesQuery = filesQuery.lte('created_at', filters.endDate);
    }

    // 2. Tasks Search
    let tasksQuery = supabase
      .from('tasks')
      .select('*')
      .eq('tenant_id', tenantId);

    if (query.trim()) {
      tasksQuery = tasksQuery.or(`title.ilike.${term},description.ilike.${term}`);
    }

    // 3. Obligations Search
    let obligationsQuery = supabase
      .from('compliance_obligations')
      .select('*')
      .eq('tenant_id', tenantId);

    if (query.trim()) {
      obligationsQuery = obligationsQuery.or(`title.ilike.${term},notes.ilike.${term}`);
    }

    const [filesRes, tasksRes, obligationsRes] = await Promise.all([
      filesQuery,
      tasksQuery,
      obligationsQuery
    ]);

    const rawFiles = filesRes.data || [];
    const rawTasks = tasksRes.data || [];
    const rawObligations = obligationsRes.data || [];

    const rankedFiles = rawFiles.map((file: any) => {
      let score = 0;
      const nameLower = (file.name || '').toLowerCase();
      const ocrLower = (file.ocr_text || '').toLowerCase();

      if (query.trim()) {
        if (nameLower === lowerQuery) {
          score += 100;
        } else if (nameLower.startsWith(lowerQuery)) {
          score += 80;
        } else if (nameLower.includes(lowerQuery)) {
          score += 60;
        }

        if (ocrLower.includes(lowerQuery)) {
          score += 40;
        }
      } else {
        score = 1;
      }

      return { ...file, relevanceScore: score };
    }).sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);

    const rankedTasks = rawTasks.map((task: any) => {
      let score = 0;
      const titleLower = (task.title || '').toLowerCase();
      const descLower = (task.description || '').toLowerCase();

      if (query.trim()) {
        if (titleLower === lowerQuery) {
          score += 100;
        } else if (titleLower.includes(lowerQuery)) {
          score += 70;
        }
        if (descLower.includes(lowerQuery)) {
          score += 30;
        }
      } else {
        score = 1;
      }
      return { ...task, relevanceScore: score };
    }).sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);

    const rankedObligations = rawObligations.map((ob: any) => {
      let score = 0;
      const titleLower = (ob.title || '').toLowerCase();
      const notesLower = (ob.notes || '').toLowerCase();

      if (query.trim()) {
        if (titleLower === lowerQuery) {
          score += 100;
        } else if (titleLower.includes(lowerQuery)) {
          score += 70;
        }
        if (notesLower.includes(lowerQuery)) {
          score += 30;
        }
      } else {
        score = 1;
      }
      return { ...ob, relevanceScore: score };
    }).sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);

    return {
      files: rankedFiles,
      tasks: rankedTasks,
      obligations: rankedObligations
    };
  }

  static async createSavedSearch(data: { tenant_id: string; user_id: string; name: string; query: string; filters: any }) {
    const { data: res, error } = await supabase
      .from('saved_searches')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return res;
  }

  static async getSavedSearches(tenantId: string, userId: string) {
    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
}
