import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext.tsx';
import { 
  Users, CalendarClock, MessageSquare, LogOut, Check, Send, 
  ShieldAlert, TrendingUp
} from 'lucide-react';

export default function AccountantPortal({ onLogout }: { onLogout: () => void }) {
  const context = useContext(AppContext);
  if (!context) return null;

  const { 
    obligations, messages, updateObligationStatus, sendMessage, currentUser, tasks, createTask
  } = context;

  const [activeSubTab, setActiveSubTab] = useState('portfolio');
  const [chatInput, setChatInput] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');

  const handleSendChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    await sendMessage(chatInput, 't1');
    setChatInput('');
  };

  const handleUpdateStatus = async (obId: string, newStatus: string) => {
    await updateObligationStatus(obId, newStatus);
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    await createTask(taskTitle, taskDesc, new Date().toISOString().split('T')[0], taskPriority);
    setTaskTitle('');
    setTaskDesc('');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F9FA', color: '#1e293b' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', background: '#0B192C', color: '#fff', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ background: '#00A896', width: 35, height: 35, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>A</div>
          <div>
            <h2 style={{ fontSize: '1.05rem', color: '#fff', margin: 0 }}>Accountant Desk</h2>
            <span style={{ fontSize: '0.75rem', color: '#00A896' }}>{currentUser?.full_name || 'Accountant Specialist'}</span>
          </div>
        </div>

        <nav style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'portfolio' ? '#fff' : '#9CA3AF', background: activeSubTab === 'portfolio' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('portfolio')}
          >
            <Users size={18} /> Client Tasks
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'filings' ? '#fff' : '#9CA3AF', background: activeSubTab === 'filings' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('filings')}
          >
            <CalendarClock size={18} /> Compliance Obligations
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'conversations' ? '#fff' : '#9CA3AF', background: activeSubTab === 'conversations' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('conversations')}
          >
            <MessageSquare size={18} /> Client Direct Chat
          </button>
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#EF4444', fontSize: '0.9rem', background: 'none', border: 'none', cursor: 'pointer' }} onClick={onLogout}>
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
                <h1 style={{ fontSize: '2rem', margin: 0 }}>Task Management Portfolio</h1>
                <p style={{ color: '#6B7280' }}>Track and manage active internal tasks for assigned clients.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
              <div>
                <h3>Assigned Active Tasks ({tasks.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {tasks.map(t => (
                    <div key={t.id} style={{ padding: '1rem', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: 0 }}>{t.title}</h4>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>{t.description}</p>
                      </div>
                      <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: '#cbd5e1' }}>{t.priority}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3>Assign New Task</h3>
                <form onSubmit={handleCreateTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input 
                    type="text" 
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    placeholder="Task Title"
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                  <textarea 
                    value={taskDesc}
                    onChange={e => setTaskDesc(e.target.value)}
                    placeholder="Task Description"
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', minHeight: '80px' }}
                  />
                  <button type="submit" style={{ padding: '0.5rem', background: '#00a896', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    Create Task
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Filings */}
        {activeSubTab === 'filings' && (
          <div>
            <h2>Compliance Management Obligations</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#6B7280', background: '#f8fafc' }}>
                  <th style={{ padding: '1rem' }}>Filing Name</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: '1rem' }}>Controls</th>
                </tr>
              </thead>
              <tbody>
                {obligations.map(ob => (
                  <tr key={ob.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem' }}>{ob.title}</td>
                    <td>{ob.due_date}</td>
                    <td>{ob.status}</td>
                    <td style={{ textAlign: 'right', paddingRight: '1rem' }}>
                      <button style={{ marginRight: '0.5rem', padding: '0.25rem 0.5rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => handleUpdateStatus(ob.id, 'Filed')}>Filed</button>
                      <button style={{ padding: '0.25rem 0.5rem', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => handleUpdateStatus(ob.id, 'Needs Review')}>Review</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Conversations */}
        {activeSubTab === 'conversations' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', height: '450px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {messages.map(m => (
                  <div key={m.id} style={{ marginBottom: '1rem' }}>
                    <strong>{m.sender_id === currentUser?.id ? 'You' : 'Client'}:</strong>
                    <p style={{ margin: '0.25rem 0 0 0' }}>{m.content}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendChatSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Type message..." 
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
                <button type="submit" style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  Send Chat
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
