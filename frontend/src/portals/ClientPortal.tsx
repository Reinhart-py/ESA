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
  BookOpen, Terminal, Briefcase, Sparkles, Shield, X
} from 'lucide-react';
import ComplianceFilingDashboard from './ComplianceFilingDashboard.tsx';
import VaultProPanel from './VaultProPanel.tsx';
import DashboardAnalytics from './DashboardAnalytics.tsx';
import ReportingDashboard from './ReportingDashboard.tsx';
import InternalMessagingHub from './InternalMessagingHub.tsx';
import ProfileSettings from './ProfileSettings.tsx';

import CommandPalette from '../components/ui/CommandPalette.tsx';
import DataTable from '../components/ui/DataTable.tsx';

const folderSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
});

export default function ClientPortal({ onLogout }: { onLogout: () => void }) {
  const context = useContext(AppContext);
  if (!context) return null;

  const { 
    folders, files, obligations, messages, 
    createFolder, uploadFile, deleteFile, sendMessage,
    themeMode, toggleTheme, invoices, subscription, currentUser, syncState
  } = context;

  const [activeSubTab, setActiveSubTab] = useState('dashboard');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
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

  const [billingLoading, setBillingLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);

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
      {/* Sidebar with customer action items only */}
      <aside style={{ width: '260px', background: '#0B192C', color: '#fff', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ background: '#B58A2B', width: 35, height: 35, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>C</div>
            <div>
              <h2 style={{ fontSize: '1.05rem', color: '#fff', margin: 0 }}>Client Console</h2>
              <span style={{ fontSize: '0.75rem', color: '#B58A2B' }}>{currentUser?.full_name || 'Business Client'}</span>
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
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'communication' ? '#fff' : '#9CA3AF', background: activeSubTab === 'communication' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('communication')}
          >
            <MessageSquare size={18} /> Chat with Accountant
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'billing' ? '#fff' : '#9CA3AF', background: activeSubTab === 'billing' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('billing')}
          >
            <CreditCard size={18} /> Invoices & Plan
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'security' ? '#fff' : '#9CA3AF', background: activeSubTab === 'security' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('security')}
          >
            <Shield size={18} /> Security & Profile
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
                <h1 style={{ fontSize: '2.2rem', margin: 0, fontWeight: 800 }}>Welcome back</h1>
                <p style={{ color: 'var(--text-sec)' }}>Review live updates on your tax liability and regulatory deadlines.</p>
              </div>
            </div>

            <DashboardAnalytics />
          </div>
        )}

        {/* Documents */}
        {activeSubTab === 'documents' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Secure Document Vault</h2>
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

        {/* Communication — Google Chat Styled with Zoom support */}
        {activeSubTab === 'communication' && (
          <div style={{ height: 'calc(100vh - 120px)' }}>
            <InternalMessagingHub
              apiBase="http://localhost:5000"
              authToken={localStorage.getItem('supabase_token') || undefined}
              currentUserId={currentUser?.id || 'client'}
              currentUserName={currentUser?.full_name || 'Client Representative'}
            />
          </div>
        )}

        {/* Reports */}
        {activeSubTab === 'reports' && (
          <ReportingDashboard
            apiBase="http://localhost:5000"
            authToken={localStorage.getItem('supabase_token') || undefined}
          />
        )}

        {/* Billing */}
        {activeSubTab === 'billing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
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

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>Available Subscription Options</h3>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Regional taxes (GST/VAT) calculated at checkout</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {plans.map(p => {
                  const isCurrent = !!(subscription && subscription.plan_id === p.id);
                  const isPro = p.code === 'pro';
                  const featureList = JSON.parse(p.features || '{"list":[]}').list as string[];

                  return (
                    <div
                      key={p.id}
                      style={{
                        background: '#1e293b',
                        padding: '2rem',
                        borderRadius: '12px',
                        border: isCurrent ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.05)',
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

            <div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Recent Payment Invoices</h3>
              
              {invoices.length === 0 ? (
                <div style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--card-border)', textAlign: 'center', color: 'var(--text-muted)' }}>
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
                      render: (row) => <strong style={{ color: 'green' }}>${(row.amount_cents / 100).toFixed(2)}</strong>
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      sortable: true,
                      render: (row) => (
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', color: 'green' }}>
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
                          style={{ padding: '0.35rem 0.75rem', background: 'var(--primary-color)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}
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

        {/* Profile */}
        {activeSubTab === 'security' && (
          <ProfileSettings />
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
