import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext.tsx';
import { apiClient } from '../api/client.ts';
import { 
  LayoutDashboard, FolderOpen, CalendarClock, CreditCard, 
  MessageSquare, LogOut, Upload, Search, Trash2, FolderPlus, 
  Send, AlertCircle, FileSpreadsheet, PlusCircle, Check, Sun, Moon
} from 'lucide-react';

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
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Taxation');
  const [uploadBase64, setUploadBase64] = useState('');
  const [uploadSize, setUploadSize] = useState(0);
  const [messageInput, setMessageInput] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('Taxation');
  const [newTicketPriority, setNewTicketPriority] = useState('Medium');

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

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName) return;
    await createFolder(newFolderName, currentFolderId);
    setNewFolderName('');
  };

  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    // Assume default thread 't1' or create one on fly
    await sendMessage(messageInput, 't1');
    setMessageInput('');
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim()) return;
    await createTicket(newTicketSubject, newTicketDesc, newTicketCategory, newTicketPriority);
    setNewTicketSubject('');
    setNewTicketDesc('');
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
            <h2>Document Explorer</h2>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <form onSubmit={handleCreateFolder} style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="New folder name"
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ccc' }}
                />
                <button type="submit" style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px' }}>
                  <FolderPlus size={16} /> Create
                </button>
              </form>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>Name</th>
                  <th>Size</th>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {folders.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.5rem', cursor: 'pointer', color: '#3b82f6' }} onClick={() => setCurrentFolderId(f.id)}>
                      📁 {f.name}
                    </td>
                    <td>-</td>
                    <td>Folder</td>
                    <td>-</td>
                  </tr>
                ))}
                {files.map(file => (
                  <tr key={file.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.5rem' }}>📄 {file.name}</td>
                    <td>{(file.size_bytes / 1024 / 1024).toFixed(2)} MB</td>
                    <td>{file.category}</td>
                    <td>
                      <button style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => deleteFile(file.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#1e293b', borderRadius: '8px' }}>
              <h3>Upload File</h3>
              <input type="file" onChange={handleFileChange} />
              <button onClick={handleUploadSubmit} style={{ marginTop: '1rem', display: 'block', padding: '0.5rem 1rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px' }}>
                Upload to storage
              </button>
            </div>
          </div>
        )}

        {/* Compliance */}
        {activeSubTab === 'compliance' && (
          <div>
            <h2>Compliance Obligations</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {obligations.map(ob => (
                <div key={ob.id} style={{ padding: '1rem', background: '#1e293b', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4>{ob.title}</h4>
                    <p>Due: {ob.due_date} | Category: {ob.type}</p>
                  </div>
                  <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', background: ob.status === 'Late' ? '#ef4444' : '#10b981' }}>
                    {ob.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
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
              <form onSubmit={handleSendMessageSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <input 
                  type="text" 
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  placeholder="Type message..." 
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '6px' }}
                />
                <button type="submit" style={{ padding: '0.5rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px' }}>
                  <Send size={16} />
                </button>
              </form>
            </div>

            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px' }}>
              <h3>Submit Support Ticket</h3>
              <form onSubmit={handleCreateTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input 
                  type="text" 
                  value={newTicketSubject}
                  onChange={e => setNewTicketSubject(e.target.value)}
                  placeholder="Subject"
                  style={{ padding: '0.5rem', borderRadius: '6px' }}
                />
                <textarea 
                  value={newTicketDesc}
                  onChange={e => setNewTicketDesc(e.target.value)}
                  placeholder="Describe your request..."
                  style={{ padding: '0.5rem', borderRadius: '6px', minHeight: '80px' }}
                />
                <button type="submit" style={{ padding: '0.5rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px' }}>
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
                  <tr key={inv.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.5rem' }}>{inv.due_date}</td>
                    <td>${(inv.amount_cents / 100).toFixed(2)}</td>
                    <td>{inv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
