import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client.ts';
import { 
  PlusCircle, BookOpen, RefreshCw, AlertCircle, CheckCircle, 
  ChevronDown, ChevronRight, FileText, DollarSign, ArrowDownUp, 
  TrendingUp, Scale, Loader2, ArrowRight
} from 'lucide-react';

interface Account {
  id: string;
  account_number: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  parent_id: string | null;
}

interface JournalLine {
  id: string;
  account_id: string;
  entry_type: 'debit' | 'credit';
  amount_cents: number;
  account?: {
    name: string;
    account_number: string;
  };
}

interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  created_at: string;
  lines: JournalLine[];
}

interface TrialBalanceLine {
  accountId: string;
  name: string;
  accountNumber: string;
  type: string;
  totalDebits: number;
  totalCredits: number;
  netBalance: number;
}

interface BalanceSheetGroup {
  name: string;
  balance: number;
}

interface BalanceSheetData {
  assets: BalanceSheetGroup[];
  liabilities: BalanceSheetGroup[];
  equity: BalanceSheetGroup[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export default function LedgerManagement() {
  const [activeTab, setActiveTab] = useState<'accounts' | 'journal' | 'register' | 'trial' | 'balance_sheet'>('accounts');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceLine[]>([]);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Account Creation Form State
  const [newAccount, setNewAccount] = useState({
    accountNumber: '',
    name: '',
    type: 'Asset' as Account['type'],
    parentId: ''
  });

  // Journal Entry Creation Wizard State
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0]);
  const [journalDescription, setJournalDescription] = useState('');
  const [journalLines, setJournalLines] = useState<Array<{ accountId: string; entryType: 'debit' | 'credit'; amount: string }>>([
    { accountId: '', entryType: 'debit', amount: '' },
    { accountId: '', entryType: 'credit', amount: '' }
  ]);

