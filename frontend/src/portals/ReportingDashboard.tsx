import React, { useState, useEffect } from 'react';

interface AccountBalance {
  account_id: string;
  account_number: string;
  account_name: string;
  type: string;
  balance_cents: number;
}

interface PLStatement {
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

interface BalanceSheet {
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

interface CashFlowStatement {
  tenant_id: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  operating_activities: AccountBalance[];
  net_cash_cents: number;
}

interface ReportHistory {
  id: string;
  report_type: string;
  generated_at: string;
}

interface ReportingDashboardProps {
  apiBase?: string;
  authToken?: string;
}

function formatCurrency(cents: number): string {
  const abs = Math.abs(cents);
  const formatted = (abs / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return cents < 0 ? `-$${formatted}` : `$${formatted}`;
}

function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${color}30`,
      borderRadius: '14px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px'
    }}>
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: `${color}15`,
        border: `1px solid ${color}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 800, color, letterSpacing: '-0.5px' }}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function ReportingDashboard({ apiBase = 'http://localhost:3001', authToken }: ReportingDashboardProps) {
  const [activeTab, setActiveTab] = useState<'pl' | 'balance' | 'cashflow' | 'history'>('pl');
  const [plReport, setPlReport] = useState<PLStatement | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowStatement | null>(null);
  const [history, setHistory] = useState<ReportHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
  };

