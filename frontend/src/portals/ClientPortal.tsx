import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppContext } from '../context/AppContext.tsx';
import { apiClient } from '../api/client.ts';
import { 
  LayoutDashboard, FolderOpen, CalendarClock, CreditCard, 
  MessageSquare, LogOut, Upload, Search, Trash2, FolderPlus, 
  Send, AlertCircle, FileSpreadsheet, PlusCircle, Check, Sun, Moon, Users,
  BookOpen, Terminal, Briefcase, Sparkles
} from 'lucide-react';
import LedgerManagement from './LedgerManagement.tsx';
import ComplianceFilingDashboard from './ComplianceFilingDashboard.tsx';
import VaultProPanel from './VaultProPanel.tsx';
import DashboardAnalytics from './DashboardAnalytics.tsx';
import DeveloperSettings from './DeveloperSettings.tsx';
import MarketplaceHub from './MarketplaceHub.tsx';
import AICopilotPanel from './AICopilotPanel.tsx';
import ReportingDashboard from './ReportingDashboard.tsx';
import InternalMessagingHub from './InternalMessagingHub.tsx';
import CommandPalette from '../components/ui/CommandPalette.tsx';
import DataTable from '../components/ui/DataTable.tsx';

const ticketSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().min(1, 'Description details are required'),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['Low', 'Medium', 'High'])
});

const folderSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
});

const messageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty'),
});

const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required')
});