  // Loading Functions
  const fetchAccounts = async () => {
    try {
      const res = await apiClient.get('/finance/accounts');
      setAccounts(res.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to load chart of accounts');
    }
  };

  const fetchLedger = async () => {
    try {
      const res = await apiClient.get('/finance/ledger');
      setEntries(res.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to load general ledger');
    }
  };

  const fetchTrialBalance = async () => {
    try {
      const res = await apiClient.get('/finance/trial-balance');
      setTrialBalance(res.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to load trial balance');
    }
  };

  const fetchBalanceSheet = async () => {
    try {
      const res = await apiClient.get('/finance/balance-sheet');
      setBalanceSheet(res.data || null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to load balance sheet');
    }
  };

  const reloadAll = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    await Promise.all([
      fetchAccounts(),
      fetchLedger(),
      fetchTrialBalance(),
      fetchBalanceSheet()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    reloadAll();
  }, []);

  // Submit functions
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!newAccount.accountNumber || !newAccount.name || !newAccount.type) {
      setErrorMsg('All fields except parent account are required');
      return;
    }
    try {
      await apiClient.post('/finance/accounts', {
        accountNumber: newAccount.accountNumber,
        name: newAccount.name,
        type: newAccount.type,
        parentId: newAccount.parentId || null
      });
      setSuccessMsg(`Account ${newAccount.accountNumber} created successfully`);
      setNewAccount({ accountNumber: '', name: '', type: 'Asset', parentId: '' });
      await reloadAll();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to create account');
    }
  };

  // Journal Entry functions
  const addJournalLine = () => {
    setJournalLines([...journalLines, { accountId: '', entryType: 'debit', amount: '' }]);
  };

  const removeJournalLine = (index: number) => {
    if (journalLines.length <= 2) {
      setErrorMsg('A journal entry must contain at least 2 lines');
      return;
    }
    const next = [...journalLines];
    next.splice(index, 1);
    setJournalLines(next);
  };

  const updateJournalLine = (index: number, field: string, value: string) => {
    const next = [...journalLines];
    next[index] = { ...next[index], [field]: value };
    setJournalLines(next);
  };

  // Calculate live debits & credits
  const calculateTotals = () => {
    let debits = 0;
    let credits = 0;
    journalLines.forEach(line => {
      const val = Math.round(parseFloat(line.amount || '0') * 100);
      if (isNaN(val)) return;
      if (line.entryType === 'debit') {
        debits += val;
      } else {
        credits += val;
      }
    });
    return { debits: debits / 100, credits: credits / 100 };
  };

  const totals = calculateTotals();
  const balanceDifference = Math.abs(totals.debits - totals.credits);
  const isBalanced = totals.debits > 0 && balanceDifference === 0;

  const handlePostJournalEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!journalDescription.trim()) {
      setErrorMsg('Description is required');
      return;
    }

    if (!isBalanced) {
      setErrorMsg(`Journal entry is unbalanced. Difference: $${balanceDifference.toFixed(2)}`);
      return;
    }

    // Check if accounts are selected
    const invalidLine = journalLines.some(l => !l.accountId || !l.amount || parseFloat(l.amount) <= 0);
    if (invalidLine) {
      setErrorMsg('All lines must have a valid account selected and a positive amount.');
      return;
    }

    try {
      const lines = journalLines.map(l => ({
        accountId: l.accountId,
        entryType: l.entryType,
        amountCents: Math.round(parseFloat(l.amount) * 100)
      }));

      await apiClient.post('/finance/journal-entries', {
        date: journalDate,
        description: journalDescription,
        lines
      });

      setSuccessMsg('Journal entry successfully posted to the general ledger.');
      setJournalDescription('');
      setJournalLines([
        { accountId: '', entryType: 'debit', amount: '' },
        { accountId: '', entryType: 'credit', amount: '' }
      ]);
      await reloadAll();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to post journal entry');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Top Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Scale size={24} style={{ color: 'var(--accent-color)' }} /> Double-Entry General Ledger
          </h2>
          <p style={{ color: 'var(--text-sec)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
            Real-time compliance tracking, trial balance audit registers, and chart of accounts tree structure.
          </p>
        </div>
        <button 
          onClick={reloadAll} 
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--card-border)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Sync Ledger
        </button>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'accounts', name: 'Chart of Accounts', icon: <ChevronDown size={16} /> },
          { id: 'journal', name: 'New Journal Entry', icon: <PlusCircle size={16} /> },
          { id: 'register', name: 'Ledger Register', icon: <BookOpen size={16} /> },
          { id: 'trial', name: 'Trial Balance', icon: <ArrowDownUp size={16} /> },
          { id: 'balance_sheet', name: 'Balance Sheet', icon: <TrendingUp size={16} /> }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.2rem',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === t.id ? 'var(--accent-color)' : 'transparent',
              color: activeTab === t.id ? '#fff' : '#94a3b8',
              cursor: 'pointer',
              fontWeight: activeTab === t.id ? 'bold' : 'normal',
              transition: 'all 0.2s'
            }}
          >
            {t.icon}
            {t.name}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'accounts' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
          {/* Chart list */}
          <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Interactive Chart of Accounts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map(type => {
                const groupAccounts = accounts.filter(a => a.type === type);
                return (
                  <div key={type} style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
                    <h4 style={{ color: 'var(--accent-color)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em', margin: '0 0 0.5rem 0' }}>
                      {type} Accounts ({groupAccounts.length})
                    </h4>
                    {groupAccounts.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No {type.toLowerCase()} accounts set up yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {groupAccounts.map(acc => (
                          <div 
                            key={acc.id} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '0.5rem 0.75rem', 
                              background: 'rgba(255,255,255,0.02)', 
                              borderRadius: '6px',
                              borderLeft: acc.parent_id ? '3px solid #64748b' : '3px solid var(--accent-color)',
                              paddingLeft: acc.parent_id ? '1.5rem' : '0.75rem'
                            }}
                          >
                            <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                              <strong style={{ color: 'var(--text-sec)', marginRight: '0.5rem' }}>{acc.account_number}</strong>
                              {acc.name}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {acc.parent_id ? 'Sub-account' : 'Control Account'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Account form */}
          <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)', height: 'fit-content' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Configure Account</h3>
            <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-sec)', marginBottom: '0.35rem' }}>Account Code (e.g. 1010)</label>
                <input 
                  type="text"
                  placeholder="Code"
                  value={newAccount.accountNumber}
                  onChange={e => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-sec)', marginBottom: '0.35rem' }}>Account Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Operating Expenses"
                  value={newAccount.name}
                  onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-sec)', marginBottom: '0.35rem' }}>Account Category</label>
                <select
                  value={newAccount.type}
                  onChange={e => setNewAccount({ ...newAccount, type: e.target.value as any })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                >
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Equity">Equity</option>
                  <option value="Revenue">Revenue</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-sec)', marginBottom: '0.35rem' }}>Parent Account (Optional)</label>
                <select
                  value={newAccount.parentId}
                  onChange={e => setNewAccount({ ...newAccount, parentId: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                >
                  <option value="">No Parent (Root Control Account)</option>
                  {accounts.filter(a => a.type === newAccount.type && !a.parent_id).map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_number} - {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <button 
                type="submit" 
                style={{ width: '100%', padding: '0.7rem', background: 'var(--accent-color)', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <PlusCircle size={16} /> Add to Ledger Chart
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'journal' && (
        <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Post Double-Entry Journal Entry</h3>
          <form onSubmit={handlePostJournalEntry} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-sec)', marginBottom: '0.35rem' }}>Date</label>
                <input 
                  type="date"
                  value={journalDate}
                  onChange={e => setJournalDate(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-sec)', marginBottom: '0.35rem' }}>Transaction Description</label>
                <input 
                  type="text"
                  placeholder="e.g. Rent Payment Q3"
                  value={journalDescription}
                  onChange={e => setJournalDescription(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 50px', gap: '1rem', paddingBottom: '0.25rem', borderBottom: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-sec)' }}>Account selection</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-sec)' }}>Type</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-sec)' }}>Amount ($ USD)</span>
                <span></span>
              </div>

              {journalLines.map((line, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 50px', gap: '1rem', alignItems: 'center' }}>
                  <select
                    value={line.accountId}
                    onChange={e => updateJournalLine(idx, 'accountId', e.target.value)}
                    style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                  >
                    <option value="">Select Ledger Account...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.account_number} - {acc.name} ({acc.type})
                      </option>
                    ))}
                  </select>

                  <select
                    value={line.entryType}
                    onChange={e => updateJournalLine(idx, 'entryType', e.target.value)}
                    style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                  >
                    <option value="debit">DEBIT</option>
                    <option value="credit">CREDIT</option>
                  </select>

                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={line.amount}
                    onChange={e => updateJournalLine(idx, 'amount', e.target.value)}
                    style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                  />

                  <button 
                    type="button"
                    onClick={() => removeJournalLine(idx)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '8px' }}>
              <button 
                type="button" 
                onClick={addJournalLine}
                style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--accent-color)', border: '1px dashed var(--accent-color)', borderRadius: '6px', cursor: 'pointer' }}
              >
                + Add Transaction Line
              </button>

              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-sec)' }}>
                  <div>Total Debits: <strong style={{ color: 'var(--text-primary)' }}>${totals.debits.toFixed(2)}</strong></div>
                  <div>Total Credits: <strong style={{ color: 'var(--text-primary)' }}>${totals.credits.toFixed(2)}</strong></div>
                </div>

                {isBalanced ? (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    ✓ Balanced
                  </div>
                ) : (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    ⚠ Unbalanced: ${balanceDifference.toFixed(2)}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!isBalanced}
                  style={{
                    padding: '0.6rem 1.5rem',
                    background: isBalanced ? 'var(--accent-color)' : '#64748b',
                    color: 'var(--text-primary)',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: isBalanced ? 'pointer' : 'not-allowed',
                    opacity: isBalanced ? 1 : 0.6
                  }}
                >
                  Post Journal Entry
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'register' && (
        <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>General Ledger Register</h3>
          {entries.length === 0 ? (
            <p style={{ color: 'var(--text-sec)' }}>No ledger entries found. Post a journal entry to get started.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {entries.map(entry => (
                <div key={entry.id} style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{entry.description}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '1rem' }}>ID: {entry.id.slice(0, 8)}</span>
                    </div>
                    <span style={{ color: 'var(--accent-color)', fontSize: '0.9rem' }}>{new Date(entry.date).toLocaleDateString()}</span>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-sec)', textAlign: 'left' }}>
                        <th style={{ padding: '0.25rem 0' }}>Account</th>
                        <th style={{ textAlign: 'right' }}>Debit</th>
                        <th style={{ textAlign: 'right' }}>Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.lines.map(line => (
                        <tr key={line.id} style={{ color: 'var(--text-sec)' }}>
                          <td style={{ padding: '0.25rem 0' }}>
                            {line.account ? `${line.account.account_number} - ${line.account.name}` : `Account ID: ${line.account_id}`}
                          </td>
                          <td style={{ textAlign: 'right', color: line.entry_type === 'debit' ? '#10b981' : 'transparent' }}>
                            {line.entry_type === 'debit' ? `$${(line.amount_cents / 100).toFixed(2)}` : '-'}
                          </td>
                          <td style={{ textAlign: 'right', color: line.entry_type === 'credit' ? '#ef4444' : 'transparent' }}>
                            {line.entry_type === 'credit' ? `$${(line.amount_cents / 100).toFixed(2)}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'trial' && (
        <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Audit Trial Balance</h3>
          {trialBalance.length === 0 ? (
            <p style={{ color: 'var(--text-sec)' }}>No trial balance data available.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-sec)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.05)', textAlign: 'left', color: 'var(--text-sec)' }}>
                  <th style={{ padding: '0.75rem' }}>Account Code</th>
                  <th>Account Name</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Total Debits</th>
                  <th style={{ textAlign: 'right' }}>Total Credits</th>
                  <th style={{ textAlign: 'right', paddingRight: '0.75rem' }}>Net Balance</th>
                </tr>
              </thead>
              <tbody>
                {trialBalance.map(line => (
                  <tr key={line.accountId} style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{line.accountNumber}</td>
                    <td>{line.name}</td>
                    <td>{line.type}</td>
                    <td style={{ textAlign: 'right' }}>${(line.totalDebits / 100).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>${(line.totalCredits / 100).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', paddingRight: '0.75rem', fontWeight: 'bold', color: line.netBalance >= 0 ? '#10b981' : '#ef4444' }}>
                      ${(line.netBalance / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'balance_sheet' && (
        <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)' }}>System-Compiled Balance Sheet</h3>
          {!balanceSheet ? (
            <p style={{ color: 'var(--text-sec)' }}>No balance sheet data available.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Assets column */}
              <div>
                <h4 style={{ color: 'var(--accent-color)', borderBottom: '2px solid var(--accent-color)', paddingBottom: '0.5rem', margin: '0 0 1rem 0' }}>ASSETS</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {balanceSheet.assets.map(a => (
                    <div key={a.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                      <span>{a.name}</span>
                      <strong style={{ color: 'var(--text-primary)' }}>${(a.balance / 100).toFixed(2)}</strong>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', marginTop: '0.5rem', fontSize: '1.05rem' }}>
                    <span style={{ color: 'var(--text-primary)' }}>Total Assets</span>
                    <strong style={{ color: 'var(--accent-color)' }}>${(balanceSheet.totalAssets / 100).toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* Liabilities & Equity column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h4 style={{ color: '#ef4444', borderBottom: '2px solid #ef4444', paddingBottom: '0.5rem', margin: '0 0 1rem 0' }}>LIABILITIES</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {balanceSheet.liabilities.map(l => (
                      <div key={l.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                        <span>{l.name}</span>
                        <strong style={{ color: 'var(--text-primary)' }}>${(l.balance / 100).toFixed(2)}</strong>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                      <span>Total Liabilities</span>
                      <strong style={{ color: 'var(--text-primary)' }}>${(balanceSheet.totalLiabilities / 100).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ color: '#3b82f6', borderBottom: '2px solid #3b82f6', paddingBottom: '0.5rem', margin: '0 0 1rem 0' }}>EQUITY</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {balanceSheet.equity.map(e => (
                      <div key={e.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                        <span>{e.name}</span>
                        <strong style={{ color: 'var(--text-primary)' }}>${(e.balance / 100).toFixed(2)}</strong>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                      <span>Total Equity</span>
                      <strong style={{ color: 'var(--text-primary)' }}>${(balanceSheet.totalEquity / 100).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid rgba(255,255,255,0.2)', paddingTop: '0.75rem', fontSize: '1.05rem' }}>
                  <span style={{ color: 'var(--text-primary)' }}>Total Liabilities & Equity</span>
                  <strong style={{ color: 'var(--accent-color)' }}>${((balanceSheet.totalLiabilities + balanceSheet.totalEquity) / 100).toFixed(2)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
