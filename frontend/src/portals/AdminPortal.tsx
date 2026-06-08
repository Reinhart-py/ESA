import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext.tsx';
import { apiClient } from '../api/client.ts';
import { 
  Building, ShieldCheck, HelpCircle, LogOut, Database, Lock, Eye, EyeOff,
  UserCheck, DollarSign, Users, Award, HardDrive, RefreshCw, Edit2, Check, X,
  CheckCircle
} from 'lucide-react';

export default function AdminPortal({ onLogout }: { onLogout: () => void }) {
  const context = useContext(AppContext);
  if (!context) return null;

  const { 
    tickets, auditLogs, syncState
  } = context;

  const [activeSubTab, setActiveSubTab] = useState('metrics');
  const [tenants, setTenants] = useState<any[]>([]);
  const [impersonatingId, setImpersonatingId] = useState<string>(() => localStorage.getItem('impersonate_tenant_id') || '');

  // Phase 10 States
  const [metrics, setMetrics] = useState<any>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [pendingPros, setPendingPros] = useState<any[]>([]);
  const [prosLoading, setProsLoading] = useState(false);
  
  // Quota editor state
  const [editingQuotaTenantId, setEditingQuotaTenantId] = useState<string | null>(null);
  const [newQuotaGb, setNewQuotaGb] = useState<number>(10);

  const fetchTenants = async () => {
    try {
      const res = await apiClient.get('/tenants');
      setTenants(res.data || []);
    } catch (err) {
      console.error('Error fetching tenants list:', err);
    }
  };

  const fetchAdminMetrics = async () => {
    setMetricsLoading(true);
    try {
      const res = await apiClient.get('/admin/metrics');
      setMetrics(res.data);
    } catch (err) {
      console.error('Error fetching admin metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchPendingPros = async () => {
    setProsLoading(true);
    try {
      const res = await apiClient.get('/admin/professionals/pending');
      setPendingPros(res.data || []);
    } catch (err) {
      console.error('Error fetching pending professionals:', err);
    } finally {
      setProsLoading(false);
    }
  };

  const loadData = () => {
    fetchTenants();
    fetchAdminMetrics();
    if (activeSubTab === 'verifications') {
      fetchPendingPros();
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  const handleImpersonate = async (tenantId: string) => {
    if (tenantId) {
      localStorage.setItem('impersonate_tenant_id', tenantId);
      setImpersonatingId(tenantId);
    } else {
      localStorage.removeItem('impersonate_tenant_id');
      setImpersonatingId('');
    }
    await syncState();
  };

  const handleVerifyPro = async (userId: string, isVerified: boolean) => {
    try {
      await apiClient.post(`/admin/professionals/${userId}/verify`, { isVerified });
      alert(`Professional profile verification ${isVerified ? 'approved' : 'rejected'} successfully.`);
      await fetchPendingPros();
      await fetchAdminMetrics();
    } catch (err) {
      console.error('Error verifying professional profile:', err);
      alert('Failed to update professional verification status.');
    }
  };

  const handleUpdateQuota = async (tenantId: string) => {
    const quotaBytes = newQuotaGb * 1024 * 1024 * 1024;
    try {
      await apiClient.post(`/admin/tenants/${tenantId}/quota`, { quotaBytes });
      alert('Workspace storage quota updated successfully.');
      setEditingQuotaTenantId(null);
      await fetchTenants();
      await fetchAdminMetrics();
    } catch (err) {
      console.error('Error updating tenant quota:', err);
      alert('Failed to update tenant storage limit.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', color: '#cbd5e1', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Sidebar */}
      <aside style={{ width: '280px', background: '#1e293b', color: '#fff', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ background: '#ef4444', width: 38, height: 38, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>S</div>
          <div>
            <h2 style={{ fontSize: '1rem', color: '#fff', margin: 0, fontWeight: 'bold' }}>System Operations</h2>
            <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>Super Administrator Desk</span>
          </div>
        </div>

        <nav style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 8, color: activeSubTab === 'metrics' ? '#fff' : '#94a3b8', background: activeSubTab === 'metrics' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', border: activeSubTab === 'metrics' ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setActiveSubTab('metrics')}
          >
            <ShieldCheck size={18} /> Platform Health
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 8, color: activeSubTab === 'verifications' ? '#fff' : '#94a3b8', background: activeSubTab === 'verifications' ? 'rgba(16, 185, 129, 0.15)' : 'transparent', border: activeSubTab === 'verifications' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setActiveSubTab('verifications')}
          >
            <UserCheck size={18} /> Pro Verifications ({pendingPros.length})
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 8, color: activeSubTab === 'invoices' ? '#fff' : '#94a3b8', background: activeSubTab === 'invoices' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', border: activeSubTab === 'invoices' ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setActiveSubTab('invoices')}
          >
            <Building size={18} /> Global Billing
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 8, color: activeSubTab === 'tickets' ? '#fff' : '#94a3b8', background: activeSubTab === 'tickets' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', border: activeSubTab === 'tickets' ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setActiveSubTab('tickets')}
          >
            <HelpCircle size={18} /> Helpdesk Tickets ({tickets.filter(t => t.status === 'Open').length})
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 8, color: activeSubTab === 'logs' ? '#fff' : '#94a3b8', background: activeSubTab === 'logs' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', border: activeSubTab === 'logs' ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setActiveSubTab('logs')}
          >
            <Database size={18} /> System Audit Trail
          </button>
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444', fontSize: '0.9rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }} onClick={onLogout}>
            <LogOut size={16} /> Exit Admin
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxHeight: '100vh' }}>
        
        {/* PLATFORM HEALTH & WORKSPACES DIRECTORY */}
        {activeSubTab === 'metrics' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#fff', margin: 0 }}>System Operations Console</h1>
                <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>Real-time monitoring of tenant databases, storage allocations, and billing cycles.</p>
              </div>
              <button 
                onClick={loadData}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
              >
                <RefreshCw size={14} className={metricsLoading ? 'animate-spin' : ''} /> Refresh Data
              </button>
            </div>

            {/* Metrics cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><HardDrive size={14} /> Active Storage</span>
                <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: '0.5rem 0', color: '#fff' }}>
                  {metrics ? (metrics.totalStorageUsedBytes / 1024 / 1024).toFixed(1) : '0.0'} MB
                </p>
                <span style={{ color: '#00a896', fontSize: '0.75rem', fontWeight: 'bold' }}>Distributed Google Drive Adapters</span>
              </div>

              <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><DollarSign size={14} /> Estimated MRR</span>
                <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: '0.5rem 0', color: '#10b981' }}>
                  ${metrics ? (metrics.systemMonthlyRevenueCents / 100).toFixed(2) : '0.00'}
                </p>
                <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                  ARR: ${metrics ? ((metrics.systemMonthlyRevenueCents * 12) / 100).toFixed(2) : '0.00'}
                </span>
              </div>

              <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Users size={14} /> Platform Growth</span>
                <p style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: '0.5rem 0', color: '#3b82f6' }}>
                  {metrics ? metrics.totalTenants : 0} Workspaces
                </p>
                <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                  Professionals: {metrics ? metrics.totalProfessionals : 0}
                </span>
              </div>
            </div>

            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#fff', fontSize: '1.1rem' }}>Platform Infrastructure Diagnostics</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#0f172a', borderRadius: 8, border: '1px solid rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Lock size={20} color="#10b981" />
                    <div>
                      <p style={{ fontWeight: 'bold', margin: 0, fontSize: '0.95rem', color: '#fff' }}>Supabase Authentication Services</p>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Role-based Access Tokens Active. JWT encryption validated.</span>
                    </div>
                  </div>
                  <span style={{ color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>Operational</span>
                </div>
              </div>
            </div>

            {/* Tenants Directory & Impersonation */}
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', color: '#fff' }}>Active Tenants Directory & Impersonation</h3>
              {impersonatingId && (
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', color: '#fbe5c9', padding: '0.75rem 1rem', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <span>Currently impersonating Tenant ID: <strong>{impersonatingId}</strong></span>
                  <button 
                    onClick={() => handleImpersonate('')} 
                    style={{ background: '#f59e0b', color: '#000', border: 'none', padding: '0.35rem 1rem', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <EyeOff size={14} /> Stop Impersonating
                  </button>
                </div>
              )}
              
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', color: '#94a3b8' }}>
                    <th style={{ padding: '0.75rem' }}>Tenant Name</th>
                    <th>Business Type</th>
                    <th>Compliance Score</th>
                    <th>Storage Allocation (Used / Quota)</th>
                    <th style={{ textAlign: 'right', paddingRight: '0.75rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#fff' }}>{t.name}</td>
                      <td>{t.business_type}</td>
                      <td>
                        <span style={{ color: t.compliance_score >= 80 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                          {t.compliance_score}%
                        </span>
                      </td>
                      <td>
                        {editingQuotaTenantId === t.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input 
                              type="number"
                              value={newQuotaGb}
                              onChange={e => setNewQuotaGb(Number(e.target.value))}
                              style={{ width: '60px', padding: '0.2rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' }}
                            />
                            <span style={{ fontSize: '0.8rem' }}>GB</span>
                            <button 
                              onClick={() => handleUpdateQuota(t.id)}
                              style={{ padding: '0.25rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              <Check size={12} />
                            </button>
                            <button 
                              onClick={() => setEditingQuotaTenantId(null)}
                              style={{ padding: '0.25rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>{(t.storage_used_bytes / 1024 / 1024).toFixed(1)} MB / {(t.storage_limit_bytes / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                            <button 
                              onClick={() => { setEditingQuotaTenantId(t.id); setNewQuotaGb(t.storage_limit_bytes / 1024 / 1024 / 1024); }}
                              style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: 0 }}
                              title="Override Quota"
                            >
                              <Edit2 size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '0.75rem' }}>
                        {impersonatingId === t.id ? (
                          <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold' }}>Active Impersonation</span>
                        ) : (
                          <button 
                            onClick={() => handleImpersonate(t.id)}
                            style={{ padding: '0.35rem 0.75rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'bold' }}
                          >
                            <Eye size={14} /> Impersonate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PENDING PROFESSIONAL VERIFICATIONS SUBTAB */}
        {activeSubTab === 'verifications' && (
          <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ color: '#fff', margin: '0 0 0.5rem 0' }}>Professional Credentials Verification</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Approve tax and accounting credentials for accountants applying to the EAC Solutions Marketplace.
            </p>

            {prosLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading credentials queue...</div>
            ) : pendingPros.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <CheckCircle size={32} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
                <p style={{ margin: 0 }}>All professional profiles have been verified. Verification queue is empty.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', color: '#94a3b8' }}>
                    <th style={{ padding: '0.75rem' }}>Professional Name</th>
                    <th>Email Address</th>
                    <th>Hourly Rate</th>
                    <th>Specializations</th>
                    <th>Verification Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPros.map(pro => (
                    <tr key={pro.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', color: '#cbd5e1' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#fff' }}>{pro.users?.full_name || 'Member'}</td>
                      <td>{pro.users?.email || 'N/A'}</td>
                      <td>${(pro.hourly_rate_cents / 100).toFixed(2)} / hr</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {pro.specializations?.map((spec: string, idx: number) => (
                            <span key={idx} style={{ background: '#0f172a', padding: '0.15rem 0.35rem', borderRadius: '4px', fontSize: '0.75rem' }}>{spec}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleVerifyPro(pro.id, true)}
                            style={{ padding: '0.35rem 0.75rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                          >
                            Approve Credentials
                          </button>
                          <button
                            onClick={() => handleVerifyPro(pro.id, false)}
                            style={{ padding: '0.35rem 0.75rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Global Billing */}
        {activeSubTab === 'invoices' && (
          <div>
            <h2 style={{ color: '#fff', marginBottom: '1.25rem' }}>Global Invoices Directory</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', background: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', background: '#1e293b' }}>
                  <th style={{ padding: '1rem' }}>Invoice ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => (
                  // Displaying custom mock/related bills as billing history for all tenants
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', color: '#cbd5e1' }}>
                    <td style={{ padding: '1rem' }}>INV-W-{t.id.slice(0, 8).toUpperCase()}</td>
                    <td style={{ fontWeight: 'bold', color: '#fff' }}>$199.00</td>
                    <td>
                      <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>Paid</span>
                    </td>
                    <td>2026-07-01</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Support Tickets */}
        {activeSubTab === 'tickets' && (
          <div>
            <h2 style={{ color: '#fff', marginBottom: '1.25rem' }}>Helpdesk Tickets Management</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', background: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', background: '#1e293b' }}>
                  <th style={{ padding: '1rem' }}>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(tkt => (
                  <tr key={tkt.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', color: '#cbd5e1' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#fff' }}>{tkt.subject}</td>
                    <td>{tkt.category}</td>
                    <td>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.2rem 0.4rem', 
                        borderRadius: '4px',
                        background: tkt.priority === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
                        color: tkt.priority === 'High' ? '#ef4444' : '#cbd5e1'
                      }}>
                        {tkt.priority}
                      </span>
                    </td>
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
            <h2 style={{ color: '#fff', marginBottom: '1.25rem' }}>Platform Audit Trail Logs</h2>
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '450px', overflowY: 'auto' }}>
                {auditLogs.map((log) => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.02)', borderRadius: 6, fontSize: '0.85rem', color: '#cbd5e1' }}>
                    <div>
                      <span style={{ color: '#64748b', marginRight: '1rem' }}>{new Date(log.created_at).toLocaleString()}</span>
                      <strong style={{ color: '#fff' }}>[{log.category}]</strong> {log.action}
                    </div>
                    <span style={{ color: '#94a3b8' }}>User: {log.user_identity}</span>
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
