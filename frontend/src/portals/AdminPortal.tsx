import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext.tsx';
import { apiClient } from '../api/client.ts';
import { 
  Building, ShieldCheck, HelpCircle, LogOut, Database, Lock, Eye, EyeOff,
  UserCheck, DollarSign, Users, Award, HardDrive, RefreshCw, Edit2, Check, X,
  CheckCircle, Shield, PlusCircle, Trash2, UserPlus, Settings, Layers, Activity,
  FileText, Globe, AlertCircle
} from 'lucide-react';
import DataTable from '../components/ui/DataTable.tsx';
import SecurityLayout from '../components/security/SecurityLayout.tsx';

// Super Admin / Governance Modules
import SystemTelemetry from '../components/admin/SystemTelemetry.tsx';
import TenantManager from '../components/admin/TenantManager.tsx';
import SecurityEventLogs from '../components/admin/SecurityEventLogs.tsx';
import ParameterConfig from '../components/admin/ParameterConfig.tsx';
import ImpersonatorConsole from '../components/admin/ImpersonatorConsole.tsx';
import MigrationLogs from '../components/admin/MigrationLogs.tsx';
import IpWhitelist from '../components/admin/IpWhitelist.tsx';

export default function AdminPortal({ onLogout }: { onLogout: () => void }) {
  const context = useContext(AppContext);
  if (!context) return null;

  const { 
    tickets, auditLogs, syncState
  } = context;

  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/admin/clients')) return 'clients';
    if (path.startsWith('/admin/accountants')) return 'accountants';
    if (path.startsWith('/admin/approvals')) return 'approvals';
    if (path.startsWith('/admin/billing')) return 'billing';
    if (path.startsWith('/admin/files')) return 'files';
    if (path.startsWith('/admin/audit')) return 'audit';
    if (path.startsWith('/admin/settings')) return 'settings';
    if (path.startsWith('/admin/security')) return 'security';
    if (path.startsWith('/admin/impersonator')) return 'impersonator';
    return 'metrics';
  };

  const activeSubTab = getActiveTab();
  const setActiveSubTab = (tab: string) => {
    navigate('/admin/' + tab);
  };
  const [tenants, setTenants] = useState<any[]>([]);
  const [impersonatingId, setImpersonatingId] = useState<string>(() => localStorage.getItem('impersonate_tenant_id') || '');

  // Admin operational states
  const [metrics, setMetrics] = useState<any>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [globalInvoices, setGlobalInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  
  // Accountants directory
  const [accountants, setAccountants] = useState<any[]>([
    { id: 'acc1', full_name: 'Sarah Jenkins', email: 'sarah@eac.local', role: 'Senior Accountant', status: 'Active' },
    { id: 'acc2', full_name: 'David Patel', email: 'david@eac.local', role: 'Junior Accountant', status: 'Active' }
  ]);
  
  // Pending approvals
  const [pendingPricingPackages, setPendingPricingPackages] = useState<any[]>([
    { id: 'pkg1', name: 'Custom Enterprise Tier', code: 'stark_custom', priceCents: 50000, storageLimitBytes: 107374182400, requestedBy: 'Sarah Jenkins' },
    { id: 'pkg2', name: 'Startup Special Rate', code: 'startup_s1', priceCents: 7500, storageLimitBytes: 21474836480, requestedBy: 'David Patel' }
  ]);

  const [pendingRefundRequests, setPendingRefundRequests] = useState<any[]>([
    { id: 'ref1', invoiceId: 'manual_9988a', clientName: 'Stark Industries', amountCents: 25000, reason: 'Duplicate charge correction requested' }
  ]);

  // Client CRUD inputs
  const [newClientName, setNewClientName] = useState('');
  const [newClientType, setNewClientType] = useState('LLC');
  const [newClientRevenue, setNewClientRevenue] = useState('0-100k');

  // Client Merging
  const [mergeSourceId, setMergeSourceId] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');

  // Client Transfer
  const [transferClientId, setTransferClientId] = useState('');
  const [transferAccountantId, setTransferAccountantId] = useState('');

  // Accountant creation inputs
  const [newAccName, setNewAccName] = useState('');
  const [newAccEmail, setNewAccEmail] = useState('');
  const [newAccRole, setNewAccRole] = useState('Senior Accountant');

  // Quota editor state
  const [editingQuotaTenantId, setEditingQuotaTenantId] = useState<string | null>(null);
  const [newQuotaGb, setNewQuotaGb] = useState<number>(10);

  // System governance settings
  const [brandingName, setBrandingName] = useState('EAC Solutions');
  const [primaryTheme, setPrimaryTheme] = useState('Classic Navy');
  const [smtpServer, setSmtpServer] = useState('smtp.eac-solutions.local');
  const [notificationsFrequency, setNotificationsFrequency] = useState('Daily');

  // File governance state
  const [globalDeletedFiles, setGlobalDeletedFiles] = useState<any[]>([
    { id: 'gf1', name: 'TaxDraft_2025_Legacy.pdf', size: 2048000, owner: 'Tony Stark', dateDeleted: '2026-06-05', daysRemaining: 25 },
    { id: 'gf2', name: 'StagingLedger_Wayne.xlsx', size: 10450000, owner: 'Bruce Wayne', dateDeleted: '2026-06-08', daysRemaining: 28 }
  ]);

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
    if (activeSubTab === 'billing') {
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

  // Client Control logic
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    try {
      await apiClient.post('/tenants', {
        name: newClientName,
        businessType: newClientType,
        revenueBracket: newClientRevenue
      });
      alert(`Successfully registered new client workspace organization: ${newClientName}!`);
      setNewClientName('');
      await fetchTenants();
    } catch (err) {
      console.error('Failed to create client:', err);
    }
  };

  const handleToggleClientActive = async (client: any) => {
    const isSuspended = client.business_type === 'Suspended Enterprise';
    const nextStatus = isSuspended ? 'active' : 'suspended';
    try {
      await apiClient.put(`/admin/tenants/${client.id}/status`, { status: nextStatus });
      alert(`Client workspace status updated.`);
      await fetchTenants();
    } catch (err) {
      console.error('Failed to toggle active status:', err);
    }
  };

  const handleMergeClients = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId) {
      alert('Select distinct organizations to perform merge.');
      return;
    }
    const sourceName = tenants.find(t => t.id === mergeSourceId)?.name;
    const targetName = tenants.find(t => t.id === mergeTargetId)?.name;
    alert(`Successfully merged duplicate database organization records: ${sourceName} merged into ${targetName}.`);
    setMergeSourceId('');
    setMergeTargetId('');
  };

  const handleTransferClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferClientId || !transferAccountantId) return;
    const clientName = tenants.find(t => t.id === transferClientId)?.name;
    const accountantName = accountants.find(a => a.id === transferAccountantId)?.full_name;
    alert(`Transferred organizational files and files ownership for ${clientName} to designated specialist: ${accountantName}.`);
    setTransferClientId('');
    setTransferAccountantId('');
  };

  // Accountant Control logic
  const handleCreateAccountant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName || !newAccEmail) return;
    const newAcc = {
      id: 'acc_' + Math.random().toString(36).substring(7),
      full_name: newAccName,
      email: newAccEmail,
      role: newAccRole,
      status: 'Active'
    };
    setAccountants(prev => [...prev, newAcc]);
    alert(`Accountant profile generated for: ${newAccName}. Credentials dispatched.`);
    setNewAccName('');
    setNewAccEmail('');
  };

  const handleToggleAccountantStatus = (id: string) => {
    setAccountants(prev => prev.map(a => {
      if (a.id === id) {
        const nextStatus = a.status === 'Active' ? 'Suspended' : 'Active';
        return { ...a, status: nextStatus };
      }
      return a;
    }));
  };

  // Approvals operations
  const handleApprovePackage = (pkgId: string) => {
    const pkg = pendingPricingPackages.find(p => p.id === pkgId);
    alert(`Approved pricing package structure: '${pkg.name}' (${pkg.code}). Package is now live and billable.`);
    setPendingPricingPackages(prev => prev.filter(p => p.id !== pkgId));
  };

  const handleApproveRefund = (refId: string) => {
    const ref = pendingRefundRequests.find(r => r.id === refId);
    alert(`Refund payment of $${(ref.amountCents / 100).toFixed(2)} approved for client: ${ref.clientName}. Refund transaction queued.`);
    setPendingRefundRequests(prev => prev.filter(r => r.id !== refId));
  };

  // File Governance recovery operations
  const handleRestoreGlobalFile = (id: string) => {
    const file = globalDeletedFiles.find(f => f.id === id);
    alert(`Restored document: '${file.name}' to client vault storage.`);
    setGlobalDeletedFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      
      {/* Sidebar - Restructured to 8 Tabs */}
      <aside style={{ width: 'var(--sidebar-width)', background: 'var(--sidebar-bg)', color: 'var(--sidebar-text)', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--sidebar-border)', flexShrink: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--sidebar-border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ background: '#DC2626', width: 35, height: 35, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>S</div>
          <div>
            <h2 style={{ fontSize: '1.05rem', color: 'var(--sidebar-text)', margin: 0 }}>Admin Portal</h2>
            <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>System Control Center</span>
          </div>
        </div>

        <nav style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto' }}>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', width: '100%', borderRadius: 6, color: activeSubTab === 'metrics' ? 'var(--sidebar-active-text)' : 'var(--text-sec)', background: activeSubTab === 'metrics' ? 'var(--sidebar-active-bg)' : 'transparent', textAlign: 'left', fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setActiveSubTab('metrics')}
          >
            <ShieldCheck size={16} /> Platform Diagnostics
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', width: '100%', borderRadius: 6, color: activeSubTab === 'clients' ? 'var(--sidebar-active-text)' : 'var(--text-sec)', background: activeSubTab === 'clients' ? 'var(--sidebar-active-bg)' : 'transparent', textAlign: 'left', fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setActiveSubTab('clients')}
          >
            <Building size={16} /> Client Control
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', width: '100%', borderRadius: 6, color: activeSubTab === 'accountants' ? 'var(--sidebar-active-text)' : 'var(--text-sec)', background: activeSubTab === 'accountants' ? 'var(--sidebar-active-bg)' : 'transparent', textAlign: 'left', fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setActiveSubTab('accountants')}
          >
            <Users size={16} /> Accountant Control
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', width: '100%', borderRadius: 6, color: activeSubTab === 'approvals' ? 'var(--sidebar-active-text)' : 'var(--text-sec)', background: activeSubTab === 'approvals' ? 'var(--sidebar-active-bg)' : 'transparent', textAlign: 'left', fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setActiveSubTab('approvals')}
          >
            <UserCheck size={16} /> Approval Center ({pendingPricingPackages.length + pendingRefundRequests.length})
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', width: '100%', borderRadius: 6, color: activeSubTab === 'billing' ? 'var(--sidebar-active-text)' : 'var(--text-sec)', background: activeSubTab === 'billing' ? 'var(--sidebar-active-bg)' : 'transparent', textAlign: 'left', fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setActiveSubTab('billing')}
          >
            <DollarSign size={16} /> Billing & Invoices
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', width: '100%', borderRadius: 6, color: activeSubTab === 'files' ? 'var(--sidebar-active-text)' : 'var(--text-sec)', background: activeSubTab === 'files' ? 'var(--sidebar-active-bg)' : 'transparent', textAlign: 'left', fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setActiveSubTab('files')}
          >
            <HardDrive size={16} /> File Governance
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', width: '100%', borderRadius: 6, color: activeSubTab === 'audit' ? 'var(--sidebar-active-text)' : 'var(--text-sec)', background: activeSubTab === 'audit' ? 'var(--sidebar-active-bg)' : 'transparent', textAlign: 'left', fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setActiveSubTab('audit')}
          >
            <Database size={16} /> Audit & Events
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', width: '100%', borderRadius: 6, color: activeSubTab === 'settings' ? 'var(--sidebar-active-text)' : 'var(--text-sec)', background: activeSubTab === 'settings' ? 'var(--sidebar-active-bg)' : 'transparent', textAlign: 'left', fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setActiveSubTab('settings')}
          >
            <Settings size={16} /> Platform Settings
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', width: '100%', borderRadius: 6, color: activeSubTab === 'impersonator' ? 'var(--sidebar-active-text)' : 'var(--text-sec)', background: activeSubTab === 'impersonator' ? 'var(--sidebar-active-bg)' : 'transparent', textAlign: 'left', fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setActiveSubTab('impersonator')}
          >
            <Eye size={16} /> Session Impersonator
          </button>
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--sidebar-border)' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#EF4444', fontSize: '0.9rem', background: 'none', border: 'none', cursor: 'pointer' }} onClick={onLogout}>
            <LogOut size={16} /> Exit Control
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxHeight: '100vh' }}>
        
        {/* 1. PLATFORM DIAGNOSTICS */}
        {activeSubTab === 'metrics' && (
          <SystemTelemetry />
        )}

        {/* 2. CLIENT CONTROL */}
        {activeSubTab === 'clients' && (
          <TenantManager onImpersonate={handleImpersonate} impersonatingId={impersonatingId} />
        )}

        {/* 3. ACCOUNTANT CONTROL */}
        {activeSubTab === 'accountants' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Specialists & Accountants Roster</h1>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem' }}>Create consultant credentials, adjust permission levels, and retrieve performance reports.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
              <div>
                <DataTable
                  columns={[
                    {
                      key: 'full_name',
                      label: 'Accountant Name',
                      sortable: true,
                      render: (row) => <strong>👤 {row.full_name}</strong>
                    },
                    {
                      key: 'email',
                      label: 'Email',
                      sortable: true
                    },
                    {
                      key: 'role',
                      label: 'Security Level',
                      sortable: true
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      sortable: true,
                      render: (row) => (
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: row.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: row.status === 'Active' ? 'green' : 'red' }}>
                          {row.status.toUpperCase()}
                        </span>
                      )
                    },
                    {
                      key: 'actions',
                      label: 'Action',
                      sortable: false,
                      render: (row) => (
                        <button onClick={() => handleToggleAccountantStatus(row.id)} style={{ padding: '0.35rem 0.75rem', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                          {row.status === 'Active' ? 'Suspend' : 'Reactivate'}
                        </button>
                      )
                    }
                  ]}
                  data={accountants}
                  pageSize={5}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="premium-card">
                  <h3>Provision Accountant Credentials</h3>
                  <form onSubmit={handleCreateAccountant} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                    <input 
                      type="text" 
                      placeholder="Full Name"
                      value={newAccName}
                      onChange={e => setNewAccName(e.target.value)}
                      required
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', width: '100%' }}
                    />
                    
                    <input 
                      type="email" 
                      placeholder="colleague@eac-solutions.com"
                      value={newAccEmail}
                      onChange={e => setNewAccEmail(e.target.value)}
                      required
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', width: '100%' }}
                    />

                    <select
                      value={newAccRole}
                      onChange={e => setNewAccRole(e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', width: '100%' }}
                    >
                      <option value="Senior Accountant">Senior Consultant</option>
                      <option value="Junior Accountant">Junior Assistant</option>
                    </select>

                    <button type="submit" style={{ padding: '0.5rem', background: '#B58A2B', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Provision Profile
                    </button>
                  </form>
                </div>

                <div className="premium-card">
                  <h3>Productivity Insights</h3>
                  <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <div>Sarah Jenkins: <strong>14 Obligations Filed</strong> this month</div>
                    <div>David Patel: <strong>26 Tasks Resolved</strong> this month</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. APPROVAL CENTER */}
        {activeSubTab === 'approvals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Approval Center Queue</h1>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem' }}>Authorize accountant-proposed custom pricing plans, customer refunds, and document classifications.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateRows: 'auto auto', gap: '2rem' }}>
              <div className="premium-card">
                <h3>Pricing Package Proposals ({pendingPricingPackages.length})</h3>
                {pendingPricingPackages.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '1rem 0 0' }}>No pending package proposals.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                    {pendingPricingPackages.map(pkg => (
                      <div key={pkg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                        <div>
                          <strong>{pkg.name} ({pkg.code})</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Proposed rate: ${(pkg.priceCents / 100).toFixed(2)}/mo · Space: {pkg.storageLimitBytes / 1024 / 1024 / 1024} GB · Proposed by: {pkg.requestedBy}</div>
                        </div>
                        <button onClick={() => handleApprovePackage(pkg.id)} style={{ padding: '0.4rem 0.8rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>Approve Plan</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="premium-card">
                <h3>Refund Requests Queue ({pendingRefundRequests.length})</h3>
                {pendingRefundRequests.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '1rem 0 0' }}>No pending refund claims.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                    {pendingRefundRequests.map(ref => (
                      <div key={ref.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                        <div>
                          <strong>Invoice: {ref.invoiceId} · Client: {ref.clientName}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Amount: ${(ref.amountCents / 100).toFixed(2)} · Reason: {ref.reason}</div>
                        </div>
                        <button onClick={() => handleApproveRefund(ref.id)} style={{ padding: '0.4rem 0.8rem', background: '#DC2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>Approve Refund</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. BILLING & INVOICES */}
        {activeSubTab === 'billing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Global Invoices Directory</h1>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem' }}>Complete record audit of all service statements generated across the platform.</p>
            </div>

            {invoicesLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading billing logs...</div>
            ) : (
              <DataTable
                columns={[
                  {
                    key: 'id',
                    label: 'Invoice ID',
                    sortable: true,
                    render: (row) => <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{row.id.substring(0, 8)}...</span>
                  },
                  {
                    key: 'amount_cents',
                    label: 'Statement Amount',
                    sortable: true,
                    render: (row) => <strong>${(row.amount_cents / 100).toFixed(2)}</strong>
                  },
                  {
                    key: 'status',
                    label: 'Payment Status',
                    sortable: true,
                    render: (row) => (
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: row.status === 'paid' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: row.status === 'paid' ? 'green' : 'red' }}>
                        {row.status.toUpperCase()}
                      </span>
                    )
                  },
                  {
                    key: 'due_date',
                    label: 'Due Date',
                    sortable: true
                  }
                ]}
                data={globalInvoices}
                pageSize={10}
              />
            )}
          </div>
        )}

        {/* 6. FILE GOVERNANCE */}
        {activeSubTab === 'files' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Global File Governance</h1>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem' }}>Control global files retention policies, view analytics, and access the deleted file recovery center.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
              <div className="premium-card">
                <h3>Global Deleted Files Recovery Queue (30 Days Limit)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  {globalDeletedFiles.map(file => (
                    <div key={file.id} style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                      <div>
                        <strong>{file.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Size: {(file.size / 1024 / 1024).toFixed(2)} MB · Owner: {file.owner} · Days Remaining: {file.daysRemaining}</div>
                      </div>
                      <button onClick={() => handleRestoreGlobalFile(file.id)} style={{ padding: '0.35rem 0.75rem', background: 'rgba(16,185,129,0.15)', color: 'green', border: 'none', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>Restore</button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="premium-card">
                  <h3>Storage Analytics</h3>
                  <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <div>Stark Industries: <strong>2.4 MB</strong> used</div>
                    <div>Wayne Enterprises: <strong>4.8 MB</strong> used</div>
                  </div>
                </div>

                <div className="premium-card">
                  <h3>Global Retention Policy</h3>
                  <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <div>Soft Delete window: <strong>30 Days</strong></div>
                    <div>Archiving limits: <strong>7 Years standard</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. AUDIT & EVENTS */}
        {activeSubTab === 'audit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <SecurityEventLogs />
            <div style={{ marginTop: '2rem' }}>
              <MigrationLogs />
            </div>
          </div>
        )}

        {/* 8. PLATFORM SETTINGS */}
        {activeSubTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <ParameterConfig />
            <div style={{ marginTop: '2rem' }}>
              <IpWhitelist />
            </div>
          </div>
        )}

        {/* 9. SESSION IMPERSONATOR */}
        {activeSubTab === 'impersonator' && (
          <ImpersonatorConsole />
        )}

        {/* SECURITY & PROFILE TAB */}
        {activeSubTab === 'security' && (
          <SecurityLayout />
        )}
      </main>
    </div>
  );
}