export default function ClientPortal({ onLogout }: { onLogout: () => void }) {
  const context = useContext(AppContext);
  if (!context) return null;

  const { 
    folders, files, obligations, messages, tickets, 
    createFolder, uploadFile, deleteFile, sendMessage, createTicket,
    themeMode, toggleTheme, invoices, subscription, currentUser, syncState
  } = context;

  const [activeSubTab, setActiveSubTab] = useState('dashboard');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const [tenants, setTenants] = useState<any[]>([]);
  const [activeTenantId, setActiveTenantId] = useState(currentUser?.tenant_id || '');

  const fetchTenants = async () => {
    try {
      const res = await apiClient.get('/tenants');
      setTenants(res.data || []);
    } catch (err) {
      console.error('Error fetching tenants list:', err);
    }
  };

  React.useEffect(() => {
    fetchTenants();
  }, []);

  const handleSwitchTenant = async (tenantId: string) => {
    try {
      await apiClient.put('/users/switch-tenant', { tenantId });
      setActiveTenantId(tenantId);
      await syncState();
    } catch (err) {
      console.error('Error switching tenant:', err);
    }
  };
  
  // React Hook Forms
  const { register: registerTicket, handleSubmit: handleSubmitTicket, reset: resetTicket, formState: { errors: ticketErrors } } = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: { subject: '', description: '', category: 'Taxation', priority: 'Medium' as const }
  });

  const { register: registerFolder, handleSubmit: handleSubmitFolder, reset: resetFolder, formState: { errors: folderErrors } } = useForm({
    resolver: zodResolver(folderSchema),
    defaultValues: { name: '' }
  });

  const { register: registerMessage, handleSubmit: handleSubmitMessage, reset: resetMessage, formState: { errors: messageErrors } } = useForm({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: '' }
  });

  const { register: registerInvite, handleSubmit: handleSubmitInvite, reset: resetInvite, formState: { errors: inviteErrors } } = useForm({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { email: '', role: 'client_staff' }
  });

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');

  const fetchTeamMembers = async () => {
    try {
      const res = await apiClient.get('/users');
      setTeamMembers(res.data || []);
    } catch (err) {
      console.error('Error fetching team members:', err);
    }
  };

  React.useEffect(() => {
    if (activeSubTab === 'team') {
      fetchTeamMembers();
    }
  }, [activeSubTab]);

  const handleSendInviteSubmit = async (data: { email: string; role: string }) => {
    setInviteSuccessMsg('');
    try {
      await apiClient.post('/auth/invite', { email: data.email, role: data.role });
      setInviteSuccessMsg(`Successfully sent invite to ${data.email}!`);
      resetInvite();
    } catch (err: any) {
      console.error('Error sending invitation:', err);
    }
  };

  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Taxation');
  const [uploadBase64, setUploadBase64] = useState('');
  const [uploadSize, setUploadSize] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadName(file.name);
      setUploadSize(file.size);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setUploadBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName || !uploadBase64) return;
    await uploadFile(uploadName, uploadSize, uploadCategory, 'application/octet-stream', uploadBase64, currentFolderId);
    setUploadName('');
    setUploadBase64('');
    setUploadSize(0);
  };

  const [plReport, setPlReport] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const fetchPLReport = async () => {
    setLoadingReport(true);
    try {
      const res = await apiClient.get('/reports/pl');
      setPlReport(res.data);
    } catch (err) {
      console.error('Error loading PL statement:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  React.useEffect(() => {
    if (activeSubTab === 'reports') {
      fetchPLReport();
    }
  }, [activeSubTab]);

  const handleDownloadCSV = () => {
    const token = localStorage.getItem('supabase_token');
    window.open(`http://localhost:5000/api/reports/pl/export?access_token=${token}`, '_blank');
  };

  const [plans, setPlans] = useState<any[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);

  const fetchPlans = async () => {
    try {
      const res = await apiClient.get('/billing/plans');
      setPlans(res.data || []);
    } catch (err) {
      console.error('Error fetching billing plans:', err);
    }
  };

  React.useEffect(() => {
    if (activeSubTab === 'billing') {
      fetchPlans();
    }
  }, [activeSubTab]);

  const handleSubscribePlan = async (planCode: string) => {
    setBillingLoading(true);
    try {
      const res = await apiClient.post('/billing/session', {
        priceId: planCode,
        successUrl: window.location.href,
        cancelUrl: window.location.href
      });
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        await syncState();
      }
    } catch (err) {
      console.error('Failed to initiate billing session:', err);
    } finally {
      setBillingLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-color)' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', background: '#0B192C', color: '#fff', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ background: '#008080', width: 35, height: 35, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>C</div>
            <div>
              <h2 style={{ fontSize: '1.05rem', color: '#fff', margin: 0 }}>Client Console</h2>
              <span style={{ fontSize: '0.75rem', color: '#00A896' }}>{currentUser?.full_name || 'Enterprise Client'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Company</label>
            <select
              value={activeTenantId}
              onChange={(e) => handleSwitchTenant(e.target.value)}
              style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <nav style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'dashboard' ? '#fff' : '#9CA3AF', background: activeSubTab === 'dashboard' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('dashboard')}
          >
            <LayoutDashboard size={18} /> Dashboard Overview
          </button>
          
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'documents' ? '#fff' : '#9CA3AF', background: activeSubTab === 'documents' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('documents')}
          >
            <FolderOpen size={18} /> Document Vault
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'compliance' ? '#fff' : '#9CA3AF', background: activeSubTab === 'compliance' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('compliance')}
          >
            <CalendarClock size={18} /> Compliance Tracker
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'reports' ? '#fff' : '#9CA3AF', background: activeSubTab === 'reports' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('reports')}
          >
            <FileSpreadsheet size={18} /> Financial Reports
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'ledger' ? '#fff' : '#9CA3AF', background: activeSubTab === 'ledger' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('ledger')}
          >
            <BookOpen size={18} /> General Ledger
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'communication' ? '#fff' : '#9CA3AF', background: activeSubTab === 'communication' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('communication')}
          >
            <MessageSquare size={18} /> Internal Messaging
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'billing' ? '#fff' : '#9CA3AF', background: activeSubTab === 'billing' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('billing')}
          >
            <CreditCard size={18} /> Invoices & Plan
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'team' ? '#fff' : '#9CA3AF', background: activeSubTab === 'team' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('team')}
          >
            <Users size={18} /> Team & Permissions
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'developer' ? '#fff' : '#9CA3AF', background: activeSubTab === 'developer' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('developer')}
          >
            <Terminal size={18} /> Developer Settings
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'marketplace' ? '#fff' : '#9CA3AF', background: activeSubTab === 'marketplace' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('marketplace')}
          >
            <Briefcase size={18} /> Professional Marketplace
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'ai_assistant' ? '#fff' : '#9CA3AF', background: activeSubTab === 'ai_assistant' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('ai_assistant')}
          >
            <Sparkles size={18} /> AI Co-pilot
          </button>
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#9CA3AF', fontSize: '0.9rem', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={toggleTheme}
          >
            {themeMode === 'light' ? <><Moon size={16} /> Dark Mode</> : <><Sun size={16} /> Light Mode</>}
          </button>
          
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#EF4444', fontSize: '0.9rem', background: 'none', border: 'none', cursor: 'pointer' }} onClick={onLogout}>
            <LogOut size={16} /> Exit Client Portal
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxHeight: '100vh' }}>
        {activeSubTab === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', margin: 0 }}>Welcome back</h1>
                <p style={{ color: 'var(--text-sec)' }}>Review live updates on your tax liability and regulatory deadlines.</p>
              </div>
            </div>

            <DashboardAnalytics />
          </div>
        )}

        {/* Documents */}
        {activeSubTab === 'documents' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.25rem', color: '#fff' }}>Secure Document Vault Pro</h2>
            <VaultProPanel 
              folders={folders}
              files={files}
              currentFolderId={currentFolderId}
              setCurrentFolderId={setCurrentFolderId}
              createFolder={createFolder}
              uploadFile={uploadFile}
              deleteFile={deleteFile}
            />
          </div>
        )}

        {/* Compliance */}
        {activeSubTab === 'compliance' && (
          <ComplianceFilingDashboard isAccountant={false} />
        )}

        {/* Communication */}
        {activeSubTab === 'communication' && (
          <div style={{ height: 'calc(100vh - 100px)' }}>
            <InternalMessagingHub
              apiBase="http://localhost:3001"
              authToken={localStorage.getItem('supabase_token') || undefined}
              currentUserId={currentUser?.id || ''}
              currentUserName={currentUser?.full_name || 'You'}
            />
          </div>
        )}

        {/* Reports — Real Reporting Dashboard */}
        {activeSubTab === 'reports' && (
          <ReportingDashboard
            apiBase="http://localhost:3001"
            authToken={localStorage.getItem('supabase_token') || undefined}
          />
        )}



        {activeSubTab === 'ledger' && (
          <LedgerManagement />
        )}

        {/* Billing */}
        {activeSubTab === 'billing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
            {/* Header banner */}
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard size={24} style={{ color: '#10b981' }} /> Billing & Workspace Tier
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                  Manage subscription plans, check workspace resource limits, and retrieve payment invoices.
                </p>
              </div>

              {subscription && (
                <div style={{ background: '#0f172a', padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>WORKSPACE TIER STATUS:</span>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    fontWeight: 'bold', 
                    padding: '0.25rem 0.65rem', 
                    borderRadius: '4px',
                    background: subscription.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                    color: subscription.status === 'active' ? '#34d399' : '#fbbf24'
                  }}>
                    {subscription.status.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Current subscription summary */}
            {subscription && subscription.billing_plans && (
              <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>ACTIVE SUBSCRIPTION TIER</label>
                  <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{subscription.billing_plans.name}</strong>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>PLAN RECURRING FEE</label>
                  <strong style={{ color: '#10b981', fontSize: '1.1rem' }}>${(subscription.billing_plans.price_cents / 100).toFixed(2)} / month</strong>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>CURRENT PERIOD END DATE</label>
                  <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}</strong>
                </div>
              </div>
            )}

            {/* Plan tiered options */}
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1rem' }}>Select Workspace Tier Option</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {plans.map((p) => {
                  const isCurrent = subscription && subscription.plan_id === p.id;
                  
                  // Parse features list
                  let featureList: string[] = [];
                  try {
                    const parsed = typeof p.features === 'string' ? JSON.parse(p.features) : p.features;
                    featureList = parsed?.list || [];
                  } catch (err) {
                    featureList = ['Tier Specific SLA Details'];
                  }

                  const isPro = p.code === 'pro';

                  return (
                    <div 
                      key={p.id} 
                      style={{ 
                        background: isPro ? '#1e293b' : '#0f172a',
                        borderRadius: '12px', 
                        padding: '1.75rem',
                        border: isCurrent ? '2px solid #10b981' : (isPro ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.05)'),
                        boxShadow: isPro ? '0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(16,185,129,0.1)' : 'none',
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        position: 'relative'
                      }}
                    >
                      {isPro && (
                        <span style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#10b981', color: '#fff', fontSize: '0.65rem', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
                          RECOMMENDED
                        </span>
                      )}

                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{p.name}</h4>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginTop: '0.75rem', marginBottom: '1.5rem' }}>
                          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>${(p.price_cents / 100).toFixed(0)}</span>
                          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>/mo</span>
                        </div>

                        <ul style={{ paddingLeft: '1.2rem', margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.6rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
                          {featureList.map((f, idx) => (
                            <li key={idx} style={{ position: 'relative' }}>
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => handleSubscribePlan(p.code)}
                        disabled={billingLoading || isCurrent}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: isCurrent ? 'rgba(16,185,129,0.1)' : (isPro ? '#10b981' : '#1e293b'),
                          color: isCurrent ? '#10b981' : '#fff',
                          border: isCurrent ? '1px solid #10b981' : 'none',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          cursor: billingLoading || isCurrent ? 'default' : 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {isCurrent ? 'Current Plan Standing' : (billingLoading ? 'Processing Checkout...' : 'Activate Plan Tier')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Invoices list */}
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.25rem' }}>Recent Payment Invoices</h3>
              
              {invoices.length === 0 ? (
                <div style={{ background: '#0f172a', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: '#94a3b8' }}>
                  No historical invoices found. Setup a plan tier to generate payment receipts.
                </div>
              ) : (
                <DataTable
                  columns={[
                    {
                      key: 'stripe_invoice_id',
                      label: 'Invoice ID',
                      sortable: true,
                      render: (row) => <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.stripe_invoice_id || row.id}</span>
                    },
                    {
                      key: 'due_date',
                      label: 'Issue Date',
                      sortable: true
                    },
                    {
                      key: 'amount_cents',
                      label: 'Amount Paid',
                      sortable: true,
                      render: (row) => <strong style={{ color: '#10b981' }}>${(row.amount_cents / 100).toFixed(2)}</strong>
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      sortable: true,
                      render: (row) => (
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                          {row.status.toUpperCase()}
                        </span>
                      )
                    },
                    {
                      key: 'actions',
                      label: 'Receipt Actions',
                      sortable: false,
                      render: (row) => (
                        <button
                          onClick={() => alert(`Opening PDF invoice receipt: ${row.stripe_invoice_id || row.id}`)}
                          style={{ padding: '0.35rem 0.75rem', background: '#1e293b', border: 'none', borderRadius: '6px', color: '#cbd5e1', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Download PDF
                        </button>
                      )
                    }
                  ]}
                  data={invoices}
                  searchPlaceholder="Filter invoice receipts..."
                  searchKey="due_date"
                  pageSize={5}
                />
              )}
            </div>
          </div>
        )}

        {/* Team & Permissions */}
        {activeSubTab === 'team' && (
          <div>
            <h2>Team & Permissions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', marginTop: '1.5rem' }}>
              <div>
                <h3>Active Workspace Members</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left', color: '#94a3b8', fontSize: '0.85rem' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid #334155', fontSize: '0.9rem' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>{m.full_name}</td>
                        <td>{m.email}</td>
                        <td>
                          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#334155' }}>
                            {m.role}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: m.status === 'active' ? '#10b981' : '#f59e0b', fontSize: '0.85rem' }}>
                            ● {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', height: 'fit-content' }}>
                <h3>Invite Member</h3>
                {inviteSuccessMsg && (
                  <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', padding: '0.5rem 0.75rem', color: '#34d399', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    {inviteSuccessMsg}
                  </div>
                )}
                <form onSubmit={handleSubmitInvite(handleSendInviteSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Email Address</label>
                    <input 
                      type="email" 
                      {...registerInvite('email')}
                      placeholder="colleague@company.com"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: inviteErrors.email ? '1px solid #ef4444' : '1px solid #334155', background: '#0f172a', color: '#fff', outline: 'none' }}
                    />
                    {inviteErrors.email && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{inviteErrors.email.message}</span>}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Role</label>
                    <select 
                      {...registerInvite('role')}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff', outline: 'none' }}
                    >
                      <option value="client_manager">Client Manager</option>
                      <option value="client_staff">Client Staff</option>
                    </select>
                  </div>

                  <button type="submit" style={{ padding: '0.5rem', background: '#00a896', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                    Send Invitation
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
        {activeSubTab === 'developer' && (
          <DeveloperSettings />
        )}
        {activeSubTab === 'marketplace' && (
          <MarketplaceHub />
        )}
        {activeSubTab === 'ai_assistant' && (
          <AICopilotPanel />
        )}
      </main>
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
        setActiveSubTab={setActiveSubTab} 
      />
    </div>
  );
}
