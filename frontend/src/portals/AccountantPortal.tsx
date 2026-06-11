import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppContext } from '../context/AppContext.tsx';
import { apiClient } from '../api/client.ts';
import { 
  Users, CalendarClock, MessageSquare, LogOut, Check, Send, 
  ShieldAlert, TrendingUp, X, MessageSquareText, Link, BookOpen, Briefcase,
  Sparkles, Shield, CreditCard, Plus, Trash2, PlusCircle, FileText, LayoutDashboard,
  Building, CheckCircle, HelpCircle, HardDrive, DollarSign, Award, FileUp, Video,
  Trash, RefreshCw, BarChart3, AlertCircle
} from 'lucide-react';
import LedgerManagement from './LedgerManagement.tsx';
import CrmManagement from './CrmManagement.tsx';
import BillingManagement from './BillingManagement.tsx';
import PayrollManagement from './PayrollManagement.tsx';
import ComplianceFilingDashboard from './ComplianceFilingDashboard.tsx';
import AICopilotPanel from './AICopilotPanel.tsx';
import InternalMessagingHub from './InternalMessagingHub.tsx';
import SecurityLayout from '../components/security/SecurityLayout.tsx';
import DataTable from '../components/ui/DataTable.tsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.tsx';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent'])
});

const commentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
});

