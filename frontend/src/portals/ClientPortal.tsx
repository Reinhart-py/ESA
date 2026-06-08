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
  BookOpen
} from 'lucide-react';
import LedgerManagement from './LedgerManagement.tsx';
import ComplianceFilingDashboard from './ComplianceFilingDashboard.tsx';
import VaultProPanel from './VaultProPanel.tsx';

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
    themeMode, toggleTheme, invoices, subscription, currentUser
  } = context;

  const [activeSubTab, setActiveSubTab] = useState('dashboard');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-color)' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', background: '#0B192C', color: '#fff', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ background: '#008080', width: 35, height: 35, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>C</div>
          <div>
            <h2 style={{ fontSize: '1.05rem', color: '#fff', margin: 0 }}>Client Console</h2>
            <span style={{ fontSize: '0.75rem', color: '#00A896' }}>{currentUser?.full_name || 'Enterprise Client'}</span>
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
            <MessageSquare size={18} /> Communication Center
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px' }}>
                <h3>Active Obligations</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{obligations.length}</p>
              </div>
              <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px' }}>
                <h3>Support Tickets</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{tickets.length}</p>
              </div>
            </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', height: '400px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {messages.map(m => (
                  <div key={m.id} style={{ marginBottom: '1rem' }}>
                    <strong>{m.sender_id === currentUser?.id ? 'You' : 'Accountant'}:</strong>
                    <p style={{ margin: '0.25rem 0 0 0' }}>{m.content}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSubmitMessage(async (data) => {
                await sendMessage(data.content, 't1');
                resetMessage();
              })} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    {...registerMessage('content')}
                    placeholder="Type message..." 
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: messageErrors.content ? '1px solid #ef4444' : 'none' }}
                  />
                  <button type="submit" style={{ padding: '0.5rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px' }}>
                    <Send size={16} />
                  </button>
                </div>
                {messageErrors.content && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{messageErrors.content.message}</span>}
              </form>
            </div>

            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px' }}>
              <h3>Submit Support Ticket</h3>
              <form onSubmit={handleSubmitTicket(async (data) => {
                await createTicket(data.subject, data.description, data.category, data.priority);
                resetTicket();
              })} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input 
                  type="text" 
                  {...registerTicket('subject')}
                  placeholder="Subject"
                  style={{ padding: '0.5rem', borderRadius: '6px', border: ticketErrors.subject ? '1px solid #ef4444' : 'none' }}
                />
                {ticketErrors.subject && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{ticketErrors.subject.message}</span>}
                
                <textarea 
                  {...registerTicket('description')}
                  placeholder="Describe your request..."
                  style={{ padding: '0.5rem', borderRadius: '6px', minHeight: '80px', border: ticketErrors.description ? '1px solid #ef4444' : 'none' }}
                />
                {ticketErrors.description && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{ticketErrors.description.message}</span>}
                
                <select 
                  {...registerTicket('category')}
                  style={{ padding: '0.5rem', borderRadius: '6px', color: '#1e293b', background: '#fff' }}
                >
                  <option value="Taxation">Taxation</option>
                  <option value="Audit">Audit</option>
                  <option value="Billing">Billing</option>
                  <option value="Technical">Technical</option>
                </select>

                <select 
                  {...registerTicket('priority')}
                  style={{ padding: '0.5rem', borderRadius: '6px', color: '#1e293b', background: '#fff' }}
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>

                <button type="submit" style={{ padding: '0.5rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  Submit Ticket
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Reports */}
        {activeSubTab === 'reports' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Financial Reports</h2>
              <button 
                onClick={handleDownloadCSV} 
                style={{ padding: '0.5rem 1rem', background: '#00a896', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Export CSV Statement
              </button>
            </div>

            {loadingReport ? (
              <p>Compiling report data...</p>
            ) : plReport ? (
              <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px' }}>
                <h3>Profit & Loss Forecast</h3>
                <p>Generated At: {new Date(plReport.generatedAt).toLocaleString()}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div>Gross Revenue:</div>
                  <strong>${plReport.revenue.toLocaleString()}</strong>
                  <div>Operating Expenses:</div>
                  <strong>${plReport.expenses.toLocaleString()}</strong>
                  <div>Gross Margin:</div>
                  <strong>${plReport.grossMargin.toLocaleString()}</strong>
                  <div>Net income Estimate:</div>
                  <strong>${plReport.netIncome.toLocaleString()}</strong>
                </div>
              </div>
            ) : (
              <p>No report compiled yet.</p>
            )}
          </div>
        )}

        {activeSubTab === 'ledger' && (
          <LedgerManagement />
        )}

        {/* Billing */}
        {activeSubTab === 'billing' && (
          <div>
            <h2>Billing & Subscription</h2>
            <div style={{ padding: '1.5rem', background: '#1e293b', borderRadius: '8px', marginBottom: '2rem' }}>
              <h3>Current Plan</h3>
              <p>{subscription ? `Status: ${subscription.status}` : 'No active subscription plan'}</p>
            </div>

            <h3>Recent Invoices</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '0.5rem' }}>{inv.due_date}</td>
                    <td>${(inv.amount_cents / 100).toFixed(2)}</td>
                    <td>{inv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      </main>
    </div>
  );
}
