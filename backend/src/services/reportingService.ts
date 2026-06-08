import { supabase } from '../config/supabase.js';

export interface AccountBalance {
  account_id: string;
  account_number: string;
  account_name: string;
  type: string;
  balance_cents: number;
}

export interface PLStatement {
  tenant_id: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  revenue: AccountBalance[];
  expenses: AccountBalance[];
  total_revenue_cents: number;
  total_expenses_cents: number;
  gross_profit_cents: number;
  net_income_cents: number;
}

export interface BalanceSheet {
  tenant_id: string;
  as_of_date: string;
  generated_at: string;
  assets: AccountBalance[];
  liabilities: AccountBalance[];
  equity: AccountBalance[];
  total_assets_cents: number;
  total_liabilities_cents: number;
  total_equity_cents: number;
}

export interface CashFlowStatement {
  tenant_id: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  operating_activities: AccountBalance[];
  net_cash_cents: number;
}

export class ReportingService {
  /**
   * Computes account balances from journal_lines by summing debits - credits
   * for a given tenant and optional date range.
   */
  static async getAccountBalances(
    tenantId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AccountBalance[]> {
    let query = supabase
      .from('journal_lines')
      .select(`
        account_id,
        entry_type,
        amount_cents,
        account:chart_of_accounts (
          account_number,
          name,
          type
        ),
        entry:ledger_entries (
          tenant_id,
          date
        )
      `)
      .eq('tenant_id', tenantId);

    const { data: lines, error } = await query;
    if (error) throw error;

    const balanceMap = new Map<string, AccountBalance>();

    for (const line of lines || []) {
      const entry = Array.isArray(line.entry) ? line.entry[0] : line.entry;
      const account = Array.isArray(line.account) ? line.account[0] : line.account;
      if (!account || !entry) continue;

      const lineDate = entry.date;
      if (startDate && lineDate < startDate) continue;
      if (endDate && lineDate > endDate) continue;

      const key = line.account_id;
      if (!balanceMap.has(key)) {
        balanceMap.set(key, {
          account_id: line.account_id,
          account_number: account.account_number,
          account_name: account.name,
          type: account.type,
          balance_cents: 0
        });
      }

      const bal = balanceMap.get(key)!;
      // Normal balances: Asset/Expense = Debit positive; Liability/Equity/Revenue = Credit positive
      if (['asset', 'expense'].includes(account.type)) {
        bal.balance_cents += line.entry_type === 'debit' ? line.amount_cents : -line.amount_cents;
      } else {
        bal.balance_cents += line.entry_type === 'credit' ? line.amount_cents : -line.amount_cents;
      }
    }

    return Array.from(balanceMap.values()).filter(b => b.balance_cents !== 0);
  }

  /**
   * Generates a Profit & Loss Statement from live journal data.
   */
  static async generatePLStatement(
    tenantId: string,
    startDate: string,
    endDate: string
  ): Promise<PLStatement> {
    const balances = await ReportingService.getAccountBalances(tenantId, startDate, endDate);

    const revenue = balances.filter(b => b.type === 'revenue');
    const expenses = balances.filter(b => b.type === 'expense');

    const totalRevenue = revenue.reduce((sum, a) => sum + a.balance_cents, 0);
    const totalExpenses = expenses.reduce((sum, a) => sum + a.balance_cents, 0);
    const grossProfit = totalRevenue - totalExpenses;

    const report: PLStatement = {
      tenant_id: tenantId,
      period_start: startDate,
      period_end: endDate,
      generated_at: new Date().toISOString(),
      revenue,
      expenses,
      total_revenue_cents: totalRevenue,
      total_expenses_cents: totalExpenses,
      gross_profit_cents: grossProfit,
      net_income_cents: grossProfit // Extended with tax adjustments in Phase 13
    };

    // Persist report history
    await ReportingService.saveReportHistory(tenantId, 'profit_loss', report);

    return report;
  }

  /**
   * Generates a Balance Sheet as of a given date.
   */
  static async generateBalanceSheet(
    tenantId: string,
    asOfDate: string
  ): Promise<BalanceSheet> {
    const balances = await ReportingService.getAccountBalances(tenantId, undefined, asOfDate);

    const assets = balances.filter(b => b.type === 'asset');
    const liabilities = balances.filter(b => b.type === 'liability');
    const equity = balances.filter(b => b.type === 'equity');

    const totalAssets = assets.reduce((s, a) => s + a.balance_cents, 0);
    const totalLiabilities = liabilities.reduce((s, a) => s + a.balance_cents, 0);
    const totalEquity = equity.reduce((s, a) => s + a.balance_cents, 0);

    const report: BalanceSheet = {
      tenant_id: tenantId,
      as_of_date: asOfDate,
      generated_at: new Date().toISOString(),
      assets,
      liabilities,
      equity,
      total_assets_cents: totalAssets,
      total_liabilities_cents: totalLiabilities,
      total_equity_cents: totalEquity
    };

    await ReportingService.saveReportHistory(tenantId, 'balance_sheet', report);
    return report;
  }

  /**
   * Generates a Cash Flow Statement based on asset account movements.
   */
  static async generateCashFlowStatement(
    tenantId: string,
    startDate: string,
    endDate: string
  ): Promise<CashFlowStatement> {
    const balances = await ReportingService.getAccountBalances(tenantId, startDate, endDate);

    // Cash accounts = assets with 'cash' or 'bank' in name
    const cashAccounts = balances.filter(
      b => b.type === 'asset' && (
        b.account_name.toLowerCase().includes('cash') ||
        b.account_name.toLowerCase().includes('bank') ||
        b.account_name.toLowerCase().includes('checking') ||
        b.account_name.toLowerCase().includes('savings')
      )
    );

    // Operating = revenue + expense accounts (indirect method)
    const operating = balances.filter(b => b.type === 'revenue' || b.type === 'expense');
    const netCash = cashAccounts.reduce((s, a) => s + a.balance_cents, 0);

    const report: CashFlowStatement = {
      tenant_id: tenantId,
      period_start: startDate,
      period_end: endDate,
      generated_at: new Date().toISOString(),
      operating_activities: operating,
      net_cash_cents: netCash
    };

    await ReportingService.saveReportHistory(tenantId, 'cash_flow', report);
    return report;
  }

  /**
   * Exports any report to CSV format.
   */
  static exportToCSV(
    reportType: string,
    rows: { label: string; value: number | string }[]
  ): string {
    const header = ['Line Item', 'Amount'];
    const lines = rows.map(r => {
      const val = typeof r.value === 'number'
        ? `$${(r.value / 100).toFixed(2)}`
        : r.value;
      return [`"${r.label}"`, `"${val}"`].join(',');
    });

    return [
      `"Report: ${reportType}"`,
      `"Generated: ${new Date().toISOString()}"`,
      '',
      header.join(','),
      ...lines
    ].join('\n');
  }

  /**
   * Saves report metadata to report_history table.
   */
  static async saveReportHistory(
    tenantId: string,
    type: string,
    data: object
  ): Promise<void> {
    await supabase.from('report_history').insert({
      tenant_id: tenantId,
      report_type: type,
      data,
      generated_at: new Date().toISOString()
    });
    // Non-fatal — history table may not exist yet, ignore errors
  }

  /**
   * Retrieves past report history for a tenant.
   */
  static async getReportHistory(tenantId: string) {
    const { data, error } = await supabase
      .from('report_history')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('generated_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }
}