export default function AccountantPortal({ onLogout }: { onLogout: () => void }) {
  const context = useContext(AppContext);
  if (!context) return null;

  const { 
    obligations, messages, updateObligationStatus, sendMessage, currentUser, tasks, createTask, syncState
  } = context;

  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/accountant/clients')) return 'clients';
    if (path.startsWith('/accountant/ledger')) return 'ledger';
    if (path.startsWith('/accountant/billing')) return 'billing';
    if (path.startsWith('/accountant/payroll')) return 'payroll';
    if (path.startsWith('/accountant/files')) return 'files';
    if (path.startsWith('/accountant/tasks')) return 'tasks';
    if (path.startsWith('/accountant/filings')) return 'filings';
    if (path.startsWith('/accountant/conversations')) return 'conversations';
    if (path.startsWith('/accountant/reporting')) return 'reporting';
    if (path.startsWith('/accountant/security')) return 'security';
    return 'dashboard';

  };

  const activeSubTab = getActiveTab();
  const [impersonatingId, setImpersonatingId] = useState<string>(() => localStorage.getItem('impersonate_tenant_id') || '');
  const [tenants, setTenants] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Selected client for CRM details
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  // CRM client onboarding state
  const [newClientName, setNewClientName] = useState('');
  const [newClientType, setNewClientType] = useState('LLC');
  const [newClientRevenue, setNewClientRevenue] = useState('0-100k');

  // Billing Dispatch state
  const [invoiceTenantId, setInvoiceTenantId] = useState('');
  const [invoiceAmountCents, setInvoiceAmountCents] = useState(25000); // default $250.00
  const [invoiceDueDate, setInvoiceDueDate] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
  const [invoiceDescription, setInvoiceDescription] = useState('');

  // Custom Pricing package state
  const [packageName, setPackageName] = useState('');
  const [packageCode, setPackageCode] = useState('');
  const [packagePriceCents, setPackagePriceCents] = useState(15000); // default $150
  const [packageStorageGb, setPackageStorageGb] = useState(50);

  // Vault mock filesystem state for the accountant
  const [vaultFiles, setVaultFiles] = useState<any[]>([
    { id: 'v1', name: 'Incorporation_Stark.pdf', size: 1024000, category: 'Corporate', date: '2026-06-01', deleted: false, version: 1 },
    { id: 'v2', name: 'Q1_Financials_Wayne.xlsx', size: 5048000, category: 'Taxation', date: '2026-05-15', deleted: false, version: 2 },
    { id: 'v3', name: 'LeaseAgreement_Draft.docx', size: 450000, category: 'Legal', date: '2026-06-08', deleted: true, version: 1 }
  ]);
  const [selectedFileForVersion, setSelectedFileForVersion] = useState<any>(null);
  const [searchVaultQuery, setSearchVaultQuery] = useState('');

  const fetchTenants = async () => {
    try {
      const res = await apiClient.get('/tenants');
      setTenants(res.data || []);
    } catch (err) {
      console.error('Error fetching tenants list:', err);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await apiClient.get('/billing/invoices');
      setInvoices(res.data || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await apiClient.get('/billing/plans');
      setPlans(res.data || []);
    } catch (err) {
      console.error('Error fetching billing plans:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await apiClient.get('/audit-logs');
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchTenants(),
      fetchInvoices(),
      fetchPlans(),
      fetchAuditLogs()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
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

  // Client status suspension/activation CRM handler
  const handleToggleClientStatus = async (client: any) => {
    const isSuspended = client.business_type === 'Suspended Enterprise';
    const nextStatus = isSuspended ? 'active' : 'suspended';
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await apiClient.put(`/admin/tenants/${client.id}/status`, { status: nextStatus });
      setSuccessMessage(`Client workspace '${client.name}' is now ${isSuspended ? 'Reactivated' : 'Suspended'}.`);
      await fetchTenants();
      if (selectedClient && selectedClient.id === client.id) {
        setSelectedClient({
          ...selectedClient,
          business_type: isSuspended ? 'Active Corporation' : 'Suspended Enterprise'
        });
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to update client active status.');
    }
  };

  // Client onboarding submission
  const handleOnboardClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await apiClient.post('/tenants', {
        name: newClientName,
        businessType: newClientType,
        revenueBracket: newClientRevenue
      });
      setSuccessMessage(`Successfully onboarded client workspace: ${newClientName}!`);
      setNewClientName('');
      await fetchTenants();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to onboard client.');
    }
  };

  // Create manual invoice dispatcher
  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceTenantId) return;
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await apiClient.post('/billing/invoices', {
        tenantId: invoiceTenantId,
        amountCents: invoiceAmountCents,
        dueDate: invoiceDueDate,
        description: invoiceDescription
      });
      setSuccessMessage('Successfully generated manual service invoice.');
      setInvoiceDescription('');
      await fetchInvoices();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to generate invoice.');
    }
  };

  // Void/Refund Actions
  const handleVoidInvoice = async (invoiceId: string) => {
    try {
      await apiClient.post(`/billing/invoices/${invoiceId}/void`);
      alert('Invoice Voided successfully.');
      await fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to void invoice.');
    }
  };

  const handleRefundInvoice = async (invoiceId: string) => {
    try {
      await apiClient.post(`/billing/invoices/${invoiceId}/refund`);
      alert('Invoice amount refunded successfully.');
      await fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to process refund.');
    }
  };

  // Propose pricing package custom items
  const handleProposePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageName.trim() || !packageCode.trim()) return;
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await apiClient.post('/billing/pricing/packages', {
        name: packageName,
        code: packageCode,
        priceCents: packagePriceCents,
        storageLimitBytes: packageStorageGb * 1024 * 1024 * 1024
      });
      setSuccessMessage(`Pricing item proposed: '${packageName}'. Pending Admin activation.`);
      setPackageName('');
      setPackageCode('');
      await fetchPlans();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to propose package.');
    }
  };

  // Vault mock operations
  const handleSoftDeleteFile = (id: string) => {
    setVaultFiles(prev => prev.map(f => f.id === id ? { ...f, deleted: true } : f));
  };

  const handleRestoreFile = (id: string) => {
    setVaultFiles(prev => prev.map(f => f.id === id ? { ...f, deleted: false } : f));
  };

  const handlePermanentDelete = (id: string) => {
    setVaultFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleUploadVaultMock = (e: React.FormEvent) => {
    e.preventDefault();
    const newFile = {
      id: 'v_' + Math.random().toString(36).substring(7),
      name: 'Uploaded_Report_' + Math.floor(Math.random() * 100) + '.pdf',
      size: Math.floor(Math.random() * 3000000) + 500000,
      category: 'Accounting',
      date: new Date().toISOString().split('T')[0],
      deleted: false,
      version: 1
    };
    setVaultFiles(prev => [newFile, ...prev]);
  };

  const handleReplaceVersionMock = (id: string) => {
    setVaultFiles(prev => prev.map(f => f.id === id ? { ...f, version: f.version + 1, date: new Date().toISOString().split('T')[0] } : f));
    alert('Document version replaced. Previous version archived in history.');
  };

  // React Hook Forms for Tasks
  const { register: registerTask, handleSubmit: handleSubmitTask, reset: resetTask, formState: { errors: taskErrors } } = useForm({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { title: '', description: '', priority: 'Medium' as const }
  });

  const { register: registerComment, handleSubmit: handleSubmitComment, reset: resetComment, formState: { errors: commentErrors } } = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: '' }
  });

  // Task details and dependency state
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [selectedDepTaskId, setSelectedDepTaskId] = useState('');
  const [depError, setDepError] = useState('');

  const handleSelectTask = async (task: any) => {
    setSelectedTask(task);
    setDepError('');
    try {
      const [commentsRes, depsRes] = await Promise.all([
        apiClient.get(`/tasks/${task.id}/comments`),
        apiClient.get(`/tasks/${task.id}/dependencies`)
      ]);
      setComments(commentsRes.data || []);
      setDependencies(depsRes.data || []);
    } catch (err) {
      console.error('Error fetching task details:', err);
    }
  };

  const handleAddCommentSubmit = async (data: { content: string }) => {
    if (!selectedTask) return;
    try {
      const res = await apiClient.post(`/tasks/${selectedTask.id}/comments`, { content: data.content });
      setComments([...comments, res.data]);
      resetComment();
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleAddDependency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !selectedDepTaskId) return;
    setDepError('');
    try {
      await apiClient.post(`/tasks/${selectedTask.id}/dependencies`, { dependsOnId: selectedDepTaskId });
      const depsRes = await apiClient.get(`/tasks/${selectedTask.id}/dependencies`);
      setDependencies(depsRes.data || []);
      setSelectedDepTaskId('');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to add dependency';
      setDepError(msg);
    }
  };

  const handleCreateTaskSubmit = async (data: { title: string; description?: string; priority: 'Low' | 'Medium' | 'High' | 'Urgent' }) => {
    await createTask(data.title, data.description || '', new Date().toISOString().split('T')[0], data.priority);
    resetTask();
  };

  // Calculated Dashboard metrics
  const activeClientsCount = tenants.filter(t => t.business_type !== 'Suspended Enterprise').length;
  const unpaidInvoicesCount = invoices.filter(i => i.status === 'unpaid').length;
  const outstandingInvoicesSum = invoices.filter(i => i.status === 'unpaid').reduce((acc, i) => acc + (i.amount_cents || 0), 0);
  const monthlyRevenueSum = invoices.filter(i => i.status === 'paid' || i.status === 'refunded').reduce((acc, i) => acc + (i.amount_cents || 0), 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      {/* Sidebar with 10 operational tabs */}
      <aside style={{ width: 'var(--sidebar-width)', background: 'var(--sidebar-bg)', color: 'var(--sidebar-text)', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--sidebar-border)', flexShrink: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--sidebar-border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ background: 'var(--accent-color)', color: '#fff', width: 35, height: 35, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>A</div>
          <div>
            <h2 style={{ fontSize: '1.05rem', color: 'var(--sidebar-text)', margin: 0 }}>Accountant Desk</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)' }}>{currentUser?.full_name || 'Senior Consultant'}</span>
          </div>
        </div>

        {currentUser?.role === 'senior_accountant' && (
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--sidebar-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-sec)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ShieldAlert size={14} style={{ color: 'var(--accent-color)' }} /> Impersonate Tenant
            </label>
            <select
              value={impersonatingId}
              onChange={(e) => handleImpersonate(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
            >
              <option value="">-- No Impersonation --</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        <nav style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto' }}>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', width: '100%', borderRadius: 6, color: activeSubTab === 'dashboard' ? 'var(--sidebar-active-text)' : 'var(--text-sec)', background: activeSubTab === 'dashboard' ? 'var(--sidebar-active-bg)' : 'transparent', textAlign: 'left', fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate('/accountant/dashboard')}
          >
            <LayoutDashboard size={16} /> Workspace Dashboard
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', width: '100%', borderRadius: 6, color: activeSubTab === 'clients' ? 'var(--sidebar-active-text)' : 'var(--text-sec)', background: activeSubTab === 'clients' ? 'var(--sidebar-active-bg)' : 'transparent', textAlign: 'left', fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate('/accountant/clients')}
          >
            <Users size={16} /> CRM Clients
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', width: '100%', borderRadius: 6, color: activeSubTab === 'ledger' ? 'var(--sidebar-active-text)' : 'var(--text-sec)', background: activeSubTab === 'ledger' ? 'var(--sidebar-active-bg)' : 'transparent', textAlign: 'left', fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate('/accountant/ledger')}
          >
            <BookOpen size={16} /> General Ledger
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', width: '100%', borderRadius: 6, color: activeSubTab === 'billing' ? 'var(--sidebar-active-text)' : 'var(--text-sec)', background: activeSubTab === 'billing' ? 'var(--sidebar-active-bg)' : 'transparent', textAlign: 'left', fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate('/accountant/billing')}
          >
            <CreditCard size={16} /> Billing & Pricing
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', width: '100%', borderRadius: 6, color: activeSubTab === 'payroll' ? 'var(--sidebar-active-text)' : 'var(--text-sec)', background: activeSubTab === 'payroll' ? 'var(--sidebar-active-bg)' : 'transparent', textAlign: 'left', fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate('/accountant/payroll')}
          >
            <DollarSign size={16} style={{ color: 'var(--accent-color)' }} /> HR & Payroll Desk
          </button>


          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', width: '100%', borderRadius: 6, color: activeSubTab === 'files' ? 'var(--sidebar-active-text)' : 'var(--text-sec)', background: activeSubTab === 'files' ? 'var(--sidebar-active-bg)' : 'transparent', textAlign: 'left', fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate('/accountant/files')}
          >
            <HardDrive size={16} /> Document Vault
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', width: '100%', borderRadius: 6, color: activeSubTab === 'tasks' ? 'var(--sidebar-active-text)' : 'var(--text-sec)', background: activeSubTab === 'tasks' ? 'var(--sidebar-active-bg)' : 'transparent', textAlign: 'left', fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate('/accountant/tasks')}
          >
            <Briefcase size={16} /> Task Portfolio
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', width: '100%', borderRadius: 6, color: activeSubTab === 'filings' ? 'var(--sidebar-active-text)' : 'var(--text-sec)', background: activeSubTab === 'filings' ? 'var(--sidebar-active-bg)' : 'transparent', textAlign: 'left', fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate('/accountant/filings')}
          >
            <CalendarClock size={16} /> Compliance Obligations
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', width: '100%', borderRadius: 6, color: activeSubTab === 'conversations' ? 'var(--sidebar-active-text)' : 'var(--text-sec)', background: activeSubTab === 'conversations' ? 'var(--sidebar-active-bg)' : 'transparent', textAlign: 'left', fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate('/accountant/conversations')}
          >
            <MessageSquare size={16} /> Communications
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', width: '100%', borderRadius: 6, color: activeSubTab === 'reporting' ? 'var(--sidebar-active-text)' : 'var(--text-sec)', background: activeSubTab === 'reporting' ? 'var(--sidebar-active-bg)' : 'transparent', textAlign: 'left', fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate('/accountant/reporting')}
          >
            <BarChart3 size={16} /> Reporting Desk
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.8rem', width: '100%', borderRadius: 6, color: activeSubTab === 'security' ? 'var(--sidebar-active-text)' : 'var(--text-sec)', background: activeSubTab === 'security' ? 'var(--sidebar-active-bg)' : 'transparent', textAlign: 'left', fontSize: '0.85rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate('/accountant/security')}
          >
            <Shield size={16} /> Security & Settings
          </button>
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--sidebar-border)' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#EF4444', fontSize: '0.9rem', background: 'none', border: 'none', cursor: 'pointer' }} onClick={onLogout}>
            <LogOut size={16} /> Exit Desk
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxHeight: '100vh' }}>
        
        {successMessage && <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#34d399', fontSize: '0.85rem', marginBottom: '1rem' }}>{successMessage}</div>}
        {errorMessage && <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{errorMessage}</div>}

        {/* 1. DASHBOARD TAB */}
        {activeSubTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Executive Summary</h1>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem' }}>Real-time indicators across client workspace metrics.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="premium-card" style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>ACTIVE MANAGED CLIENTS</span>
                <h2 style={{ fontSize: '2rem', margin: '0.25rem 0' }}>{activeClientsCount}</h2>
                <span style={{ fontSize: '0.7rem', color: 'green' }}>✓ Compliance status OK</span>
              </div>
              <div className="premium-card" style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>UNPAID RECEIVABLES</span>
                <h2 style={{ fontSize: '2rem', margin: '0.25rem 0' }}>${(outstandingInvoicesSum / 100).toFixed(2)}</h2>
                <span style={{ fontSize: '0.7rem', color: 'red' }}>● {unpaidInvoicesCount} invoices pending payment</span>
              </div>
              <div className="premium-card" style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>MONTHLY REVENUE</span>
                <h2 style={{ fontSize: '2rem', margin: '0.25rem 0' }}>${(monthlyRevenueSum / 100).toFixed(2)}</h2>
                <span style={{ fontSize: '0.7rem', color: '#B58A2B' }}>★ Stripe & Manual total</span>
              </div>
              <div className="premium-card" style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>TASKS DUE TODAY</span>
                <h2 style={{ fontSize: '2rem', margin: '0.25rem 0' }}>{tasks.filter(t => t.priority === 'Urgent').length}</h2>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-sec)' }}>Priority items requiring triage</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
              <div className="premium-card">
                <h3>Live Workspace Compliance Banners</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  {obligations.slice(0, 3).map(ob => (
                    <div key={ob.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid red' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{ob.title}</span>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>Due Date: {ob.due_date}</p>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'red', textTransform: 'uppercase', fontWeight: 'bold' }}>{ob.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="premium-card">
                <h3>System Logs Feed</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {auditLogs.slice(0, 5).map((log, index) => (
                    <div key={log.id || index} style={{ fontSize: '0.75rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.4rem' }}>
                      <span style={{ color: '#B58A2B' }}>[{log.category}]</span> {log.action}
                      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(log.created_at || Date.now()).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. CRM CLIENT MANAGEMENT TAB */}
        {activeSubTab === 'clients' && (
          <CrmManagement />
        )}

        {/* 3. GENERAL LEDGER TAB */}
        {activeSubTab === 'ledger' && (
          <LedgerManagement />
        )}

        {/* 4. BILLING & CUSTOM PRICING TAB */}
        {activeSubTab === 'billing' && (
          <BillingManagement />
        )}

        {/* 4b. HR & PAYROLL TAB */}
        {activeSubTab === 'payroll' && (
          <PayrollManagement />
        )}


        {/* 5. SECURE DOCUMENT VAULT TAB */}
        {activeSubTab === 'files' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Document Vault</h1>
                <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem' }}>Comprehensive file tracking, version control, and backup retrieval center.</p>
              </div>

              <form onSubmit={handleUploadVaultMock}>
                <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>
                  <FileUp size={16} /> Mock Upload File
                </button>
              </form>
            </div>

            {/* Folder / Files explorer grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
              <div>
                <h3>Active Files</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  {vaultFiles.filter(f => !f.deleted).map(file => (
                    <div key={file.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileText size={20} style={{ color: '#B58A2B' }} />
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{file.name}</div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {(file.size / 1024 / 1024).toFixed(2)} MB · Version: {file.version} · Uploaded: {file.date}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setSelectedFileForVersion(file)} style={{ padding: '0.3rem 0.6rem', background: '#cbd5e1', color: '#0f172a', border: 'none', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>History</button>
                        <button onClick={() => handleReplaceVersionMock(file.id)} style={{ padding: '0.3rem 0.6rem', background: 'rgba(181,138,43,0.1)', color: '#B58A2B', border: '1px solid #B58A2B', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>Replace</button>
                        <button onClick={() => handleSoftDeleteFile(file.id)} style={{ padding: '0.3rem 0.6rem', background: 'rgba(239,68,68,0.1)', color: 'red', border: 'none', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>

                <h3 style={{ marginTop: '2rem' }}>Deleted Recovery Center (30 Days Retention)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  {vaultFiles.filter(f => f.deleted).map(file => (
                    <div key={file.id} style={{ background: 'var(--surface-color)', border: '1px solid var(--card-border)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <AlertCircle size={20} style={{ color: 'red' }} />
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>{file.name}</div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Auto deletes soon</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleRestoreFile(file.id)} style={{ padding: '0.3rem 0.6rem', background: 'rgba(16,185,129,0.15)', color: 'green', border: 'none', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>Restore</button>
                        <button onClick={() => handlePermanentDelete(file.id)} style={{ padding: '0.3rem 0.6rem', background: 'rgba(239,68,68,0.15)', color: 'red', border: 'none', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>Purge</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Version details card */}
              <div>
                {selectedFileForVersion ? (
                  <div className="premium-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3>Version Control Info</h3>
                      <button onClick={() => setSelectedFileForVersion(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <strong>{selectedFileForVersion.name}</strong>
                      <div>Total iterations: {selectedFileForVersion.version}</div>
                      <div>Latest modification: {selectedFileForVersion.date}</div>
                      <hr style={{ border: 0, borderTop: '1px solid var(--card-border)' }} />
                      <span>History timeline:</span>
                      <ul style={{ paddingLeft: '1rem' }}>
                        <li>Version {selectedFileForVersion.version} - Approved</li>
                        {selectedFileForVersion.version > 1 && <li>Version 1 - Superseded</li>}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="premium-card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <HardDrive size={32} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Select file history log to view database version tracking.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 6. TASK PORTFOLIO TAB */}
        {activeSubTab === 'tasks' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Task Management Portfolio</h1>
                <p style={{ color: '#6B7280' }}>Track and manage active internal tasks for assigned clients.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedTask ? '1fr 380px' : '1fr 300px', gap: '2rem' }}>
              <div>
                <h3>Assigned Active Tasks ({tasks.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {tasks.map(t => (
                    <div 
                      key={t.id} 
                      onClick={() => handleSelectTask(t)}
                      style={{ 
                        padding: '1rem', 
                        background: selectedTask?.id === t.id ? '#F0F9FF' : 'var(--card-bg)', 
                        borderRadius: '8px', 
                        border: selectedTask?.id === t.id ? '2px solid #B58A2B' : '1px solid var(--card-border)', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      <div>
                        <h4 style={{ margin: 0 }}>{t.title}</h4>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t.description}</p>
                      </div>
                      <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: '#cbd5e1', color: '#0f172a' }}>{t.priority}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTask ? (
                <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
                  <button 
                    onClick={() => setSelectedTask(null)}
                    style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
                  >
                    <X size={18} />
                  </button>

                  <h3 style={{ margin: 0, paddingRight: '2rem' }}>Task Details</h3>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{selectedTask.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-sec)' }}>{selectedTask.description || 'No description provided.'}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', borderRadius: '4px', background: '#cbd5e1', color: '#000', fontWeight: 'bold' }}>{selectedTask.priority}</span>
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', borderRadius: '4px', background: 'var(--surface-color)' }}>Due: {selectedTask.due_date}</span>
                    </div>
                  </div>

                  <hr style={{ border: '0', borderTop: '1px solid var(--card-border)', margin: '0' }} />

                  {/* Task Dependencies */}
                  <div>
                    <h4 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Link size={16} /> Dependencies
                    </h4>
                    
                    {dependencies.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        {dependencies.map(d => {
                          const depTask = tasks.find(t => t.id === d.depends_on_task_id);
                          return (
                            <div key={d.id} style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem', background: 'var(--surface-color)', border: '1px solid var(--card-border)', borderRadius: '6px' }}>
                              🔗 {depTask ? depTask.title : 'Unknown Task'}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0' }}>No dependencies linked.</p>
                    )}

                    <form onSubmit={handleAddDependency} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <select 
                        value={selectedDepTaskId} 
                        onChange={e => setSelectedDepTaskId(e.target.value)}
                        style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--card-border)', fontSize: '0.85rem', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                      >
                        <option value="">Select task dependency...</option>
                        {tasks.filter(t => t.id !== selectedTask.id).map(t => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>
                      <button type="submit" style={{ padding: '0.4rem', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        Add Dependency
                      </button>
                      {depError && <p style={{ margin: 0, color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold' }}>{depError}</p>}
                    </form>
                  </div>

                  <hr style={{ border: '0', borderTop: '1px solid var(--card-border)', margin: '0' }} />

                  {/* Comments section */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MessageSquareText size={16} /> Comments ({comments.length})
                    </h4>
                    
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '180px', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem', paddingRight: '0.25rem' }}>
                      {comments.length > 0 ? (
                        comments.map(c => (
                          <div key={c.id} style={{ fontSize: '0.85rem', background: 'var(--surface-color)', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                            <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-sec)' }}>{c.content}</p>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleString()}</span>
                          </div>
                        ))
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>No comments yet.</p>
                      )}
                    </div>

                    <form onSubmit={handleSubmitComment(handleAddCommentSubmit)} style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="text" 
                          {...registerComment('content')}
                          placeholder="Add comment..."
                          style={{ flex: 1, padding: '0.4rem', borderRadius: '6px', border: commentErrors.content ? '1px solid #ef4444' : '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                        />
                        <button type="submit" style={{ padding: '0.4rem 0.8rem', background: '#B58A2B', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                          Post
                        </button>
                      </div>
                      {commentErrors.content && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{commentErrors.content.message}</span>}
                    </form>
                  </div>
                </div>
              ) : (
                <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)', height: 'fit-content' }}>
                  <h3>Assign New Task</h3>
                  <form onSubmit={handleSubmitTask(handleCreateTaskSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input 
                      type="text" 
                      {...registerTask('title')}
                      placeholder="Task Title"
                      style={{ padding: '0.5rem', borderRadius: '6px', border: taskErrors.title ? '1px solid #ef4444' : '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                    />
                    {taskErrors.title && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{taskErrors.title.message}</span>}
                    
                    <textarea 
                      {...registerTask('description')}
                      placeholder="Task Description"
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', minHeight: '80px' }}
                    />
                    
                    <select
                      {...registerTask('priority')}
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                      <option value="Urgent">Urgent Priority</option>
                    </select>

                    <button type="submit" style={{ padding: '0.5rem', background: '#B58A2B', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                      Create Task
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. COMPLIANCE OBLIGATIONS TAB */}
        {activeSubTab === 'filings' && (
          <ComplianceFilingDashboard isAccountant={true} />
        )}

        {/* 8. COMMUNICATIONS TAB — Google Chat Style */}
        {activeSubTab === 'conversations' && (
          <div style={{ height: 'calc(100vh - 120px)' }}>
            <InternalMessagingHub
              apiBase="http://localhost:5000"
              authToken={localStorage.getItem('supabase_token') || undefined}
              currentUserId={currentUser?.id || 'u1'}
              currentUserName={currentUser?.full_name || 'Accountant Specialist'}
            />
          </div>
        )}

        {/* 9. REPORTING DESK */}
        {activeSubTab === 'reporting' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Business Intelligence</h1>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem' }}>Comprehensive performance reporting graphs.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="premium-card">
                <h3>Revenue Distribution by Client</h3>
                <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', gap: '1.5rem', justifyContent: 'center', paddingTop: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ height: '120px', width: '35px', background: 'var(--primary-color)', borderRadius: '4px' }}></div>
                    <span style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Stark</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ height: '80px', width: '35px', background: '#B58A2B', borderRadius: '4px' }}></div>
                    <span style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Wayne</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ height: '40px', width: '35px', background: '#cbd5e1', borderRadius: '4px' }}></div>
                    <span style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Acme</span>
                  </div>
                </div>
              </div>

              <div className="premium-card">
                <h3>Accountant Productivity Indicator</h3>
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      <span>Compliance Filings Resolved</span>
                      <strong>88%</strong>
                    </div>
                    <div style={{ background: 'var(--surface-color)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: '88%', background: 'green', height: '100%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      <span>Audit Tasks Dispatched</span>
                      <strong>92%</strong>
                    </div>
                    <div style={{ background: 'var(--surface-color)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: '92%', background: '#B58A2B', height: '100%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 10. SECURITY & SETTINGS TAB */}
        {activeSubTab === 'security' && (
          <SecurityLayout />
        )}

      </main>
    </div>
  );
}
