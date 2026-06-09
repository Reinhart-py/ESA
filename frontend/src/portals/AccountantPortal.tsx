import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppContext } from '../context/AppContext.tsx';
import { apiClient } from '../api/client.ts';
import { 
  Users, CalendarClock, MessageSquare, LogOut, Check, Send, 
  ShieldAlert, TrendingUp, X, MessageSquareText, Link, BookOpen, Briefcase,
  Sparkles, Shield
} from 'lucide-react';
import LedgerManagement from './LedgerManagement.tsx';
import ComplianceFilingDashboard from './ComplianceFilingDashboard.tsx';
import MarketplaceDesk from './MarketplaceDesk.tsx';
import AICopilotPanel from './AICopilotPanel.tsx';
import ReportingDashboard from './ReportingDashboard.tsx';
import InternalMessagingHub from './InternalMessagingHub.tsx';
import ProfileSettings from './ProfileSettings.tsx';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent'])
});

const commentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
});

const messageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty'),
});

export default function AccountantPortal({ onLogout }: { onLogout: () => void }) {
  const context = useContext(AppContext);
  if (!context) return null;

  const { 
    obligations, messages, updateObligationStatus, sendMessage, currentUser, tasks, createTask, syncState
  } = context;

  const [activeSubTab, setActiveSubTab] = useState('portfolio');
  const [impersonatingId, setImpersonatingId] = useState<string>(() => localStorage.getItem('impersonate_tenant_id') || '');
  const [tenants, setTenants] = useState<any[]>([]);

  const fetchTenants = async () => {
    try {
      const res = await apiClient.get('/tenants');
      setTenants(res.data || []);
    } catch (err) {
      console.error('Error fetching tenants list:', err);
    }
  };

  React.useEffect(() => {
    if (currentUser?.role === 'senior_accountant') {
      fetchTenants();
    }
  }, [currentUser]);

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

  // React Hook Forms
  const { register: registerTask, handleSubmit: handleSubmitTask, reset: resetTask, formState: { errors: taskErrors } } = useForm({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { title: '', description: '', priority: 'Medium' as const }
  });

  const { register: registerComment, handleSubmit: handleSubmitComment, reset: resetComment, formState: { errors: commentErrors } } = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: '' }
  });

  const { register: registerMessage, handleSubmit: handleSubmitMessage, reset: resetMessage, formState: { errors: messageErrors } } = useForm({
    resolver: zodResolver(messageSchema),
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
      // Reload dependencies
      const depsRes = await apiClient.get(`/tasks/${selectedTask.id}/dependencies`);
      setDependencies(depsRes.data || []);
      setSelectedDepTaskId('');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to add dependency';
      setDepError(msg);
    }
  };

  const handleSendChatSubmit = async (data: { content: string }) => {
    await sendMessage(data.content, 't1');
    resetMessage();
  };

  const handleUpdateStatus = async (obId: string, newStatus: string) => {
    await updateObligationStatus(obId, newStatus);
  };

  const handleCreateTaskSubmit = async (data: { title: string; description?: string; priority: 'Low' | 'Medium' | 'High' | 'Urgent' }) => {
    await createTask(data.title, data.description || '', new Date().toISOString().split('T')[0], data.priority);
    resetTask();
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

        {currentUser?.role === 'senior_accountant' && (
          <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ShieldAlert size={14} style={{ color: '#00A896' }} /> Impersonate Tenant
            </label>
            <select
              value={impersonatingId}
              onChange={(e) => handleImpersonate(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
            >
              <option value="">-- No Impersonation --</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

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
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'ledger' ? '#fff' : '#9CA3AF', background: activeSubTab === 'ledger' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('ledger')}
          >
            <BookOpen size={18} /> General Ledger
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'conversations' ? '#fff' : '#9CA3AF', background: activeSubTab === 'conversations' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('conversations')}
          >
            <MessageSquare size={18} /> Client Direct Chat
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'marketplace' ? '#fff' : '#9CA3AF', background: activeSubTab === 'marketplace' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('marketplace')}
          >
            <Briefcase size={18} /> Marketplace Desk
          </button>


          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'ai_assistant' ? '#fff' : '#9CA3AF', background: activeSubTab === 'ai_assistant' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('ai_assistant')}
          >
            <Sparkles size={18} /> AI Co-pilot
          </button>

          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', width: '100%', borderRadius: 6, color: activeSubTab === 'security' ? '#fff' : '#9CA3AF', background: activeSubTab === 'security' ? '#1E3E62' : 'transparent', textAlign: 'left', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
            onClick={() => setActiveSubTab('security')}
          >
            <Shield size={18} /> Security & Profile
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
                        background: selectedTask?.id === t.id ? '#F0F9FF' : '#fff', 
                        borderRadius: '8px', 
                        border: selectedTask?.id === t.id ? '2px solid #00A896' : '1px solid #e2e8f0', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      <div>
                        <h4 style={{ margin: 0 }}>{t.title}</h4>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>{t.description}</p>
                      </div>
                      <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: '#cbd5e1' }}>{t.priority}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTask ? (
                <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
                  <button 
                    onClick={() => setSelectedTask(null)}
                    style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
                  >
                    <X size={18} />
                  </button>

                  <h3 style={{ margin: 0, paddingRight: '2rem' }}>Task Details</h3>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{selectedTask.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>{selectedTask.description || 'No description provided.'}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', borderRadius: '4px', background: '#cbd5e1', fontWeight: 'bold' }}>{selectedTask.priority}</span>
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', borderRadius: '4px', background: '#e2e8f0' }}>Due: {selectedTask.due_date}</span>
                    </div>
                  </div>

                  <hr style={{ border: '0', borderTop: '1px solid #e2e8f0', margin: '0' }} />

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
                            <div key={d.id} style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                              🔗 {depTask ? depTask.title : 'Unknown Task'}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>No dependencies linked.</p>
                    )}

                    <form onSubmit={handleAddDependency} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <select 
                        value={selectedDepTaskId} 
                        onChange={e => setSelectedDepTaskId(e.target.value)}
                        style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff' }}
                      >
                        <option value="">Select task dependency...</option>
                        {tasks.filter(t => t.id !== selectedTask.id).map(t => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>
                      <button type="submit" style={{ padding: '0.4rem', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        Add Dependency
                      </button>
                      {depError && <p style={{ margin: 0, color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold' }}>{depError}</p>}
                    </form>
                  </div>

                  <hr style={{ border: '0', borderTop: '1px solid #e2e8f0', margin: '0' }} />

                  {/* Comments section */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MessageSquareText size={16} /> Comments ({comments.length})
                    </h4>
                    
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '180px', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem', paddingRight: '0.25rem' }}>
                      {comments.length > 0 ? (
                        comments.map(c => (
                          <div key={c.id} style={{ fontSize: '0.85rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <p style={{ margin: '0 0 0.25rem 0', color: '#475569' }}>{c.content}</p>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(c.created_at).toLocaleString()}</span>
                          </div>
                        ))
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>No comments yet.</p>
                      )}
                    </div>

                    <form onSubmit={handleSubmitComment(handleAddCommentSubmit)} style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="text" 
                          {...registerComment('content')}
                          placeholder="Add comment..."
                          style={{ flex: 1, padding: '0.4rem', borderRadius: '6px', border: commentErrors.content ? '1px solid #ef4444' : '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
                        <button type="submit" style={{ padding: '0.4rem 0.8rem', background: '#00a896', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                          Post
                        </button>
                      </div>
                      {commentErrors.content && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{commentErrors.content.message}</span>}
                    </form>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
                  <h3>Assign New Task</h3>
                  <form onSubmit={handleSubmitTask(handleCreateTaskSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input 
                      type="text" 
                      {...registerTask('title')}
                      placeholder="Task Title"
                      style={{ padding: '0.5rem', borderRadius: '6px', border: taskErrors.title ? '1px solid #ef4444' : '1px solid #cbd5e1' }}
                    />
                    {taskErrors.title && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{taskErrors.title.message}</span>}
                    
                    <textarea 
                      {...registerTask('description')}
                      placeholder="Task Description"
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', minHeight: '80px' }}
                    />
                    
                    <select
                      {...registerTask('priority')}
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                      <option value="Urgent">Urgent Priority</option>
                    </select>

                    <button type="submit" style={{ padding: '0.5rem', background: '#00a896', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                      Create Task
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compliance Filings */}
        {activeSubTab === 'filings' && (
          <ComplianceFilingDashboard isAccountant={true} />
        )}

        {activeSubTab === 'ledger' && (
          <LedgerManagement />
        )}

        {/* Conversations — Real Messaging Hub */}
        {activeSubTab === 'conversations' && (
          <div style={{ height: 'calc(100vh - 100px)' }}>
            <InternalMessagingHub
              apiBase="http://localhost:3001"
              authToken={localStorage.getItem('supabase_token') || undefined}
              currentUserId={currentUser?.id || ''}
              currentUserName={currentUser?.full_name || 'Accountant'}
            />
          </div>
        )}
        {activeSubTab === 'marketplace' && (
          <MarketplaceDesk />
        )}
        {activeSubTab === 'ai_assistant' && (
          <AICopilotPanel />
        )}
        {activeSubTab === 'security' && (
          <ProfileSettings />
        )}
      </main>
    </div>
  );
}
