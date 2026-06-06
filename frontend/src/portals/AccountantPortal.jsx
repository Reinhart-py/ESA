import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Users, CalendarClock, MessageSquare, ClipboardList, LogOut, Check, X, Send, 
  Search, ShieldAlert, CheckCircle, TrendingUp
} from 'lucide-react';

export default function AccountantPortal({ onLogout }) {
  const { 
    clients, obligations, messages, updateObligationStatus, addMessage, professionals
  } = useContext(AppContext);

  const [activeSubTab, setActiveSubTab] = useState('portfolio');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [activeChatClientId, setActiveChatClientId] = useState('c1');

  // Lead Accountant credentials for demo
  const accountantId = 'p1';
  const myClients = clients.filter(c => c.assignedProfessional === accountantId);
  const myObligations = obligations.filter(o => o.assignedTo === accountantId);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    addMessage('t1', chatInput, accountantId, 'Arthur Pendelton');
    setChatInput('');
  };

  const handleUpdateStatus = (obId, newStatus) => {
    updateObligationStatus(obId, newStatus);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F9FA' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', background: '#0B192C', color: '#fff', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ background: '#00A896', width: 35, height: 35, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>A</div>
          <div>
            <h2 style={{ fontSize: '1.05rem', color: '#fff', margin: 0 }}>Accountant Desk</h2>
            <span style={{ fontSize: '0.75rem', color: '#00A896' }}>Arthur Pendelton</span>
          </div>
        </div>

        <nav style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'portfolio' ? '#fff' : '#9CA3AF', background: activeSubTab === 'portfolio' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem' }}
            onClick={() => setActiveSubTab('portfolio')}
          >
            <Users size={18} /> Client Portfolio
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'filings' ? '#fff' : '#9CA3AF', background: activeSubTab === 'filings' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem' }}
            onClick={() => setActiveSubTab('filings')}
          >
            <CalendarClock size={18} /> Compliance Obligations
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'conversations' ? '#fff' : '#9CA3AF', background: activeSubTab === 'conversations' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem' }}
            onClick={() => setActiveSubTab('conversations')}
          >
            <MessageSquare size={18} /> Client Direct Chat
          </button>
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#EF4444', fontSize: '0.9rem' }} onClick={onLogout}>
            <LogOut size={16} /> Exit Portal
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxHeight: '100vh' }}>
        {activeSubTab === 'portfolio' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', margin: 0 }}>Client Portfolio Overview</h1>
                <p style={{ color: '#6B7280' }}>Manage assigned client businesses records and view operations health.</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <span className="premium-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={16} color="#10B981" /> <strong>4 Active Clients</strong>
                </span>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
              <div className="premium-card">
                <span style={{ color: '#6B7280', fontSize: '0.85rem', fontWeight: 600 }}>Workload Capacity</span>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0.25rem 0' }}>85% <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#6B7280' }}>Optimal</span></p>
                <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: '85%', height: '100%', background: '#00A896' }}></div>
                </div>
              </div>
              <div className="premium-card">
                <span style={{ color: '#6B7280', fontSize: '0.85rem', fontWeight: 600 }}>Overdue Action Items</span>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0.25rem 0', color: '#EF4444' }}>1 Client Late</p>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Apex Logistics Ltd (Q3 Tax)</span>
              </div>
              <div className="premium-card">
                <span style={{ color: '#6B7280', fontSize: '0.85rem', fontWeight: 600 }}>Average Compliance Score</span>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0.25rem 0', color: '#10B981' }}>86.5%</p>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Up 2.1% from last month</span>
              </div>
            </div>

            {/* Clients Table */}
            <div className="premium-card">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.08)', color: '#6B7280' }}>
                    <th style={{ padding: '1rem' }}>Client Business</th>
                    <th>Business Type</th>
                    <th>Annual Revenue</th>
                    <th>Compliance Score</th>
                    <th>Current Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myClients.map(client => (
                    <tr key={client.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <td style={{ padding: '1rem' }}>
                        <p style={{ fontWeight: 'bold', margin: 0 }}>{client.name}</p>
                        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Owner: {client.ownerName}</span>
                      </td>
                      <td>{client.businessType}</td>
                      <td>{client.revenue}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, width: '60px', height: 6, background: '#E5E7EB', borderRadius: 3 }}>
                            <div style={{ width: `${client.complianceScore}%`, height: '100%', background: client.complianceScore > 90 ? '#10B981' : '#F59E0B', borderRadius: 3 }}></div>
                          </div>
                          <span>{client.complianceScore}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${client.status === 'Late' ? 'badge-danger' : client.status === 'Needs Review' ? 'badge-warning' : 'badge-success'}`}>
                          {client.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => { setActiveSubTab('conversations'); setActiveChatClientId(client.id); }}>Message</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Compliance Filings Tab */}
        {activeSubTab === 'filings' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2rem', margin: 0 }}>Filing & Compliance Manager</h1>
              <p style={{ color: '#6B7280' }}>Review and transition filing obligations status. Changes apply directly to client accounts.</p>
            </div>

            <div className="premium-card">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.08)', color: '#6B7280' }}>
                    <th style={{ padding: '1rem' }}>Filing Name</th>
                    <th>Client</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Filing Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {myObligations.map(ob => {
                    const client = clients.find(c => c.id === ob.clientId);
                    return (
                      <tr key={ob.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                        <td style={{ padding: '1rem' }}>
                          <p style={{ fontWeight: 'bold', margin: 0 }}>{ob.title}</p>
                          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Type: {ob.type}</span>
                        </td>
                        <td>{client ? client.name : 'Unknown'}</td>
                        <td>{ob.dueDate}</td>
                        <td>
                          <span className={`badge ${ob.status === 'Late' ? 'badge-danger' : ob.status === 'Needs Review' ? 'badge-warning' : ob.status === 'Filed' ? 'badge-success' : 'badge-info'}`}>
                            {ob.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleUpdateStatus(ob.id, 'Filed')}><Check size={14} /> Mark Filed</button>
                            <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleUpdateStatus(ob.id, 'Needs Review')}><ShieldAlert size={14} /> Request Info</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Conversations Tab */}
        {activeSubTab === 'conversations' && (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem' }}>
            {/* Roster */}
            <div className="premium-card" style={{ padding: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Assigned Businesses</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {myClients.map(client => (
                  <button 
                    key={client.id}
                    style={{ 
                      padding: '0.75rem', 
                      borderRadius: 8, 
                      textAlign: 'left', 
                      width: '100%', 
                      background: activeChatClientId === client.id ? 'rgba(0,168,150,0.1)' : 'transparent',
                      color: activeChatClientId === client.id ? '#008080' : '#0B192C',
                      fontWeight: activeChatClientId === client.id ? 'bold' : 'normal',
                      border: activeChatClientId === client.id ? '1px solid rgba(0,168,150,0.2)' : '1px solid transparent'
                    }}
                    onClick={() => setActiveChatClientId(client.id)}
                  >
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{client.name}</p>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Owner: {client.ownerName}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Box */}
            <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', height: '520px' }}>
              <h3 style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                Direct Messaging Thread with {clients.find(c => c.id === activeChatClientId)?.ownerName}
              </h3>
              
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem', marginBottom: '1rem' }}>
                {messages.filter(m => m.threadId === 't1').map(msg => {
                  const isAccountant = msg.senderId === accountantId;
                  return (
                    <div key={msg.id} style={{ alignSelf: isAccountant ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                      <div style={{ background: isAccountant ? '#008080' : '#E5E7EB', color: isAccountant ? '#fff' : '#0B192C', padding: '0.75rem 1rem', borderRadius: 12, borderTopRightRadius: isAccountant ? 0 : 12, borderTopLeftRadius: isAccountant ? 12 : 0, fontSize: '0.9rem' }}>
                        {msg.content}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block', textAlign: isAccountant ? 'right' : 'left', marginTop: '0.25rem' }}>
                        {msg.senderName} • {msg.timestamp}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chat Form */}
              <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Type advice or action request..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                />
                <button type="submit" className="btn btn-teal"><Send size={18} /></button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
