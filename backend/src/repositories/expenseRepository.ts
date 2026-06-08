import { supabase } from '../config/supabase.js';

export class ExpenseRepository {
  static async createExpense(expense: {
    tenant_id: string;
    account_id?: string | null;
    amount_cents: number;
    merchant: string;
    date: string;
    description?: string | null;
    receipt_file_id?: string | null;
  }) {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select(`
        *,
        account:chart_of_accounts (*),
        receipt:files (*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async getExpensesByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        account:chart_of_accounts (*),
        receipt:files (*)
      `)
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async linkReceipt(expenseId: string, tenantId: string, receiptFileId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .update({ receipt_file_id: receiptFileId })
      .eq('id', expenseId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
