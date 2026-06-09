import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext.tsx';
import { apiClient } from '../api/client.ts';


import { 
  Building, ShieldCheck, HelpCircle, LogOut, Database, Lock, Eye, EyeOff,
  UserCheck, DollarSign, Users, Award, HardDrive, RefreshCw, Edit2, Check, X,
  CheckCircle, Shield
} from 'lucide-react';
import DataTable from '../components/ui/DataTable.tsx';
import ProfileSettings from './ProfileSettings.tsx';

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
  const [globalInvoices, setGlobalInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  
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

  const fetchGlobalInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const res = await apiClient.get('/admin/invoices');
      setGlobalInvoices(res.data || []);
    } catch (err) {
      console.error('Error fetching global invoices:', err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const loadData = () => {
    fetchTenants();
    fetchAdminMetrics();
    if (activeSubTab === 'verifications') {
      fetchPendingPros();
    } else if (activeSubTab === 'invoices') {
      fetchGlobalInvoices();
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

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 8, color: activeSubTab === 'security' ? '#fff' : '#94a3b8', background: activeSubTab === 'security' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', border: activeSubTab === 'security' ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent', textAlign: 'left', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setActiveSubTab('security')}
          >
            <Shield size={18} /> Security & Profile
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
              
              <DataTable
                columns={[
                  {
                    key: 'name',
                    label: 'Tenant Name',
                    sortable: true,
                    render: (row) => <strong style={{ color: '#fff' }}>{row.name}</strong>
                  },
                  {
                    key: 'business_type',
                    label: 'Business Type',
                    sortable: true
                  },
                  {
                    key: 'compliance_score',
                    label: 'Compliance Score',
                    sortable: true,
                    render: (row) => (
                      <span style={{ color: row.compliance_score >= 80 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                        {row.compliance_score}%
                      </span>
                    )
                  },
                  {
                    key: 'storage_limit_bytes',
                    label: 'Storage Allocation (Used / Quota)',
                    sortable: true,
                    render: (row) => {
                      return editingQuotaTenantId === row.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input 
                            type="number"
                            value={newQuotaGb}
                            onChange={e => setNewQuotaGb(Number(e.target.value))}
                            style={{ width: '60px', padding: '0.2rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' }}
                          />
                          <span style={{ fontSize: '0.8rem' }}>GB</span>
                          <button 
                            onClick={() => handleUpdateQuota(row.id)}
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
                          <span>{(row.storage_used_bytes / 1024 / 1024).toFixed(1)} MB / {(row.storage_limit_bytes / 1024 / 1024 / 1024).toFixed(1)} GB</span>
                          <button 
                            onClick={() => { setEditingQuotaTenantId(row.id); setNewQuotaGb(row.storage_limit_bytes / 1024 / 1024 / 1024); }}
                            style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: 0 }}
                            title="Override Quota"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      );
                    }
                  },
                  {
                    key: 'actions',
                    label: 'Actions',
                    sortable: false,
                    render: (row) => {
                      return impersonatingId === row.id ? (
                        <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold' }}>Active Impersonation</span>
                      ) : (
                        <button 
                          onClick={() => handleImpersonate(row.id)}
                          style={{ padding: '0.35rem 0.75rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'bold' }}
                        >
                          <Eye size={14} /> Impersonate
                        </button>
                      );
                    }
                  }
                ]}
                data={tenants}
                searchPlaceholder="Search tenants..."
                searchKey="name"
                pageSize={5}
              />
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
              <DataTable
                columns={[
                  {
                    key: 'full_name',
                    label: 'Professional Name',
                    sortable: true,
                    render: (row) => <strong style={{ color: '#fff' }}>{row.users?.full_name || 'Member'}</strong>
                  },
                  {
                    key: 'email',
                    label: 'Email Address',
                    sortable: true,
                    render: (row) => <span>{row.users?.email || 'N/A'}</span>
                  },
                  {
                    key: 'hourly_rate_cents',
                    label: 'Hourly Rate',
                    sortable: true,
                    render: (row) => <span>${(row.hourly_rate_cents / 100).toFixed(2)} / hr</span>
                  },
                  {
                    key: 'specializations',
                    label: 'Specializations',
                    sortable: false,
                    render: (row) => (
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {row.specializations?.map((spec: string, idx: number) => (
                          <span key={idx} style={{ background: '#0f172a', padding: '0.15rem 0.35rem', borderRadius: '4px', fontSize: '0.75rem' }}>{spec}</span>
                        ))}
                      </div>
                    )
                  },
                  {
                    key: 'actions',
                    label: 'Verification Actions',
                    sortable: false,
                    render: (row) => (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleVerifyPro(row.id, true)}
                          style={{ padding: '0.35rem 0.75rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                        >
                          Approve Credentials
                        </button>
                        <button
                          onClick={() => handleVerifyPro(row.id, false)}
                          style={{ padding: '0.35rem 0.75rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                        >
                          Reject
                        </button>
                      </div>
                    )
                  }
                ]}
                data={pendingPros}
                searchPlaceholder="Search professional queue..."
                pageSize={5}
              />
            )}
          </div>
        )}

        {/* Global Billing */}
        {activeSubTab === 'invoices' && (
          <div>
            <h2 style={{ color: '#fff', marginBottom: '1.25rem' }}>Global Invoices Directory</h2>
            {invoicesLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading global billing history...</div>
            ) : globalInvoices.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <p>No platform billing invoices generated.</p>
              </div>
            ) : (
              <DataTable
                columns={[
                  {
                    key: 'stripe_invoice_id',
                    label: 'Invoice ID',
                    sortable: true,
                    render: (row) => <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.stripe_invoice_id || row.id.slice(0, 8).toUpperCase()}</span>
                  },
                  {
                    key: 'tenant',
                    label: 'Tenant Workspace',
                    sortable: true,
                    render: (row) => <strong style={{ color: '#fff' }}>{row.tenants?.name || 'Workspace'}</strong>
                  },
                  {
                    key: 'amount_cents',
                    label: 'Amount',
                    sortable: true,
                    render: (row) => <strong style={{ color: '#10b981' }}>${(row.amount_cents / 100).toFixed(2)}</strong>
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    sortable: true,
                    render: (row) => (
                      <span style={{ 
                        background: row.status === 'paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                        color: row.status === 'paid' ? '#10b981' : '#ef4444', 
                        padding: '0.2rem 0.4rem', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem' 
                      }}>
                        {row.status.toUpperCase()}
                      </span>
                    )
                  },
                  {
                    key: 'due_date',
                    label: 'Issue/Due Date',
                    sortable: true,
                    render: (row) => <span>{new Date(row.due_date).toLocaleDateString()}</span>
                  }
                ]}
                data={globalInvoices}
                searchPlaceholder="Filter global invoices..."
                searchKey="stripe_invoice_id"
                pageSize={10}
              />
            )}
          </div>
        )}

        {/* Support Tickets */}
        {activeSubTab === 'tickets' && (
          <div>
            <h2 style={{ color: '#fff', marginBottom: '1.25rem' }}>Helpdesk Tickets Management</h2>
            <DataTable
              columns={[
                {
                  key: 'subject',
                  label: 'Subject',
                  sortable: true,
                  render: (row) => <strong style={{ color: '#fff' }}>{row.subject}</strong>
                },
                {
                  key: 'category',
                  label: 'Category',
                  sortable: true
                },
                {
                  key: 'priority',
                  label: 'Priority',
                  sortable: true,
                  render: (row) => (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      padding: '0.2rem 0.4rem', 
                      borderRadius: '4px',
                      background: row.priority === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
                      color: row.priority === 'High' ? '#ef4444' : '#cbd5e1'
                    }}>
                      {row.priority}
                    </span>
                  )
                },
                {
                  key: 'status',
                  label: 'Status',
                  sortable: true
                }
              ]}
              data={tickets}
              searchPlaceholder="Search helpdesk tickets..."
              searchKey="subject"
              pageSize={5}
            />
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

        {/* Security & Profile Settings */}
        {activeSubTab === 'security' && (
          <div style={{ color: '#fff' }}>
            <ProfileSettings />
          </div>
        )}
      </main>
    </div>
  );
}
