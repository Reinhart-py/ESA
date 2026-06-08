import { LedgerRepository } from '../repositories/ledgerRepository.js';

export class LedgerService {
  static async postJournalEntry(
    entry: {
      tenant_id: string;
      date: string;
      description: string;
      created_by: string;
    },
    lines: {
      account_id: string;
      entry_type: 'debit' | 'credit';
      amount_cents: number;
    }[]
  ) {
    if (lines.length < 2) {
      throw new Error('A journal entry must contain at least two transaction lines.');
    }

    const totalDebits = lines
      .filter(l => l.entry_type === 'debit')
      .reduce((acc, l) => acc + l.amount_cents, 0);

    const totalCredits = lines
      .filter(l => l.entry_type === 'credit')
      .reduce((acc, l) => acc + l.amount_cents, 0);

    if (totalDebits !== totalCredits) {
      throw new Error(`Double-entry violation: Debits ($${(totalDebits / 100).toFixed(2)}) must equal Credits ($${(totalCredits / 100).toFixed(2)}).`);
    }

    return await LedgerRepository.createLedgerEntry(entry, lines);
  }

  static async getTrialBalance(tenantId: string) {
    const accounts = await LedgerRepository.getAccountsByTenant(tenantId);
    const entries = await LedgerRepository.getEntriesByTenant(tenantId);

    // Map account balances
    const trialBalance = accounts.map(acc => {
      let debitTotal = 0;
      let creditTotal = 0;

      for (const entry of entries) {
        for (const line of (entry as any).lines) {
          if (line.account_id === acc.id) {
            if (line.entry_type === 'debit') {
              debitTotal += line.amount_cents;
            } else {
              creditTotal += line.amount_cents;
            }
          }
        }
      }

      return {
        id: acc.id,
        account_number: acc.account_number,
        name: acc.name,
        type: acc.type,
        debits: debitTotal,
        credits: creditTotal
      };
    });

    return trialBalance;
  }

  static async getBalanceSheet(tenantId: string) {
    const trialBalance = await this.getTrialBalance(tenantId);

    const assets = trialBalance.filter(a => a.type === 'asset');
    const liabilities = trialBalance.filter(a => a.type === 'liability');
    const equity = trialBalance.filter(a => a.type === 'equity');

    const computeBalance = (lines: typeof trialBalance, balanceType: 'debit' | 'credit') => {
      return lines.reduce((acc, l) => {
        const net = balanceType === 'debit' ? (l.debits - l.credits) : (l.credits - l.debits);
        return acc + net;
      }, 0);
    };

    return {
      assets: assets.map(a => ({ name: a.name, balance_cents: a.debits - a.credits })),
      liabilities: liabilities.map(l => ({ name: l.name, balance_cents: l.credits - l.debits })),
      equity: equity.map(e => ({ name: e.name, balance_cents: e.credits - e.debits })),
      total_assets_cents: computeBalance(assets, 'debit'),
      total_liabilities_cents: computeBalance(liabilities, 'credit'),
      total_equity_cents: computeBalance(equity, 'credit')
    };
  }
}
