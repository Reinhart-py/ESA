import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Building, Shield, ShieldCheck, HelpCircle, FileText, 
  Settings, LogOut, CheckCircle, Database, Lock, UserCheck
} from 'lucide-react';

export default function AdminPortal({ onLogout }) {
  const { 
    clients, tickets, auditLogs, updateTicketStatus, setClients, professionals
  } = useContext(AppContext);

  const [activeSubTab, setActiveSubTab] = useState('metrics');
  const [selectedClientToEdit, setSelectedClientToEdit] = useState(null);
  const [editStatus, setEditStatus] = useState('');

  const handleUpdateFilingStatus = (clientId, newStatus) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, status: newStatus } : c));
  };

  const handleResolveTicket = (ticketId) => {
    updateTicketStatus(ticketId, 'Resolved');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F9FA' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', background: '#0B192C', color: '#fff', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ background: '#EF4444', width: 35, height: 35, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>S</div>
          <div>
            <h2 style={{ fontSize: '1.05rem', color: '#fff', margin: 0 }}>System Admin</h2>
            <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>Role: Super Administrator</span>
          </div>
        </div>

        <nav style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'metrics' ? '#fff' : '#9CA3AF', background: activeSubTab === 'metrics' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem' }}
            onClick={() => setActiveSubTab('metrics')}
          >
            <ShieldCheck size={18} /> Platform Health
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'clients' ? '#fff' : '#9CA3AF', background: activeSubTab === 'clients' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem' }}
            onClick={() => setActiveSubTab('clients')}
          >
            <Building size={18} /> Accounts Directory
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'tickets' ? '#fff' : '#9CA3AF', background: activeSubTab === 'tickets' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem' }}
            onClick={() => setActiveSubTab('tickets')}
          >
            <HelpCircle size={18} /> Helpdesk Tickets
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'logs' ? '#fff' : '#9CA3AF', background: activeSubTab === 'logs' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem' }}
            onClick={() => setActiveSubTab('logs')}
          >
            <Database size={18} /> System Audit Trail
          </button>
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#EF4444', fontSize: '0.9rem' }} onClick={onLogout}>
            <LogOut size={16} /> Exit Admin
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxHeight: '100vh' }}>
        {activeSubTab === 'metrics' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2rem', margin: 0 }}>System Operations Console</h1>
              <p style={{ color: '#6B7280' }}>Real-time monitoring of tenant databases, storage allocations, and billing cycles.</p>
            </div>

            {/* Metrics cards */}
            <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
              <div className="premium-card">
                <span style={{ color: '#6B7280', fontSize: '0.85rem', fontWeight: 600 }}>Total active clients</span>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.25rem 0', color: '#0B192C' }}>{clients.length} Businesses</p>
                <span style={{ color: '#10B981', fontSize: '0.8rem', fontWeight: 600 }}>▲ Multi-tenancy Isolation Secure</span>
              </div>
              <div className="premium-card">
                <span style={{ color: '#6B7280', fontSize: '0.85rem', fontWeight: 600 }}>Google Drive Usage</span>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.25rem 0', color: '#0B192C' }}>8.3 MB / 5.0 TB</p>
                <span style={{ color: '#008080', fontSize: '0.8rem' }}>Connected via Google workspace</span>
              </div>
              <div className="premium-card">
                <span style={{ color: '#6B7280', fontSize: '0.85rem', fontWeight: 600 }}>Active support queues</span>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.25rem 0', color: '#EF4444' }}>{tickets.filter(t => t.status === 'Open').length} Open Tickets</p>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Average resolution: 4 hours</span>
              </div>
            </div>

            <div className="premium-card">
              <h3 style={{ marginBottom: '1.5rem' }}>Platform Infrastructure Diagnostics</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#F9FAFB', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Lock size={20} color="#10B981" />
                    <div>
                      <p style={{ fontWeight: 'bold', margin: 0, fontSize: '0.95rem' }}>Supabase Authentication Services</p>
                      <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Role-based Access Tokens Active. JWT encryption validated.</span>
                    </div>
                  </div>
                  <span className="badge badge-success">Operational</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#F9FAFB', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Database size={20} color="#10B981" />
                    <div>
                      <p style={{ fontWeight: 'bold', margin: 0, fontSize: '0.95rem' }}>PostgreSQL Relational DB Instance</p>
                      <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Connection pool: 18 active clients. Primary replica sync online.</span>
                    </div>
                  </div>
                  <span className="badge badge-success">Operational</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Client Accounts management */}
        {activeSubTab === 'clients' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2rem', margin: 0 }}>Business Accounts Directory</h1>
              <p style={{ color: '#6B7280' }}>Manage tenant parameters, update overall compliance profiles, and reassign professionals.</p>
            </div>

            <div className="premium-card">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.08)', color: '#6B7280' }}>
                    <th style={{ padding: '1rem' }}>Business Name</th>
                    <th>Filing Status</th>
                    <th>Assigned Specialist</th>
                    <th>Adjust Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(client => (
                    <tr key={client.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>{client.name}</td>
                      <td>
                        <span className={`badge ${client.status === 'Late' ? 'badge-danger' : client.status === 'Needs Review' ? 'badge-warning' : 'badge-success'}`}>
                          {client.status}
                        </span>
                      </td>
                      <td>
                        {professionals.find(p => p.id === client.assignedProfessional)?.name}
                      </td>
                      <td>
                        <select 
                          className="form-input" 
                          style={{ width: '160px', padding: '0.25rem 0.5rem' }} 
                          value={client.status} 
                          onChange={(e) => handleUpdateFilingStatus(client.id, e.target.value)}
                        >
                          <option value="On Track">On Track</option>
                          <option value="Needs Review">Needs Review</option>
                          <option value="Late">Late</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Support Tickets Tab */}
        {activeSubTab === 'tickets' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2rem', margin: 0 }}>Helpdesk Tickets Management</h1>
              <p style={{ color: '#6B7280' }}>View, track, and resolve system and filing questions submitted by tenant users.</p>
            </div>

            <div className="premium-card">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.08)', color: '#6B7280' }}>
                    <th style={{ padding: '1rem' }}>Subject</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(tkt => (
                    <tr key={tkt.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <td style={{ padding: '1rem' }}>
                        <p style={{ fontWeight: 'bold', margin: 0 }}>{tkt.subject}</p>
                        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Submitted on: {tkt.createdAt}</span>
                      </td>
                      <td>{tkt.category}</td>
                      <td>
                        <span className={`badge ${tkt.priority === 'High' ? 'badge-danger' : 'badge-info'}`}>
                          {tkt.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${tkt.status === 'Open' ? 'badge-warning' : 'badge-success'}`}>
                          {tkt.status}
                        </span>
                      </td>
                      <td>
                        {tkt.status === 'Open' ? (
                          <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleResolveTicket(tkt.id)}>Resolve Ticket</button>
                        ) : (
                          <span style={{ color: '#10B981', fontWeight: 600 }}>Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* System Audit Trail Tab */}
        {activeSubTab === 'logs' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2rem', margin: 0 }}>Platform Audit Trail Logs</h1>
              <p style={{ color: '#6B7280' }}>Chronological logging of transactional operations and dashboard events across the multitenancy platform.</p>
            </div>

            <div className="premium-card">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '450px', overflowY: 'auto' }}>
                {auditLogs.map((log, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#F9FAFB', border: '1px solid rgba(0,0,0,0.03)', borderRadius: 6, fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ color: '#9CA3AF' }}>{log.timestamp}</span>
                      <strong>[{log.category}]</strong>
                      <span>{log.action}</span>
                    </div>
                    <span style={{ color: '#6B7280' }}>User: {log.user}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