  const fetchPL = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${apiBase}/api/reports/pl?start_date=${startDate}&end_date=${endDate}`,
        { headers }
      );
      if (res.ok) setPlReport(await res.json());
    } catch {}
    setLoading(false);
  };

  const fetchBalanceSheet = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${apiBase}/api/reports/balance-sheet?as_of_date=${endDate}`,
        { headers }
      );
      if (res.ok) setBalanceSheet(await res.json());
    } catch {}
    setLoading(false);
  };

  const fetchCashFlow = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${apiBase}/api/reports/cash-flow?start_date=${startDate}&end_date=${endDate}`,
        { headers }
      );
      if (res.ok) setCashFlow(await res.json());
    } catch {}
    setLoading(false);
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/reports/history`, { headers });
      if (res.ok) setHistory(await res.json());
    } catch {}
    setLoading(false);
  };

  const downloadCSV = () => {
    window.open(
      `${apiBase}/api/reports/pl/csv?start_date=${startDate}&end_date=${endDate}`,
      '_blank'
    );
  };

  useEffect(() => {
    if (activeTab === 'pl') fetchPL();
    if (activeTab === 'balance') fetchBalanceSheet();
    if (activeTab === 'cashflow') fetchCashFlow();
    if (activeTab === 'history') fetchHistory();
  }, [activeTab]);

  const TABS = [
    { id: 'pl', label: '📊 Profit & Loss', color: '#10b981' },
    { id: 'balance', label: '⚖️ Balance Sheet', color: '#6366f1' },
    { id: 'cashflow', label: '💸 Cash Flow', color: '#f59e0b' },
    { id: 'history', label: '🕐 Report History', color: '#8b5cf6' }
  ];

  return (
    <div style={{ fontFamily: "'Inter', 'Outfit', sans-serif", color: '#f1f5f9' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, background: 'linear-gradient(135deg, #f1f5f9, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Financial Reports
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
            Real-time financial statements from your general ledger
          </p>
        </div>

        {/* Date Range Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#f1f5f9',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <span style={{ color: '#475569', fontSize: '13px' }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#f1f5f9',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
          <button
            onClick={() => { if (activeTab === 'pl') fetchPL(); else if (activeTab === 'balance') fetchBalanceSheet(); else fetchCashFlow(); }}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Generate
          </button>
          <button
            onClick={downloadCSV}
            style={{
              padding: '8px 16px',
              background: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '8px',
              color: '#10b981',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            ⬇ CSV
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: activeTab === tab.id ? `1px solid ${tab.color}50` : '1px solid rgba(255,255,255,0.08)',
              background: activeTab === tab.id ? `${tab.color}15` : 'rgba(255,255,255,0.04)',
              color: activeTab === tab.id ? tab.color : '#64748b',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: '60px', color: '#475569' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <p>Generating report from ledger data...</p>
        </div>
      ) : (
        <>
          {/* PROFIT & LOSS */}
          {activeTab === 'pl' && plReport && (
            <div>
              {/* KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                <StatCard label="Total Revenue" value={formatCurrency(plReport.total_revenue_cents)} color="#10b981" icon="💰" />
                <StatCard label="Total Expenses" value={formatCurrency(plReport.total_expenses_cents)} color="#ef4444" icon="📤" />
                <StatCard label="Gross Profit" value={formatCurrency(plReport.gross_profit_cents)} color="#6366f1" icon="📈" />
                <StatCard label="Net Income" value={formatCurrency(plReport.net_income_cents)} color={plReport.net_income_cents >= 0 ? '#10b981' : '#ef4444'} icon="🏆" />
              </div>

              {/* Revenue & Expenses Tables */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Revenue */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: '14px',
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#10b981' }}>Revenue</h3>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#10b981' }}>{formatCurrency(plReport.total_revenue_cents)}</span>
                  </div>
                  {plReport.revenue.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
                      No revenue entries for this period
                    </div>
                  ) : (
                    plReport.revenue.map(acc => (
                      <div key={acc.account_id} style={{
                        padding: '10px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        fontSize: '13px'
                      }}>
                        <span style={{ color: '#94a3b8' }}>{acc.account_number} · {acc.account_name}</span>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(acc.balance_cents)}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Expenses */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '14px',
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>Expenses</h3>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#ef4444' }}>{formatCurrency(plReport.total_expenses_cents)}</span>
                  </div>
                  {plReport.expenses.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
                      No expense entries for this period
                    </div>
                  ) : (
                    plReport.expenses.map(acc => (
                      <div key={acc.account_id} style={{
                        padding: '10px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        fontSize: '13px'
                      }}>
                        <span style={{ color: '#94a3b8' }}>{acc.account_number} · {acc.account_name}</span>
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>{formatCurrency(acc.balance_cents)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <p style={{ margin: '16px 0 0', fontSize: '11px', color: '#334155', textAlign: 'right' }}>
                Generated {new Date(plReport.generated_at).toLocaleString()} · Period: {plReport.period_start} to {plReport.period_end}
              </p>
            </div>
          )}

          {/* BALANCE SHEET */}
          {activeTab === 'balance' && balanceSheet && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
                <StatCard label="Total Assets" value={formatCurrency(balanceSheet.total_assets_cents)} color="#6366f1" icon="🏛️" />
                <StatCard label="Total Liabilities" value={formatCurrency(balanceSheet.total_liabilities_cents)} color="#ef4444" icon="📋" />
                <StatCard label="Total Equity" value={formatCurrency(balanceSheet.total_equity_cents)} color="#10b981" icon="💎" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Assets */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '14px',
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#6366f1' }}>Assets</h3>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#6366f1' }}>{formatCurrency(balanceSheet.total_assets_cents)}</span>
                  </div>
                  {balanceSheet.assets.map(acc => (
                    <div key={acc.account_id} style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px' }}>
                      <span style={{ color: '#94a3b8' }}>{acc.account_name}</span>
                      <span style={{ color: '#6366f1', fontWeight: 600 }}>{formatCurrency(acc.balance_cents)}</span>
                    </div>
                  ))}
                  {balanceSheet.assets.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>No asset accounts found</div>}
                </div>

                {/* Liabilities + Equity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '14px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>Liabilities</h3>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#ef4444' }}>{formatCurrency(balanceSheet.total_liabilities_cents)}</span>
                    </div>
                    {balanceSheet.liabilities.map(acc => (
                      <div key={acc.account_id} style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px' }}>
                        <span style={{ color: '#94a3b8' }}>{acc.account_name}</span>
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>{formatCurrency(acc.balance_cents)}</span>
                      </div>
                    ))}
                    {balanceSheet.liabilities.length === 0 && <div style={{ padding: '16px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>No liabilities</div>}
                  </div>

                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: '14px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#10b981' }}>Equity</h3>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#10b981' }}>{formatCurrency(balanceSheet.total_equity_cents)}</span>
                    </div>
                    {balanceSheet.equity.map(acc => (
                      <div key={acc.account_id} style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px' }}>
                        <span style={{ color: '#94a3b8' }}>{acc.account_name}</span>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(acc.balance_cents)}</span>
                      </div>
                    ))}
                    {balanceSheet.equity.length === 0 && <div style={{ padding: '16px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>No equity accounts</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CASH FLOW */}
          {activeTab === 'cashflow' && cashFlow && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                <StatCard label="Net Cash" value={formatCurrency(cashFlow.net_cash_cents)} color={cashFlow.net_cash_cents >= 0 ? '#10b981' : '#ef4444'} icon="💸" />
                <StatCard label="Operating Activities" value={`${cashFlow.operating_activities.length} accounts`} color="#6366f1" icon="⚙️" />
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: '14px',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>Operating Activities</h3>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#f59e0b' }}>{formatCurrency(cashFlow.net_cash_cents)}</span>
                </div>
                {cashFlow.operating_activities.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
                    No operating activity entries for this period.<br />
                    <span style={{ fontSize: '11px', color: '#334155' }}>Add revenue and expense accounts via the Ledger to see cash flow data.</span>
                  </div>
                ) : (
                  cashFlow.operating_activities.map(acc => (
                    <div key={acc.account_id} style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px' }}>
                      <div>
                        <span style={{ color: '#94a3b8' }}>{acc.account_name}</span>
                        <span style={{ marginLeft: '8px', fontSize: '11px', color: '#475569', textTransform: 'capitalize' }}>({acc.type})</span>
                      </div>
                      <span style={{ color: acc.type === 'revenue' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                        {formatCurrency(acc.balance_cents)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* REPORT HISTORY */}
          {activeTab === 'history' && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#8b5cf6' }}>Generated Reports</h3>
              </div>
              {history.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
                  <p style={{ margin: 0, fontSize: '14px' }}>No reports generated yet.</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Generate a P&L, Balance Sheet, or Cash Flow report to see history.</p>
                </div>
              ) : (
                history.map(item => (
                  <div key={item.id} style={{
                    padding: '14px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    fontSize: '13px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>
                        {item.report_type === 'profit_loss' ? '📊' : item.report_type === 'balance_sheet' ? '⚖️' : '💸'}
                      </span>
                      <span style={{ color: '#f1f5f9', fontWeight: 600, textTransform: 'capitalize' }}>
                        {item.report_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span style={{ color: '#64748b' }}>
                      {new Date(item.generated_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Empty state for no data */}
          {((activeTab === 'pl' && !plReport) ||
            (activeTab === 'balance' && !balanceSheet) ||
            (activeTab === 'cashflow' && !cashFlow)) && (
            <div style={{ textAlign: 'center', paddingTop: '60px', color: '#475569' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>No report generated yet</p>
              <p style={{ margin: '4px 0 0', fontSize: '13px' }}>
                Click <strong>Generate</strong> to create a real-time financial report from your ledger data.
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#334155' }}>
                Note: Requires Supabase connection with journal entries in the general ledger.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ReportingDashboard;
