import { supabase } from '../config/supabase.js';

export class LedgerRepository {
  static async createAccount(account: {
    tenant_id: string;
    account_number: string;
    name: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    parent_id?: string | null;
  }) {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .insert(account)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getAccountsByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('account_number', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createLedgerEntry(entry: {
    tenant_id: string;
    date: string;
    description: string;
    created_by: string;
  }, lines: {
    account_id: string;
    entry_type: 'debit' | 'credit';
    amount_cents: number;
  }[]) {
    // 1. Create Ledger Entry
    const { data: dbEntry, error: entryErr } = await supabase
      .from('ledger_entries')
      .insert(entry)
      .select()
      .single();

    if (entryErr) throw entryErr;

    // 2. Map entry_id to lines
    const journalLines = lines.map(line => ({
      tenant_id: entry.tenant_id,
      entry_id: dbEntry.id,
      account_id: line.account_id,
      entry_type: line.entry_type,
      amount_cents: line.amount_cents
    }));

    // 3. Insert Journal Lines
    const { data: dbLines, error: linesErr } = await supabase
      .from('journal_lines')
      .insert(journalLines)
      .select();

    if (linesErr) {
      // Rollback (delete entry) if lines insert fails
      await supabase.from('ledger_entries').delete().eq('id', dbEntry.id);
      throw linesErr;
    }

    return { ...dbEntry, lines: dbLines };
  }

  static async getEntriesByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('ledger_entries')
      .select(`
        *,
        lines:journal_lines (
          *,
          account:chart_of_accounts (*)
        )
      `)
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
