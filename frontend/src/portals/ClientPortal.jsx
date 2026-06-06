import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  LayoutDashboard, FolderOpen, CalendarClock, CreditCard, 
  MessageSquare, Users, LogOut, Upload, Search, Trash2, FolderPlus, 
  Send, AlertCircle, FileSpreadsheet, PlusCircle, Check
} from 'lucide-react';

export default function ClientPortal({ onLogout }) {
  const { 
    folders, files, obligations, messages, tickets, professionals, 
    createFolder, uploadFile, deleteFile, addMessage, addTicket, updateTicketStatus, bookings
  } = useContext(AppContext);

  const [activeSubTab, setActiveSubTab] = useState('dashboard');
  const [currentFolderId, setCurrentFolderId] = useState(null); // null means root
  const [searchQuery, setSearchQuery] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadForm, setUploadForm] = useState({ name: '', size: '1.2 MB', category: 'Taxation' });
  const [messageInput, setMessageInput] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('Taxation');
  const [newTicketPriority, setNewTicketPriority] = useState('Medium');

  // Hardcoded client id for the demo
  const clientId = 'c1';
  const assignedProfId = 'p1';
  const professional = professionals.find(p => p.id === assignedProfId);

  // File explorer filtering
  const currentFolders = folders.filter(f => f.clientId === clientId && f.parentId === currentFolderId);
  const currentFiles = files.filter(f => f.clientId === clientId && f.folderId === currentFolderId && 
    (searchQuery === '' || f.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const parentFolder = folders.find(f => f.id === currentFolderId);

  const handleUpload = (e) => {
    e.preventDefault();
    if (!uploadForm.name) return;
    uploadFile(uploadForm.name, uploadForm.size, currentFolderId, uploadForm.category, clientId);
    setUploadForm({ name: '', size: '1.5 MB', category: 'Taxation' });
  };

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (!newFolderName) return;
    createFolder(newFolderName, currentFolderId, clientId);
    setNewFolderName('');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    addMessage('t1', messageInput, clientId, 'Thomas Shelby');
    setMessageInput('');
  };

  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!newTicketSubject.trim()) return;
    addTicket(newTicketSubject, newTicketCategory, newTicketPriority);
    setNewTicketSubject('');
  };

  // Financial Data
  const monthlyRevenue = [320000, 290000, 340000, 390000, 410000, 430000];
  const monthlyExpenses = [180000, 195000, 210000, 225000, 230000, 240000];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F9FA' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', background: '#0B192C', color: '#fff', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ background: '#008080', width: 35, height: 35, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>C</div>
          <div>
            <h2 style={{ fontSize: '1.05rem', color: '#fff', margin: 0 }}>Client Console</h2>
            <span style={{ fontSize: '0.75rem', color: '#00A896' }}>Apex Logistics Ltd</span>
          </div>
        </div>

        <nav style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'dashboard' ? '#fff' : '#9CA3AF', background: activeSubTab === 'dashboard' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem' }}
            onClick={() => setActiveSubTab('dashboard')}
          >
            <LayoutDashboard size={18} /> Dashboard Overview
          </button>
          
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'documents' ? '#fff' : '#9CA3AF', background: activeSubTab === 'documents' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem' }}
            onClick={() => setActiveSubTab('documents')}
          >
            <FolderOpen size={18} /> Google Drive Vault
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'compliance' ? '#fff' : '#9CA3AF', background: activeSubTab === 'compliance' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem' }}
            onClick={() => setActiveSubTab('compliance')}
          >
            <CalendarClock size={18} /> Compliance Tracker
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'reports' ? '#fff' : '#9CA3AF', background: activeSubTab === 'reports' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem' }}
            onClick={() => setActiveSubTab('reports')}
          >
            <FileSpreadsheet size={18} /> Financial Reports
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'communication' ? '#fff' : '#9CA3AF', background: activeSubTab === 'communication' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem' }}
            onClick={() => setActiveSubTab('communication')}
          >
            <MessageSquare size={18} /> Communication Center
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'billing' ? '#fff' : '#9CA3AF', background: activeSubTab === 'billing' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem' }}
            onClick={() => setActiveSubTab('billing')}
          >
            <CreditCard size={18} /> Invoices & Plan
          </button>
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#EF4444', fontSize: '0.9rem' }} onClick={onLogout}>
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
                <h1 style={{ fontSize: '2rem', margin: 0 }}>Welcome back, Thomas</h1>
                <p style={{ color: '#6B7280' }}>Here is the compliance and financial status for Apex Logistics Ltd.</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <span className="badge badge-warning" style={{ padding: '0.5rem 1rem', borderRadius: 8 }}>
                  1 Overdue Filing
                </span>
                <span className="badge badge-success" style={{ padding: '0.5rem 1rem', borderRadius: 8 }}>
                  Compliance Score: 78%
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
              <div className="premium-card">
                <span style={{ color: '#6B7280', fontSize: '0.85rem', fontWeight: 600 }}>MONTHLY TAX REVENUE</span>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.25rem 0', color: '#0B192C' }}>$430,000</p>
                <span style={{ color: '#10B981', fontSize: '0.8rem', fontWeight: 600 }}>▲ 4.8% vs last month</span>
              </div>
              <div className="premium-card">
                <span style={{ color: '#6B7280', fontSize: '0.85rem', fontWeight: 600 }}>UPCOMING DEADLINE</span>
                <p style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '0.25rem 0', color: '#0B192C' }}>Q3 VAT Deadline</p>
                <span style={{ color: '#F59E0B', fontSize: '0.8rem', fontWeight: 600 }}>Due in 9 days</span>
              </div>
              <div className="premium-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <img src={professional.avatar} alt="Accountant" style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <span style={{ color: '#6B7280', fontSize: '0.85rem', display: 'block' }}>ASSIGNED ACCOUNTANT</span>
                  <p style={{ fontWeight: 'bold', margin: 0, fontSize: '0.95rem' }}>{professional.name}</p>
                  <button style={{ color: '#008080', fontSize: '0.8rem', fontWeight: 600 }} onClick={() => setActiveSubTab('communication')}>Send Message</button>
                </div>
              </div>
            </div>

            {/* Dash Content Split */}
            <div className="grid-cols-2">
              {/* Filings Table */}
              <div className="premium-card" style={{ minHeight: '300px' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Compliance Calendar
                  <button style={{ color: '#008080', fontSize: '0.8rem' }} onClick={() => setActiveSubTab('compliance')}>View Calendar</button>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {obligations.filter(o => o.clientId === clientId).map(ob => (
                    <div key={ob.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#F9FAFB', borderRadius: 8, borderLeft: ob.status === 'Late' ? '4px solid #EF4444' : '4px solid #10B981' }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>{ob.title}</p>
                        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Due: {ob.dueDate}</span>
                      </div>
                      <span className={`badge ${ob.status === 'Late' ? 'badge-danger' : ob.status === 'Needs Review' ? 'badge-warning' : 'badge-success'}`}>
                        {ob.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consultation Summary */}
              <div className="premium-card" style={{ minHeight: '300px' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Booked Consultations</h3>
                {bookings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6B7280' }}>
                    <AlertCircle size={32} style={{ margin: '0 auto 0.5rem auto' }} />
                    <p style={{ fontSize: '0.9rem' }}>No active bookings scheduled.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {bookings.map(bk => (
                      <div key={bk.id} style={{ padding: '0.75rem', background: 'rgba(0,128,128,0.05)', border: '1px solid rgba(0,128,128,0.15)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{bk.service}</span>
                          <span className="badge badge-success">{bk.status}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: 0 }}>Date: {bk.date} | Time: {bk.time}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeSubTab === 'documents' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', margin: 0 }}>Google Drive Document Vault</h1>
                <p style={{ color: '#6B7280' }}>Upload spreadsheets, receipts, and returns securely to your 5TB drive architecture.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
              {/* Explorer */}
              <div className="premium-card">
                {/* Search / Path */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: 10, top: 12, color: '#6B7280' }} />
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ paddingLeft: '2.2rem' }} 
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {/* Folder creator */}
                  <form onSubmit={handleCreateFolder} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ width: '160px' }} 
                      placeholder="Folder Name"
                      value={newFolderName}
                      onChange={e => setNewFolderName(e.target.value)}
                    />
                    <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}><FolderPlus size={18} /> New Folder</button>
                  </form>
                </div>

                {/* Directory Path Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#6B7280' }}>
                  <span style={{ cursor: 'pointer', color: '#008080', fontWeight: 'bold' }} onClick={() => setCurrentFolderId(null)}>Root</span>
                  {parentFolder && (
                    <>
                      <span>/</span>
                      <span style={{ fontWeight: 'bold' }}>{parentFolder.name}</span>
                    </>
                  )}
                </div>

                {/* Directory Content List */}
                <div style={{ minHeight: '300px' }}>
                  {currentFolders.length === 0 && currentFiles.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0', color: '#6B7280' }}>
                      <FolderOpen size={40} style={{ margin: '0 auto 1rem auto' }} />
                      <p>This directory is empty. Add a folder or upload a document to get started.</p>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.08)', color: '#6B7280' }}>
                          <th style={{ padding: '0.75rem' }}>Name</th>
                          <th>Category</th>
                          <th>Size</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentFolders.map(folder => (
                          <tr key={folder.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                            <td style={{ padding: '0.75rem', fontWeight: 600, color: '#008080', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setCurrentFolderId(folder.id)}>
                              📁 {folder.name}
                            </td>
                            <td>Folder</td>
                            <td>—</td>
                            <td>—</td>
                            <td>—</td>
                          </tr>
                        ))}
                        {currentFiles.map(file => (
                          <tr key={file.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                            <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              📄 {file.name}
                            </td>
                            <td>{file.category}</td>
                            <td>{file.size}</td>
                            <td>
                              <span className={`badge ${file.status === 'Approved' ? 'badge-success' : 'badge-warning'}`}>
                                {file.status}
                              </span>
                            </td>
                            <td>
                              <button style={{ color: '#EF4444' }} onClick={() => deleteFile(file.id)}><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Upload side widget */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="premium-card">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Upload size={18} /> Upload Document</h3>
                  <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>File Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. Q3_Balance_Sheet.xlsx"
                        value={uploadForm.name}
                        onChange={e => setUploadForm({...uploadForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Category</label>
                      <select 
                        className="form-input"
                        value={uploadForm.category}
                        onChange={e => setUploadForm({...uploadForm, category: e.target.value})}
                      >
                        <option>Taxation</option>
                        <option>GST Receipts</option>
                        <option>Banking Statements</option>
                        <option>Payroll Records</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-teal w-full" style={{ padding: '0.5rem' }}>Upload to Drive</button>
                  </form>
                </div>

                <div className="premium-card" style={{ background: '#0B192C', color: '#fff' }}>
                  <h3 style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.5rem' }}>Storage Allocated</h3>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>8.3 MB <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#9CA3AF' }}>of 5 TB (Google Workspace)</span></p>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: '1%', height: '100%', background: '#00A896' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Tracker Tab */}
        {activeSubTab === 'compliance' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2rem', margin: 0 }}>Compliance Tracker</h1>
              <p style={{ color: '#6B7280' }}>Track regulatory obligations, deadlines, and filings status.</p>
            </div>

            <div className="premium-card">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.08)', color: '#6B7280' }}>
                    <th style={{ padding: '1rem' }}>Obligation Title</th>
                    <th>Category</th>
                    <th>Due Date</th>
                    <th>Assigned Accountant</th>
                    <th>Filing Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {obligations.filter(o => o.clientId === clientId).map(ob => (
                    <tr key={ob.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <td style={{ padding: '1rem' }}>
                        <p style={{ fontWeight: 'bold', margin: 0 }}>{ob.title}</p>
                        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{ob.notes}</span>
                      </td>
                      <td>{ob.type}</td>
                      <td>{ob.dueDate}</td>
                      <td>{professionals.find(p => p.id === ob.assignedTo)?.name}</td>
                      <td>
                        <span className={`badge ${ob.status === 'Late' ? 'badge-danger' : ob.status === 'Needs Review' ? 'badge-warning' : 'badge-success'}`}>
                          {ob.status}
                        </span>
                      </td>
                      <td>
                        {ob.status !== 'Filed' ? (
                          <button className="btn btn-text" onClick={() => setActiveSubTab('documents')}>Upload Form docs</button>
                        ) : (
                          <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Check size={16} /> Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Financial Reports Tab */}
        {activeSubTab === 'reports' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2rem', margin: 0 }}>Financial & Operational Reports</h1>
              <p style={{ color: '#6B7280' }}>Review interactive Profit & Loss records and charts compiled by the audit desk.</p>
            </div>

            {/* Custom Responsive SVG Chart */}
            <div className="premium-card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Revenue vs Operating Expenses (Last 6 Months)</h3>
              <div style={{ position: 'relative', height: 260 }}>
                {/* SVG Graph rendering */}
                <svg viewBox="0 0 600 240" width="100%" height="100%" style={{ overflow: 'visible' }}>
                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="580" y2="20" stroke="rgba(0,0,0,0.05)" />
                  <line x1="40" y1="80" x2="580" y2="80" stroke="rgba(0,0,0,0.05)" />
                  <line x1="40" y1="140" x2="580" y2="140" stroke="rgba(0,0,0,0.05)" />
                  <line x1="40" y1="200" x2="580" y2="200" stroke="rgba(0,0,0,0.1)" />
                  
                  {/* Axis values */}
                  <text x="5" y="25" fill="#9CA3AF" fontSize="10">$500k</text>
                  <text x="5" y="85" fill="#9CA3AF" fontSize="10">$300k</text>
                  <text x="5" y="145" fill="#9CA3AF" fontSize="10">$100k</text>
                  
                  {/* Bars representing data */}
                  {monthlyRevenue.map((rev, index) => {
                    const x = 50 + index * 90;
                    const revHeight = (rev / 500000) * 180;
                    const expHeight = (monthlyExpenses[index] / 500000) * 180;
                    return (
                      <g key={index}>
                        {/* Revenue Bar */}
                        <rect x={x} y={200 - revHeight} width="22" height={revHeight} fill="#0B192C" rx="3" />
                        {/* Expense Bar */}
                        <rect x={x + 26} y={200 - expHeight} width="22" height={expHeight} fill="#00A896" rx="3" />
                        
                        <text x={x + 10} y="220" fill="#6B7280" fontSize="10" textAnchor="middle">
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index]}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: 12, height: 12, background: '#0B192C', borderRadius: 2 }}></span> Gross Revenue
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: 12, height: 12, background: '#00A896', borderRadius: 2 }}></span> Operating Expenses
                </span>
              </div>
            </div>

            {/* P&L Statement Table */}
            <div className="premium-card">
              <h3 style={{ marginBottom: '1rem' }}>Statement of Profit & Loss (Q2 Forecast)</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', fontWeight: 'bold' }}>
                    <td style={{ padding: '0.75rem 0' }}>Operating Revenue</td>
                    <td style={{ textAlign: 'right' }}>$1,230,000</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <td style={{ padding: '0.75rem 0', paddingLeft: '1rem', color: '#6B7280' }}>Shipping / Operations Sales</td>
                    <td style={{ textAlign: 'right', color: '#6B7280' }}>$980,000</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <td style={{ padding: '0.75rem 0', paddingLeft: '1rem', color: '#6B7280' }}>Logistics Warehousing</td>
                    <td style={{ textAlign: 'right', color: '#6B7280' }}>$250,000</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', fontWeight: 'bold' }}>
                    <td style={{ padding: '0.75rem 0' }}>Cost of Services (COS)</td>
                    <td style={{ textAlign: 'right', color: '#EF4444' }}>($695,000)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', fontWeight: 'bold', background: '#F9FAFB' }}>
                    <td style={{ padding: '0.75rem 0' }}>Gross Margin</td>
                    <td style={{ textAlign: 'right', color: '#10B981' }}>$535,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Communication Tab */}
        {activeSubTab === 'communication' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
            {/* Chat Box */}
            <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', height: '520px' }}>
              <h3 style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                Direct Thread with {professional.name}
              </h3>
              
              {/* Message List */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem', marginBottom: '1rem' }}>
                {messages.filter(m => m.threadId === 't1').map(msg => {
                  const isClient = msg.senderId === clientId;
                  return (
                    <div key={msg.id} style={{ alignSelf: isClient ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                      <div style={{ background: isClient ? '#0B192C' : '#E5E7EB', color: isClient ? '#fff' : '#0B192C', padding: '0.75rem 1rem', borderRadius: 12, borderTopRightRadius: isClient ? 0 : 12, borderTopLeftRadius: isClient ? 12 : 0, fontSize: '0.9rem' }}>
                        {msg.content}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block', textAlign: isClient ? 'right' : 'left', marginTop: '0.25rem' }}>
                        {msg.senderName} • {msg.timestamp}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                />
                <button type="submit" className="btn btn-teal"><Send size={18} /></button>
              </form>
            </div>

            {/* Support Tickets Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="premium-card">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Submit Support Ticket</h3>
                <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Issue Subject</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Audit ledger question"
                      value={newTicketSubject}
                      onChange={e => setNewTicketSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Category</label>
                    <select 
                      className="form-input"
                      value={newTicketCategory}
                      onChange={e => setNewTicketCategory(e.target.value)}
                    >
                      <option>Taxation</option>
                      <option>Payroll</option>
                      <option>System technical issue</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Priority</label>
                    <select 
                      className="form-input"
                      value={newTicketPriority}
                      onChange={e => setNewTicketPriority(e.target.value)}
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-secondary w-full" style={{ padding: '0.5rem' }}><PlusCircle size={16} /> Submit Ticket</button>
                </form>
              </div>

              {/* Tickets list */}
              <div className="premium-card" style={{ flex: 1, overflowY: 'auto' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Your Support Tickets</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {tickets.map(tkt => (
                    <div key={tkt.id} style={{ padding: '0.65rem', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 6, fontSize: '0.85rem' }}>
                      <p style={{ fontWeight: 'bold', margin: 0 }}>{tkt.subject}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', color: '#6B7280' }}>
                        <span>Cat: {tkt.category}</span>
                        <span className={`badge ${tkt.status === 'Open' ? 'badge-warning' : 'badge-success'}`}>{tkt.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeSubTab === 'billing' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2rem', margin: 0 }}>Billing & Subscription</h1>
              <p style={{ color: '#6B7280' }}>Manage service plans, invoices history, and payment cycles.</p>
            </div>

            <div className="premium-card" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge badge-success" style={{ marginBottom: '0.5rem' }}>ACTIVE SUBSCRIPTION</span>
                <h2>Professional Scale Plan</h2>
                <p style={{ color: '#6B7280' }}>Renews automatically on Oct 1, 2026. Configured with 500 Transactions allocation.</p>
              </div>
              <div>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0B192C' }}>$499<span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#6B7280' }}>/mo</span></p>
                <button className="btn btn-teal" onClick={() => alert('Upgrading options: Contact arthur.p@eacsolutions.com.')}>Upgrade Subscription</button>
              </div>
            </div>

            <div className="premium-card">
              <h3 style={{ marginBottom: '1rem' }}>Recent Invoices</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.08)', color: '#6B7280' }}>
                    <th style={{ padding: '0.75rem' }}>Invoice Number</th>
                    <th>Billing Period</th>
                    <th>Amount Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>#EAC-2026-0091</td>
                    <td>May 1, 2026 - May 31, 2026</td>
                    <td>$499.00</td>
                    <td><span className="badge badge-success">Paid</span></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>#EAC-2026-0082</td>
                    <td>Apr 1, 2026 - Apr 30, 2026</td>
                    <td>$499.00</td>
                    <td><span className="badge badge-success">Paid</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
