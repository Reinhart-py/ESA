import React, { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext.tsx';
import { apiClient } from '../api/client.ts';
import { 
  LayoutDashboard, Users, Building, CalendarClock, FolderOpen, Shield, BookOpen, 
  FileSpreadsheet, CreditCard, MessageSquare, Settings, LogOut, Sun, Moon, 
  Search, Bell, Sparkles, Plus, Trash2, FolderPlus, Send, AlertCircle, 
  Check, X, FileText, ChevronRight, HelpCircle, Activity, Play, ChevronDown,
  Info, TrendingUp, AlertTriangle, CheckCircle, ShieldAlert, FileDown
} from 'lucide-react';

// Sub-portals/components imported
import ComplianceFilingDashboard from './ComplianceFilingDashboard.tsx';
import VaultProPanel from './VaultProPanel.tsx';
import DashboardAnalytics from './DashboardAnalytics.tsx';
import ReportingDashboard from './ReportingDashboard.tsx';
import InternalMessagingHub from './InternalMessagingHub.tsx';
import ProfileSettings from './ProfileSettings.tsx';
import LedgerManagement from './LedgerManagement.tsx';
import CommandPalette from '../components/ui/CommandPalette.tsx';
import DataTable from '../components/ui/DataTable.tsx';
import SupportManagement from './SupportManagement.tsx';

export default function UnifiedPortal({ onLogout }: { onLogout: () => void }) {
  const context = useContext(AppContext);
  if (!context) return null;

  const { 
    userRole, setUserRole, themeMode, toggleTheme, syncState,
    folders, files, obligations, tasks, messages, tickets, auditLogs,
    subscription, invoices, createFolder, uploadFile, deleteFile, sendMessage,
    createTask, createTicket, updateObligationStatus, currentUser, webConfig
  } = context;

  // Sidebar navigation and UI states
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Entities & CRM
  const [tenants, setTenants] = useState<any[]>([]);
  const [activeTenantId, setActiveTenantId] = useState(currentUser?.tenant_id || '');
  const [impersonatingId, setImpersonatingId] = useState<string>(() => localStorage.getItem('impersonate_tenant_id') || '');
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  // Lists & data loaded for accountants / admins
  const [globalInvoices, setGlobalInvoices] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [crmLoading, setCrmLoading] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);

  // Form Inputs
  const [newClientName, setNewClientName] = useState('');
  const [newClientType, setNewClientType] = useState('LLC');
  const [newClientRevenue, setNewClientRevenue] = useState('0-100k');
  
  // Custom Invoice Inputs
  const [invoiceTenantId, setInvoiceTenantId] = useState('');
  const [invoiceAmountCents, setInvoiceAmountCents] = useState(25000);
  const [invoiceDueDate, setInvoiceDueDate] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
  const [invoiceDescription, setInvoiceDescription] = useState('');

  // Search local/global state
  const [searchQuery, setSearchQuery] = useState('');

  // Keyboard shortcut listener for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync / Load data
  const fetchTenants = async () => {
    try {
      const res = await apiClient.get('/tenants');
      setTenants(res.data || []);
    } catch (err) {
      console.error('Error fetching tenants list:', err);
    }
  };

  const fetchGlobalData = async () => {
    if (userRole !== 'client_owner' && userRole !== 'guest') {
      setCrmLoading(true);
      try {
        const [tenantsRes, invoicesRes, plansRes] = await Promise.all([
          apiClient.get('/tenants').catch(() => ({ data: [] })),
          apiClient.get('/billing/invoices').catch(() => ({ data: [] })),
          apiClient.get('/billing/plans').catch(() => ({ data: [] }))
        ]);
        setTenants(tenantsRes.data || []);
        setGlobalInvoices(invoicesRes.data || []);
        setPlans(plansRes.data || []);
      } catch (err) {
        console.error('Error fetching dashboard listings:', err);
      } finally {
        setCrmLoading(false);
      }
    } else {
      fetchTenants();
      // Load customer invoices
      try {
        const plansRes = await apiClient.get('/billing/plans');
        setPlans(plansRes.data || []);
      } catch (e) {}
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, [userRole, activeTab]);

  // Tenant / Client Switcher logic
  const handleSwitchTenant = async (tenantId: string) => {
    try {
      await apiClient.put('/users/switch-tenant', { tenantId });
      setActiveTenantId(tenantId);
      await syncState();
    } catch (err) {
      console.error('Error switching tenant:', err);
    }
  };

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

  // Client Onboarding Submit
  const handleOnboardClientSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newClientName.trim()) return;
    try {
      await apiClient.post('/tenants', {
        name: newClientName,
        businessType: newClientType,
        revenueBracket: newClientRevenue
      });
      alert(`Client profile generated: ${newClientName}.`);
      setNewClientName('');
      setShowOnboardingWizard(false);
      setOnboardingStep(1);
      fetchGlobalData();
    } catch (err) {
      console.error('Failed to create client:', err);
    }
  };

  // Invoice Dispatcher
  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceTenantId) return;
    try {
      await apiClient.post('/billing/invoices', {
        tenantId: invoiceTenantId,
        amountCents: invoiceAmountCents,
        dueDate: invoiceDueDate,
        description: invoiceDescription
      });
      alert('Manual invoice generated successfully.');
      setInvoiceDescription('');
      fetchGlobalData();
    } catch (err) {
      console.error('Failed to generate invoice:', err);
    }
  };

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

  // Calculated client metrics
  const displayInvoices = (userRole === 'client_owner') ? invoices : globalInvoices;
  const activeClientsCount = tenants.filter(t => t.business_type !== 'Suspended Enterprise').length;
  const unpaidInvoices = displayInvoices.filter(i => i.status === 'unpaid');
  const outstandingInvoicesSum = unpaidInvoices.reduce((acc, i) => acc + (i.amount_cents || 0), 0);
  const monthlyRevenueSum = displayInvoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + (i.amount_cents || 0), 0);

  // Simulated compliance score
  const complianceScore = 94; // Premium Client Health score average
  const totalOpenTasks = tasks.filter(t => t.priority === 'Urgent' || t.priority === 'High').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>
      
      {/* 1. PROFESSIONAL ENTERPRISE SIDEBAR */}
      <aside style={{
        width: isSidebarOpen ? 'var(--sidebar-width)' : '80px',
        background: 'var(--sidebar-bg)',
        color: 'var(--sidebar-text)',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--sidebar-border)',
        flexShrink: 0,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 50
      }}>
        {/* Sidebar Header / Logo */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--sidebar-border)', display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
          <div style={{
            background: 'linear-gradient(135deg, #B58A2B 0%, #E2B857 100%)',
            minWidth: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(181, 138, 43, 0.3)'
          }}>
            <Sparkles size={18} style={{ color: '#0A1D37' }} />
          </div>
          {isSidebarOpen && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0, fontWeight: 800, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>{webConfig?.WEBSITE_TITLE || 'EAC Console'}</h2>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-sec)', fontWeight: 500 }}>
                {userRole === 'super_admin' ? 'Super Administrator' : (userRole === 'accountant' ? 'Senior Accountant' : 'Client Workspace')}
              </span>
            </div>
          )}
        </div>

        {/* Workspace Active Picker */}
        {isSidebarOpen && userRole === 'client_owner' && (
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--sidebar-border)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.65rem', color: 'var(--accent-color)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Company</label>
            <select
              value={activeTenantId}
              onChange={(e) => handleSwitchTenant(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation Item List */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
            { id: 'clients', label: 'Clients', icon: <Users size={18} /> },
            { id: 'compliance', label: 'Compliance', icon: <CalendarClock size={18} /> },
            { id: 'documents', label: 'Documents', icon: <FolderOpen size={18} /> },
            { id: 'audits', label: 'Audits', icon: <Shield size={18} /> },
            { id: 'accounting', label: 'Accounting', icon: <BookOpen size={18} /> },
            { id: 'reports', label: 'Reports', icon: <FileSpreadsheet size={18} /> },
            { id: 'billing', label: 'Billing', icon: <CreditCard size={18} /> },
            { id: 'messages', label: 'Messages', icon: <MessageSquare size={18} /> },
            { id: 'support', label: 'Support Desk', icon: <HelpCircle size={18} /> },
            { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
          ].map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.75rem 1rem',
                  width: '100%',
                  borderRadius: '10px',
                  color: isActive ? 'var(--sidebar-active-text)' : 'var(--text-sec)',
                  background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--accent-color)' : '3px solid transparent',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 500,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  justifyContent: isSidebarOpen ? 'flex-start' : 'center'
                }}
                title={item.label}
              >
                <span style={{ color: isActive ? 'var(--accent-color)' : 'inherit' }}>{item.icon}</span>
                {isSidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Actions */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--sidebar-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-sec)', fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', justifyContent: isSidebarOpen ? 'flex-start' : 'center' }}
            onClick={toggleTheme}
          >
            {themeMode === 'light' ? <><Moon size={16} /> {isSidebarOpen && 'Dark Mode'}</> : <><Sun size={16} /> {isSidebarOpen && 'Light Mode'}</>}
          </button>
          
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#EF4444', fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', justifyContent: isSidebarOpen ? 'flex-start' : 'center' }} 
            onClick={onLogout}
          >
            <LogOut size={16} /> {isSidebarOpen && 'Exit Platform'}
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTENT CONTAINER */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        
        {/* A. PREMIUM TOP NAVIGATION BAR */}
        <header style={{
          height: '70px',
          background: 'var(--card-bg)',
          borderBottom: '1px solid var(--card-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          flexShrink: 0
        }}>
          {/* Left search bar placeholder */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, maxWidth: '480px' }}>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{ background: 'none', border: 'none', color: 'var(--text-sec)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <ChevronRight size={20} style={{ transform: isSidebarOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </button>
            
            <div 
              onClick={() => setIsCommandPaletteOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.55rem 1rem',
                borderRadius: '9999px',
                background: 'var(--surface-color)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Search size={16} />
              <span>Search workspace... (Ctrl + K)</span>
            </div>
          </div>

          {/* Right Header Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            
            {/* Quick Actions trigger */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowQuickActions(!showQuickActions)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.85rem',
                  background: 'linear-gradient(135deg, #B58A2B 0%, #9E741D 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(181,138,43,0.2)'
                }}
              >
                <Plus size={16} /> Quick Actions
              </button>
              {showQuickActions && (
                <div style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  width: '220px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-card)',
                  padding: '0.5rem',
                  zIndex: 100
                }}>
                  <button onClick={() => { setActiveTab('documents'); setShowQuickActions(false); }} style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '6px' }}>
                    <FolderOpen size={15} /> Upload Document
                  </button>
                  <button onClick={() => { setShowOnboardingWizard(true); setOnboardingStep(1); setShowQuickActions(false); }} style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '6px' }}>
                    <Users size={15} /> Onboard New Client
                  </button>
                  <button onClick={() => { setActiveTab('messages'); setShowQuickActions(false); }} style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '6px' }}>
                    <MessageSquare size={15} /> Dispatch Chat Message
                  </button>
                </div>
              )}
            </div>

            {/* Notification Center */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-sec)',
                  cursor: 'pointer',
                  position: 'relative',
                  padding: '4px'
                }}
              >
                <Bell size={20} />
                <span style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '8px',
                  height: '8px',
                  background: '#EF4444',
                  borderRadius: '50%'
                }} />
              </button>

              {showNotificationCenter && (
                <div style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  width: '320px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '16px',
                  boxShadow: 'var(--shadow-card)',
                  padding: '1rem',
                  zIndex: 100
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Centralized Notifications</h4>
                    <button style={{ background: 'none', border: 'none', fontSize: '0.7rem', color: '#B58A2B', cursor: 'pointer' }}>Mark all read</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
                    <div style={{ fontSize: '0.8rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--card-border)' }}>
                      <strong style={{ color: '#EF4444', display: 'block' }}>Filing Deadline Approaching</strong>
                      <span style={{ color: 'var(--text-sec)' }}>Form 1120 corporate return filing is due in 3 days.</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--card-border)' }}>
                      <strong style={{ color: '#10B981', display: 'block' }}>Document Approved</strong>
                      <span style={{ color: 'var(--text-sec)' }}>Sarah approved Wayne Q1 Financial Draft file.</span>
                    </div>
                    <div style={{ fontSize: '0.8rem' }}>
                      <strong style={{ color: '#3B82F6', display: 'block' }}>Billing Statement Issued</strong>
                      <span style={{ color: 'var(--text-sec)' }}>Stripe has processed subscription charge.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem', borderLeft: '1px solid var(--card-border)' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1E3E62', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                {currentUser?.full_name?.charAt(0) || 'U'}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{currentUser?.full_name || 'EAC Specialist'}</span>
            </div>

          </div>
        </header>

        {/* B. MAIN SCROLLABLE MODULE VIEWPORT AREA */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', background: 'var(--surface-color)' }}>
          
          {/* I. EXECUTIVE DASHBOARD MODULE */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Executive Command Center</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Continuous regulatory compliance, tax planning telemetry, and ledger auditing status.</p>
              </div>

              {/* Animated KPI cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                
                <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue (YTD)</span>
                    <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontWeight: 'bold' }}>+12.4%</span>
                  </div>
                  <h2 style={{ fontSize: '2.2rem', margin: '0.5rem 0', fontWeight: 800 }}>${(monthlyRevenueSum / 100).toFixed(2)}</h2>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <TrendingUp size={14} style={{ color: '#10B981' }} />
                    <span>Calculated manual & Stripe billing</span>
                  </div>
                </div>

                <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compliance Health Score</span>
                    <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontWeight: 'bold' }}>Optimal</span>
                  </div>
                  <h2 style={{ fontSize: '2.2rem', margin: '0.5rem 0', fontWeight: 800 }}>{complianceScore}%</h2>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <CheckCircle size={14} style={{ color: '#10B981' }} />
                    <span>Critical obligations filled</span>
                  </div>
                </div>

                <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Urgent Tasks</span>
                    <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontWeight: 'bold' }}>Action Required</span>
                  </div>
                  <h2 style={{ fontSize: '2.2rem', margin: '0.5rem 0', fontWeight: 800 }}>{totalOpenTasks}</h2>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <AlertTriangle size={14} style={{ color: '#EF4444' }} />
                    <span>Requiring immediate specialist triage</span>
                  </div>
                </div>

                <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outstanding Invoices</span>
                    <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', fontWeight: 'bold' }}>Receivables</span>
                  </div>
                  <h2 style={{ fontSize: '2.2rem', margin: '0.5rem 0', fontWeight: 800 }}>${(outstandingInvoicesSum / 100).toFixed(2)}</h2>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <CreditCard size={14} style={{ color: '#F59E0B' }} />
                    <span>Invoices pending payment validation</span>
                  </div>
                </div>

              </div>

              {/* Graphical Overview, Risk Heatmap Grid, & Activity Timeline */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                
                {/* Financial overview visualization */}
                <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem' }}>Revenue Overview Trend</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monthly cash flow generation telemetry chart.</span>
                    </div>
                    <button style={{ padding: '0.4rem 0.8rem', border: '1px solid var(--card-border)', borderRadius: '6px', background: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FileDown size={14} /> Export Report
                    </button>
                  </div>
                  
                  {/* Custom SVG line graph chart representation */}
                  <div style={{ height: '220px', position: 'relative', marginTop: '1rem', background: 'var(--surface-color)', borderRadius: '8px', padding: '1rem', border: '1px dashed var(--card-border)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    {[34, 45, 23, 56, 78, 65, 90, 84, 98, 120].map((val, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '8%', height: '100%', justifyContent: 'flex-end' }}>
                        <div style={{
                          height: `${(val / 120) * 80}%`,
                          width: '100%',
                          background: 'linear-gradient(180deg, var(--accent-color) 0%, rgba(181,138,43,0.2) 100%)',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.6s ease'
                        }} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>M{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk Heatmap indicator */}
                <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3>Company Risk Matrix</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Visual analysis of compliance and financial reporting exposures.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
                    <div style={{ background: '#EF4444', height: '60px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold' }}>HIGH (2)</div>
                    <div style={{ background: '#F59E0B', height: '60px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold' }}>MED (3)</div>
                    <div style={{ background: '#10B981', height: '60px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold' }}>LOW (8)</div>
                    
                    <div style={{ background: '#EF444415', border: '1px dashed #EF4444', height: '60px', borderRadius: '6px', gridColumn: 'span 3', display: 'flex', alignItems: 'center', padding: '0 0.5rem', gap: '0.5rem', color: 'var(--text-primary)' }}>
                      <AlertCircle size={16} style={{ color: '#EF4444' }} />
                      <span style={{ fontSize: '0.7rem' }}>Corporate returns lacking filing documents</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Recent Activity center table */}
              <div className="premium-card">
                <h3>Global Telemetry Activity Logs</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  {auditLogs.slice(0, 5).map((log, index) => (
                    <div key={log.id || index} style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <Activity size={16} style={{ color: '#B58A2B' }} />
                        <div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{log.action}</span>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Triggered by {log.user_identity || 'System scheduler'}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.created_at || Date.now()).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* II. CLIENTS MODULE */}
          {activeTab === 'clients' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Client & KYC Management</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Maintain tenant organizational boundaries, switch workspaces, and assign audit specialist specialists.</p>
                </div>
                {userRole !== 'client_owner' && (
                  <button 
                    onClick={() => { setShowOnboardingWizard(true); setOnboardingStep(1); }}
                    style={{ padding: '0.5rem 1rem', background: '#B58A2B', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <Plus size={16} /> Register Client Workspace
                  </button>
                )}
              </div>

              {/* Accountant Impersonation drop-down */}
              {(userRole === 'super_admin' || userRole === 'admin' || userRole === 'senior_accountant') && (
                <div className="premium-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <ShieldAlert size={24} style={{ color: 'var(--accent-color)' }} />
                    <div>
                      <h4 style={{ margin: 0 }}>Administrative Impersonation</h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Switch into a client's workspace to perform filings or audit updates on their behalf.</p>
                    </div>
                  </div>
                  <select
                    value={impersonatingId}
                    onChange={(e) => handleImpersonate(e.target.value)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', width: '260px' }}
                  >
                    <option value="">-- No Active Impersonation --</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* CRM clients grid list */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
                <div className="premium-card">
                  <DataTable
                    columns={[
                      {
                        key: 'name',
                        label: 'Client Company',
                        sortable: true,
                        render: (row) => (
                          <div style={{ cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setSelectedClient(row)}>
                            <Building size={16} style={{ color: 'var(--accent-color)' }} /> {row.name}
                          </div>
                        )
                      },
                      {
                        key: 'business_type',
                        label: 'Filing Status',
                        sortable: true,
                        render: (row) => {
                          const isSuspended = row.business_type === 'Suspended Enterprise';
                          return (
                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: isSuspended ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: isSuspended ? 'red' : 'green' }}>
                              {isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                            </span>
                          );
                        }
                      },
                      {
                        key: 'actions',
                        label: 'Console switch',
                        sortable: false,
                        render: (row) => (
                          <button onClick={() => handleImpersonate(row.id)} style={{ padding: '0.35rem 0.65rem', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                            View Files
                          </button>
                        )
                      }
                    ]}
                    data={tenants}
                    searchPlaceholder="Filter client roster..."
                    searchKey="name"
                    pageSize={6}
                  />
                </div>

                {/* Selected CRM Profile detail */}
                <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3>Client Details & Score</h3>
                  {selectedClient ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                      <div><strong>Company Name:</strong> {selectedClient.name}</div>
                      <div><strong>Status:</strong> {selectedClient.business_type || 'Active Corporation'}</div>
                      <div><strong>Health Score:</strong> <strong style={{ color: 'green' }}>95/100</strong></div>
                      <hr style={{ border: 0, borderTop: '1px solid var(--card-border)' }} />
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <strong>Direct Notes:</strong>
                        <p style={{ marginTop: '0.25rem', padding: '0.5rem', background: 'var(--surface-color)', borderRadius: '4px' }}>
                          Verified credentials. All state filing obligation structures generated.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Select a company record to visualize health scores and compliance filing details.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* III. COMPLIANCE COMMAND CENTER */}
          {activeTab === 'compliance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Regulatory Compliance Command Center</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Filing deadlines, state tax calendars, and chronological history tracking.</p>
              </div>

              {/* Interactive Filing Timeline */}
              <div className="premium-card" style={{ padding: '1.5rem' }}>
                <h3>Obligations Chronological Timeline</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem', position: 'relative', paddingLeft: '1.5rem' }}>
                  <div style={{ position: 'absolute', left: '7px', top: 0, bottom: 0, width: '2px', background: 'var(--card-border)' }} />
                  {obligations.map((ob, idx) => (
                    <div key={ob.id || idx} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-22px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: ob.status === 'Filed' ? '#10B981' : '#F59E0B', border: '2px solid var(--card-bg)' }} />
                      <div style={{ flex: 1, background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>{ob.title}</strong>
                          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: ob.status === 'Filed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: ob.status === 'Filed' ? 'green' : 'orange' }}>
                            {ob.status.toUpperCase()}
                          </span>
                        </div>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-sec)' }}>Filing deadline: {ob.due_date} · State Category: Regulatory</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Filing Dashboard Panel */}
              <ComplianceFilingDashboard isAccountant={userRole !== 'client_owner'} />
            </div>
          )}

          {/* IV. SECURE DOCUMENT VAULT MODULE */}
          {activeTab === 'documents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Secure Document Vault Pro</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>OCR-enabled filing, drag-and-drop secure upload zone, and file approval controls.</p>
              </div>

              <VaultProPanel 
                folders={folders}
                files={files}
                currentFolderId={null}
                setCurrentFolderId={() => {}}
                createFolder={createFolder}
                uploadFile={uploadFile}
                deleteFile={deleteFile}
              />
            </div>
          )}

          {/* V. AUDITS & FILE GOVERNANCE MODULE */}
          {activeTab === 'audits' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Immutability System Audit Logs</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Comprehensive database records validation telemetry for accounting reviews.</p>
              </div>

              <div className="premium-card">
                <DataTable
                  columns={[
                    {
                      key: 'created_at',
                      label: 'Timestamp',
                      sortable: true,
                      render: (row) => <span>{new Date(row.created_at).toLocaleString()}</span>
                    },
                    {
                      key: 'category',
                      label: 'Category',
                      sortable: true,
                      render: (row) => <strong style={{ color: '#B58A2B' }}>{row.category}</strong>
                    },
                    {
                      key: 'action',
                      label: 'Action Operation Detail',
                      sortable: false
                    },
                    {
                      key: 'user_identity',
                      label: 'User Trigger ID',
                      sortable: true
                    }
                  ]}
                  data={auditLogs}
                  pageSize={10}
                />
              </div>
            </div>
          )}

          {/* VI. ACCOUNTING & LEDGER MODULE */}
          {activeTab === 'accounting' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>General Ledger & Double-Entry Desk</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Reconcile journal entries, run transactions validations, and check audit status indicators.</p>
              </div>

              <LedgerManagement />
            </div>
          )}

          {/* VII. ADVANCED REPORTS & EXPORTS MODULE */}
          {activeTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Advanced Custom Reporting Engine</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Build report configurations, export balance sheets to CSV/PDF, and schedule reporting pipelines.</p>
              </div>

              {/* Custom Report Builder form mock UI */}
              <div className="premium-card">
                <h3>Custom Financial Report Builder</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Report Category</label>
                    <select style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}>
                      <option>Balance Sheet Statement</option>
                      <option>Profit & Loss Summary</option>
                      <option>Regulatory Tax Filing Status</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Date Period Range</label>
                    <select style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}>
                      <option>Q1 2026</option>
                      <option>YTD (Year-to-date)</option>
                      <option>Previous Fiscal Year</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Output Alignment Format</label>
                    <select style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}>
                      <option>Adobe PDF (Formatted)</option>
                      <option>Excel Worksheet CSV</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button onClick={() => alert('Compiling records and scheduling report generation... Check your secure vault in a few moments.')} style={{ width: '100%', padding: '0.5rem', background: '#B58A2B', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Compile & Generate
                    </button>
                  </div>
                </div>
              </div>

              <ReportingDashboard
                apiBase="http://localhost:5000"
                authToken={localStorage.getItem('supabase_token') || undefined}
              />
            </div>
          )}

          {/* VIII. BILLING, PLANS & MANUAL INVOICES */}
          {activeTab === 'billing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Billing, Invoices & Workspace Plan Tiers</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Adjust plans tiers, look up payment invoices, and generate manual services invoices.</p>
              </div>

              {/* Accountant Dispatch invoice section */}
              {userRole !== 'client_owner' && (
                <div className="premium-card">
                  <h3>Dispatch Manual Service Invoice</h3>
                  <form onSubmit={handleCreateInvoiceSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
                    <select
                      value={invoiceTenantId}
                      onChange={e => setInvoiceTenantId(e.target.value)}
                      required
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                    >
                      <option value="">-- Choose Client --</option>
                      {tenants.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>

                    <input 
                      type="number" 
                      placeholder="Amount cents"
                      value={invoiceAmountCents}
                      onChange={e => setInvoiceAmountCents(Number(e.target.value))}
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                    />

                    <input 
                      type="date" 
                      value={invoiceDueDate}
                      onChange={e => setInvoiceDueDate(e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                    />

                    <button type="submit" style={{ padding: '0.5rem', background: '#B58A2B', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Dispatch Bill Statement
                    </button>
                  </form>
                </div>
              )}

              {/* Plan Tiers Grid */}
              <div>
                <h3 style={{ marginBottom: '1rem' }}>Plan Tiers</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {plans.map(p => {
                    const isCurrent = !!(subscription && subscription.plan_id === p.id);
                    const features = JSON.parse(p.features || '{"list":[]}').list as string[];
                    return (
                      <div key={p.id} style={{ background: 'var(--card-bg)', border: isCurrent ? '2px solid #10B981' : '1px solid var(--card-border)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <h4>{p.name}</h4>
                          <h2 style={{ margin: '0.5rem 0' }}>${(p.price_cents / 100).toFixed(0)}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/mo</span></h2>
                          <ul style={{ paddingLeft: '1rem', fontSize: '0.8rem', color: 'var(--text-sec)', margin: '1rem 0' }}>
                            {features.map((f: string, i: number) => <li key={i}>{f}</li>)}
                          </ul>
                        </div>
                        {userRole === 'client_owner' && (
                          <button
                            onClick={() => handleSubscribePlan(p.code)}
                            disabled={isCurrent || billingLoading}
                            style={{ width: '100%', padding: '0.5rem', background: isCurrent ? 'none' : '#B58A2B', border: isCurrent ? '1px solid #10B981' : 'none', color: isCurrent ? '#10B981' : '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            {isCurrent ? 'Current Standing' : 'Subscribe'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Historical Statement details */}
              <div className="premium-card">
                <h3>Historical Statements Receipts</h3>
                <DataTable
                  columns={[
                    {
                      key: 'id',
                      label: 'Statement ID',
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
                      label: 'Statement Amount',
                      sortable: true,
                      render: (row) => <strong>${(row.amount_cents / 100).toFixed(2)}</strong>
                    },
                    {
                      key: 'status',
                      label: 'Payment status',
                      sortable: true,
                      render: (row) => (
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: row.status === 'paid' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: row.status === 'paid' ? 'green' : 'red' }}>
                          {row.status.toUpperCase()}
                        </span>
                      )
                    }
                  ]}
                  data={displayInvoices}
                  pageSize={5}
                />
              </div>

            </div>
          )}

          {/* IX. COMMUNICATIONS MODULE */}
          {activeTab === 'messages' && (
            <div style={{ height: 'calc(100vh - 120px)' }}>
              <InternalMessagingHub
                apiBase="http://localhost:5000"
                authToken={localStorage.getItem('supabase_token') || undefined}
                currentUserId={currentUser?.id || 'client'}
                currentUserName={currentUser?.full_name || 'Client Representative'}
              />
            </div>
          )}

          {/* IX-B. SUPPORT DESK MODULE */}
          {activeTab === 'support' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Helpdesk & Support Ticketing Desk</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Open requests, track resolving milestones status, and check SLA compliance goals.</p>
              </div>

              <SupportManagement />
            </div>
          )}

          {/* X. SETTINGS & PROFILE MODULE */}
          {activeTab === 'settings' && (
            <ProfileSettings />
          )}

        </main>
      </div>

      {/* 3. CORE PLATFORM GLOBAL MODAL COMPONENTS */}

      {/* A. COMMAND PALETTE SEARCH ENGINE */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
        setActiveSubTab={setActiveTab} 
      />

      {/* B. ONBOARDING CLIENT WIZARD MODAL */}
      {showOnboardingWizard && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '2rem', width: '450px', position: 'relative' }}>
            <button onClick={() => setShowOnboardingWizard(false)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            
            <h3 style={{ margin: '0 0 1rem 0' }}>Client Workspace Onboarding Wizard</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1, height: '4px', background: onboardingStep >= 1 ? '#B58A2B' : 'var(--card-border)', borderRadius: '2px' }} />
              <div style={{ flex: 1, height: '4px', background: onboardingStep >= 2 ? '#B58A2B' : 'var(--card-border)', borderRadius: '2px' }} />
            </div>

            {onboardingStep === 1 ? (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-sec)', marginBottom: '1rem' }}>Enter the legal name of the business entity to generate filing obligations boundaries.</p>
                <input 
                  type="text" 
                  placeholder="Legal Business Name (e.g. Stark Industries)"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', marginBottom: '1rem' }}
                />
                <button 
                  onClick={() => setOnboardingStep(2)}
                  disabled={!newClientName.trim()}
                  style={{ width: '100%', padding: '0.6rem', background: '#B58A2B', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Next: Entity Details
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Entity Formation Type</label>
                    <select
                      value={newClientType}
                      onChange={e => setNewClientType(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                    >
                      <option value="LLC">Limited Liability Company (LLC)</option>
                      <option value="Corporation">Corporation (S-Corp/C-Corp)</option>
                      <option value="Partnership">General Partnership</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Annual Revenue Bracket</label>
                    <select
                      value={newClientRevenue}
                      onChange={e => setNewClientRevenue(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                    >
                      <option value="0-100k">$0 - $100,000</option>
                      <option value="100k-500k">$100,000 - $500,000</option>
                      <option value="500k-2m">$500,000 - $2,000,000</option>
                      <option value="2m+">$2,000,000+ Enterprise Tier</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setOnboardingStep(1)} style={{ flex: 1, padding: '0.6rem', background: 'none', border: '1px solid var(--card-border)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer' }}>Back</button>
                  <button onClick={() => handleOnboardClientSubmit()} style={{ flex: 2, padding: '0.6rem', background: '#B58A2B', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Complete Setup</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
