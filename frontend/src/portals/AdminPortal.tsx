import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext.tsx';
import { 
  Building, ShieldCheck, HelpCircle, LogOut, Database, Lock
} from 'lucide-react';

export default function AdminPortal({ onLogout }: { onLogout: () => void }) {
  const context = useContext(AppContext);
  if (!context) return null;

  const { 
    tickets, auditLogs, invoices, files
  } = context;

  const [activeSubTab, setActiveSubTab] = useState('metrics');

  const totalStorage = files.reduce((acc, f) => acc + f.size_bytes, 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F9FA', color: '#1e293b' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', background: '#0B192C', color: '#fff', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ background: '#EF4444', width: 35, height: 35, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>S</div>
          <div>
            <h2 style={{ fontSize: '1.05rem', color: '#fff', margin: 0 }}>System Admin</h2>
            <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>Role: Super Administrator</span>
          </div>
        </div>

        <nav style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'metrics' ? '#fff' : '#9CA3AF', background: activeSubTab === 'metrics' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('metrics')}
          >
            <ShieldCheck size={18} /> Platform Health
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'invoices' ? '#fff' : '#9CA3AF', background: activeSubTab === 'invoices' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('invoices')}
          >
            <Building size={18} /> Global Billing
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'tickets' ? '#fff' : '#9CA3AF', background: activeSubTab === 'tickets' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('tickets')}
          >
            <HelpCircle size={18} /> Helpdesk Tickets
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'logs' ? '#fff' : '#9CA3AF', background: activeSubTab === 'logs' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('logs')}
          >
            <Database size={18} /> System Audit Trail
          </button>
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#EF4444', fontSize: '0.9rem', background: 'none', border: 'none', cursor: 'pointer' }} onClick={onLogout}>
            <LogOut size={16} /> Exit Admin
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxHeight: '100vh' }}>
        {activeSubTab === 'metrics' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2rem', margin: 0 }}>System Operations Console</h1>
              <p style={{ color: '#6B7280' }}>Real-time monitoring of tenant databases, storage allocations, and billing cycles.</p>
            </div>

            {/* Metrics cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <span style={{ color: '#6B7280', fontSize: '0.85rem', fontWeight: 600 }}>Active Storage usage</span>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.25rem 0', color: '#0B192C' }}>{(totalStorage / 1024 / 1024).toFixed(2)} MB / 5.0 TB</p>
                <span style={{ color: '#008080', fontSize: '0.8rem' }}>Connected via Google workspace</span>
              </div>
              <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <span style={{ color: '#6B7280', fontSize: '0.85rem', fontWeight: 600 }}>Active support queues</span>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.25rem 0', color: '#EF4444' }}>{tickets.filter(t => t.status === 'Open').length} Open Tickets</p>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Platform Infrastructure Diagnostics</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#F9FAFB', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Lock size={20} color="#10B981" />
                    <div>
                      <p style={{ fontWeight: 'bold', margin: 0, fontSize: '0.95rem' }}>Supabase Authentication Services</p>
                      <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Role-based Access Tokens Active. JWT encryption validated.</span>
                    </div>
                  </div>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>Operational</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Billing */}
        {activeSubTab === 'invoices' && (
          <div>
            <h2>Global Invoices Directory</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#6B7280', background: '#f8fafc' }}>
                  <th style={{ padding: '1rem' }}>Invoice ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem' }}>{inv.id}</td>
                    <td>${(inv.amount_cents / 100).toFixed(2)}</td>
                    <td>{inv.status}</td>
                    <td>{inv.due_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Support Tickets */}
        {activeSubTab === 'tickets' && (
          <div>
            <h2>Helpdesk Tickets Management</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#6B7280', background: '#f8fafc' }}>
                  <th style={{ padding: '1rem' }}>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(tkt => (
                  <tr key={tkt.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem' }}>{tkt.subject}</td>
                    <td>{tkt.category}</td>
                    <td>{tkt.priority}</td>
                    <td>{tkt.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Audit Trail Logs */}
        {activeSubTab === 'logs' && (
          <div>
            <h2>Platform Audit Trail Logs</h2>
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '450px', overflowY: 'auto' }}>
                {auditLogs.map((log) => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#F9FAFB', border: '1px solid rgba(0,0,0,0.03)', borderRadius: 6, fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: '#9CA3AF', marginRight: '1rem' }}>{new Date(log.created_at).toLocaleString()}</span>
                      <strong>[{log.category}]</strong> {log.action}
                    </div>
                    <span style={{ color: '#6B7280' }}>User: {log.user_identity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
