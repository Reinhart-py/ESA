import React, { useState, useEffect, useContext } from 'react';
import { apiClient } from '../api/client.ts';
import { AppContext } from '../context/AppContext.tsx';
import {
  HelpCircle, MessageSquare, Plus, CheckCircle, Clock, AlertTriangle,
  User, Send, BookOpen, BarChart2, Star, Trash2, ShieldAlert, Check,
  Search, Shield, UserCheck, ShieldCheck, Play, ArrowRight, UserPlus,
  RefreshCw, FileText, Settings
} from 'lucide-react';
import ConfirmDialog from '../components/ui/ConfirmDialog.tsx';
import EmptyState from '../components/ui/EmptyState.tsx';
import Toast, { ToastMessage } from '../components/ui/Toast.tsx';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assigned_agent_id?: string;
  created_by?: string;
  created_at: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

interface KbArticle {
  id: string;
  title: string;
  content: string;
  category?: string;
  is_published: boolean;
  created_at: string;
}

export default function SupportManagement() {
  const context = useContext(AppContext);
  const userRole = context?.userRole || 'client_owner';
  const currentUser = context?.currentUser;

  const [activeTab, setActiveTab] = useState<'tickets' | 'kb' | 'reports' | 'agents'>('tickets');
  
  // Ticketing states
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<(SupportTicket & { messages: TicketMessage[] }) | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKbModal, setShowKbModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);

  // Forms
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Accounting');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [creatingTicket, setCreatingTicket] = useState(false);

  // KB Article states
  const [kbArticles, setKbArticles] = useState<KbArticle[]>([]);
  const [loadingKb, setLoadingKb] = useState(false);
  const [newKbTitle, setNewKbTitle] = useState('');
  const [newKbContent, setNewKbContent] = useState('');
  const [newKbCategory, setNewKbCategory] = useState('Accounting Help');
  const [newKbPublished, setNewKbPublished] = useState(true);
  const [kbArticleId, setKbArticleId] = useState<string | null>(null); // for editing
  const [kbSearchQuery, setKbSearchQuery] = useState('');

  // Rating state
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Reports data
  const [slaBreaches, setSlaBreaches] = useState<any[]>([]);
  const [csatData, setCsatData] = useState<any>(null);
  const [volumeData, setVolumeData] = useState<any>(null);
  const [loadingReports, setLoadingReports] = useState(false);

  // Agents data
  const [agents, setAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  // Toast notifications & delete confirmation
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [deleteTicketId, setDeleteTicketId] = useState<string | null>(null);
  const [deleteKbId, setDeleteKbId] = useState<string | null>(null);

  const addToast = (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => {
    setToasts(prev => [...prev, { id: Math.random().toString(), type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Automated Response Templates Macros
  const macros = [
    { title: "Onboarding Query", text: "Welcome to EAC Solutions! We have processed your onboarding application. Please check the Documents Vault for your signed contract." },
    { title: "Tax Filing Clarification", text: "We have reviewed your request regarding your Corporate Tax filing. Our tax specialists will finalize the calculations shortly." },
    { title: "Standard Closeout", text: "We have successfully completed the tasks requested. Let us know if you require any further assistance." }
  ];

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      let url = '/support/tickets?';
      if (statusFilter) url += `status=${statusFilter}&`;
      if (priorityFilter) url += `priority=${priorityFilter}&`;
      if (categoryFilter) url += `category=${categoryFilter}&`;
      if (searchTerm) url += `q=${encodeURIComponent(searchTerm)}&`;
      const res = await apiClient.get(url);
      setTickets(res.data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchTicketDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await apiClient.get(`/support/tickets/${id}`);
      setSelectedTicketDetail(res.data);
    } catch (err) {
      console.error('Error fetching ticket detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchKbArticles = async () => {
    setLoadingKb(true);
    try {
      const res = await apiClient.get('/support/kb');
      setKbArticles(res.data || []);
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoadingKb(false);
    }
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const slaRes = await apiClient.get('/support/reports/sla');
      const csatRes = await apiClient.get('/support/reports/cstat');
      const volRes = await apiClient.get('/support/reports/volume');
      setSlaBreaches(slaRes.data || []);
      setCsatData(csatRes.data || null);
      setVolumeData(volRes.data || null);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const res = await apiClient.get('/support/agents/status');
      setAgents(res.data || []);
    } catch (err) {
      console.error('Error fetching agents:', err);
    } finally {
      setLoadingAgents(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter, categoryFilter, searchTerm]);

  useEffect(() => {
    if (selectedTicketId) {
      fetchTicketDetail(selectedTicketId);
    }
  }, [selectedTicketId]);

  useEffect(() => {
    if (activeTab === 'kb') {
      fetchKbArticles();
    } else if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'agents') {
      fetchAgents();
    }
  }, [activeTab]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTicket(true);
    try {
      const res = await apiClient.post('/support/ticket', {
        subject: newSubject,
        description: newDescription,
        category: newCategory,
        priority: newPriority
      });
      addToast('success', 'Ticket Registered', 'Your support ticket has been submitted successfully.');
      setNewSubject('');
      setNewDescription('');
      setShowCreateModal(false);
      fetchTickets();
    } catch (err: any) {
      console.error('Error creating ticket:', err);
      addToast('error', 'Error', err.response?.data?.error || 'Failed to submit support ticket.');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;
    setSendingReply(true);
    try {
      await apiClient.post(`/support/tickets/${selectedTicketId}/messages`, {
        content: replyText
      });
      setReplyText('');
      fetchTicketDetail(selectedTicketId);
    } catch (err: any) {
      console.error('Error sending reply:', err);
      addToast('error', 'Error', err.response?.data?.error || 'Failed to send reply.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicketId) return;
    try {
      await apiClient.put(`/support/tickets/${selectedTicketId}/status`, { status });
      addToast('success', 'Status Updated', `Ticket status updated to ${status}`);
      fetchTickets();
      fetchTicketDetail(selectedTicketId);
    } catch (err: any) {
      console.error('Error updating status:', err);
      addToast('error', 'Error', err.response?.data?.error || 'Failed to update ticket status.');
    }
  };

  const handleAssignAgent = async (agentId: string) => {
    if (!selectedTicketId) return;
    try {
      await apiClient.put(`/support/tickets/${selectedTicketId}`, { assigned_agent_id: agentId });
      addToast('success', 'Agent Assigned', 'Ticket assigned successfully.');
      fetchTickets();
      fetchTicketDetail(selectedTicketId);
    } catch (err: any) {
      console.error('Error assigning agent:', err);
      addToast('error', 'Error', err.response?.data?.error || 'Failed to assign agent.');
    }
  };

  const handleDeleteTicket = async () => {
    if (!deleteTicketId) return;
    try {
      await apiClient.delete(`/support/tickets/${deleteTicketId}`);
      addToast('success', 'Deleted', 'Ticket deleted successfully.');
      setSelectedTicketId(null);
      setSelectedTicketDetail(null);
      fetchTickets();
    } catch (err) {
      console.error('Error deleting ticket:', err);
    } finally {
      setDeleteTicketId(null);
    }
  };

  const handleCreateOrUpdateKb = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (kbArticleId) {
        await apiClient.put(`/support/kb/${kbArticleId}`, {
          title: newKbTitle,
          content: newKbContent,
          category: newKbCategory,
          is_published: newKbPublished
        });
        addToast('success', 'Article Updated', 'Help center article updated successfully.');
      } else {
        await apiClient.post('/support/kb', {
          title: newKbTitle,
          content: newKbContent,
          category: newKbCategory,
          is_published: newKbPublished
        });
        addToast('success', 'Article Published', 'New help center article published.');
      }
      setNewKbTitle('');
      setNewKbContent('');
      setKbArticleId(null);
      setShowKbModal(false);
      fetchKbArticles();
    } catch (err: any) {
      console.error('Error saving article:', err);
      addToast('error', 'Error', err.response?.data?.error || 'Failed to save help article.');
    }
  };

  const handleDeleteKb = async () => {
    if (!deleteKbId) return;
    try {
      await apiClient.delete(`/support/kb/${deleteKbId}`);
      addToast('success', 'Deleted', 'Help article deleted.');
      fetchKbArticles();
    } catch (err) {
      console.error('Error deleting article:', err);
    } finally {
      setDeleteKbId(null);
    }
  };

  const handleRateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId) return;
    setSubmittingRating(true);
    try {
      await apiClient.post(`/support/tickets/${selectedTicketId}/rate`, {
        rating: ratingVal,
        feedback: ratingFeedback
      });
      addToast('success', 'Feedback Recorded', 'Thank you for your feedback rating!');
      setRatingFeedback('');
      setRatingVal(5);
      setShowRateModal(false);
      fetchTickets();
      fetchTicketDetail(selectedTicketId);
    } catch (err: any) {
      console.error('Error rating ticket:', err);
      addToast('error', 'Error', err.response?.data?.error || 'Failed to submit rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  // SLA Time Remaining Indicator math
  const getSlaTimeLeft = (ticket: SupportTicket) => {
    const created = new Date(ticket.created_at);
    const limit = ticket.priority === 'High' ? 4 : ticket.priority === 'Medium' ? 12 : 24; // SLA target hours
    const target = new Date(created.getTime() + limit * 60 * 60 * 1000);
    const diffMs = target.getTime() - Date.now();
    if (diffMs <= 0) return "SLA Breached";
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMins}m remaining`;
  };

  const isStaffOrAdmin = ['super_admin', 'admin', 'accountant', 'compliance_officer', 'payroll_specialist'].includes(userRole);

  const filteredKbArticles = kbArticles.filter(art => 
    art.title.toLowerCase().includes(kbSearchQuery.toLowerCase()) ||
    art.content.toLowerCase().includes(kbSearchQuery.toLowerCase()) ||
    art.category?.toLowerCase().includes(kbSearchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      
      {/* 1. Header with Tab Links */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setActiveTab('tickets')}
            style={{
              padding: '0.5rem 1.25rem',
              background: activeTab === 'tickets' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: activeTab === 'tickets' ? '#3b82f6' : '#94a3b8',
              border: activeTab === 'tickets' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <MessageSquare size={16} /> Support Queue
          </button>
          <button
            onClick={() => setActiveTab('kb')}
            style={{
              padding: '0.5rem 1.25rem',
              background: activeTab === 'kb' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: activeTab === 'kb' ? '#10b981' : '#94a3b8',
              border: activeTab === 'kb' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <BookOpen size={16} /> Knowledge Base
          </button>
          {isStaffOrAdmin && (
            <>
              <button
                onClick={() => setActiveTab('reports')}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: activeTab === 'reports' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                  color: activeTab === 'reports' ? '#8b5cf6' : '#94a3b8',
                  border: activeTab === 'reports' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <BarChart2 size={16} /> SLA & CSAT Metrics
              </button>
              <button
                onClick={() => setActiveTab('agents')}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: activeTab === 'agents' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                  color: activeTab === 'agents' ? '#f59e0b' : '#94a3b8',
                  border: activeTab === 'agents' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <User size={16} /> Team Roster
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 'bold' }}
        >
          <Plus size={16} /> Submit Support Ticket
        </button>
      </div>

      {/* 2. TAB CONTENT: SUPPORT QUEUE */}
      {activeTab === 'tickets' && (
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          
          {/* Tickets List Pane */}
          <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Search ticket subject..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', color: '#fff' }}
              />
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', color: '#fff', cursor: 'pointer' }}
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {loadingTickets ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <RefreshCw size={24} className="animate-spin" style={{ color: '#3b82f6' }} />
              </div>
            ) : tickets.length === 0 ? (
              <EmptyState 
                icon={<HelpCircle size={44} />}
                title="No Support Tickets"
                description="There are currently no active support requests matching the specified criteria."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {tickets.map(t => {
                  const isSelected = selectedTicketId === t.id;
                  const priorityColor = t.priority === 'High' ? '#ef4444' : t.priority === 'Medium' ? '#f59e0b' : '#10b981';
                  const statusBg = t.status === 'Open' ? '#3b82f6' : t.status === 'In Progress' ? '#f59e0b' : t.status === 'Resolved' ? '#10b981' : '#64748b';
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      style={{
                        padding: '1rem',
                        background: isSelected ? 'rgba(59, 130, 246, 0.1)' : '#1e293b',
                        border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Category: {t.category}</span>
                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: priorityColor }} title={`Priority: ${t.priority}`} />
                          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: statusBg, color: '#fff', fontWeight: 'bold' }}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold', color: '#fff' }}>{t.subject}</h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                        <span>Opened: {new Date(t.created_at).toLocaleDateString()}</span>
                        <span>{getSlaTimeLeft(t)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ticket Detail Console Pane */}
          <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {loadingDetail ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#1e293b', height: '400px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ color: '#3b82f6' }} />
              </div>
            ) : !selectedTicketDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1e293b', height: '400px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>
                <MessageSquare size={48} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: '1rem' }} />
                <h3>No Ticket Selected</h3>
                <p>Select a ticket from the support queue list to view the full dialogue thread and audit details.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', background: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', minHeight: '500px' }}>
                
                {/* Header Info */}
                <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 'bold' }}>{selectedTicketDetail.subject}</h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                      Priority: <strong style={{ color: selectedTicketDetail.priority === 'High' ? '#ef4444' : selectedTicketDetail.priority === 'Medium' ? '#f59e0b' : '#10b981' }}>{selectedTicketDetail.priority}</strong> | Category: {selectedTicketDetail.category}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginRight: '0.25rem' }}>{getSlaTimeLeft(selectedTicketDetail)}</span>
                    <select
                      value={selectedTicketDetail.status}
                      onChange={e => handleUpdateStatus(e.target.value)}
                      style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>

                    {selectedTicketDetail.status === 'Resolved' && (
                      <button
                        onClick={() => setShowRateModal(true)}
                        style={{ padding: '0.35rem 0.65rem', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Star size={12} fill="#fff" /> CSAT Review
                      </button>
                    )}

                    {isStaffOrAdmin && (
                      <button
                        onClick={() => setDeleteTicketId(selectedTicketDetail.id)}
                        style={{ padding: '0.35rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        title="Delete Ticket"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Assignment & Specialist Info (Staff Only) */}
                {isStaffOrAdmin && (
                  <div style={{ padding: '0.5rem 1.25rem', background: 'rgba(245, 158, 11, 0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ color: '#94a3b8' }}>Assignee Owner:</span>
                    <select
                      value={selectedTicketDetail.assigned_agent_id || ''}
                      onChange={e => handleAssignAgent(e.target.value)}
                      style={{ padding: '0.2rem 0.4rem', borderRadius: '4px', border: 'none', background: '#1e293b', color: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      <option value="">Unassigned</option>
                      {agents.map(a => (
                        <option key={a.id} value={a.id}>{a.full_name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Description Body */}
                <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.1)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <label style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '0.35rem' }}>Initial Description Detail</label>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.5 }}>{selectedTicketDetail.description}</p>
                </div>

                {/* Messages Feed */}
                <div style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto', background: 'rgba(0,0,0,0.05)' }}>
                  {selectedTicketDetail.messages.length === 0 ? (
                    <span style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', display: 'block', margin: '2rem 0' }}>No responses logged. Write a comment reply below to respond.</span>
                  ) : (
                    selectedTicketDetail.messages.map(msg => {
                      const isCurrentUser = msg.user_id === currentUser?.id;
                      return (
                        <div
                          key={msg.id}
                          style={{
                            alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem'
                          }}
                        >
                          <span style={{ fontSize: '0.7rem', color: '#64748b', textAlign: isCurrentUser ? 'right' : 'left' }}>
                            {msg.user?.full_name || 'System Representative'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div
                            style={{
                              padding: '0.65rem 0.85rem',
                              borderRadius: '12px',
                              background: isCurrentUser ? '#3b82f6' : '#334155',
                              color: '#fff',
                              fontSize: '0.85rem',
                              lineHeight: 1.4
                            }}
                          >
                            {msg.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Reply Form */}
                <form onSubmit={handlePostReply} style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#0f172a' }}>
                  
                  {/* Macro Response Options (Staff Only) */}
                  {isStaffOrAdmin && (
                    <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.25rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>Macros:</span>
                      {macros.map((m, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setReplyText(m.text)}
                          style={{ padding: '0.2rem 0.5rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', color: '#94a3b8', fontSize: '0.7rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          {m.title}
                        </button>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Type ticket response details..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', color: '#fff', outline: 'none' }}
                    />
                    <button
                      type="submit"
                      disabled={sendingReply || !replyText.trim()}
                      style={{ padding: '0.6rem 1rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 'bold' }}
                    >
                      <Send size={14} /> Send
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. TAB CONTENT: KNOWLEDGE BASE */}
      {activeTab === 'kb' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
              <input 
                type="text" 
                placeholder="Search articles title or tag..."
                value={kbSearchQuery}
                onChange={e => setKbSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', color: '#fff' }}
              />
            </div>

            {isStaffOrAdmin && (
              <button
                onClick={() => {
                  setKbArticleId(null);
                  setNewKbTitle('');
                  setNewKbContent('');
                  setNewKbCategory('Accounting Help');
                  setNewKbPublished(true);
                  setShowKbModal(true);
                }}
                style={{ padding: '0.5rem 1rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Plus size={16} /> Create KB Article
              </button>
            )}
          </div>

          {loadingKb ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <RefreshCw size={24} className="animate-spin" style={{ color: '#3b82f6' }} />
            </div>
          ) : filteredKbArticles.length === 0 ? (
            <EmptyState 
              icon={<BookOpen size={44} />}
              title="Knowledge Base Empty"
              description="No articles were found matching your query details. Check back later or write custom help sheets."
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {filteredKbArticles.map(art => (
                <div
                  key={art.id}
                  style={{
                    padding: '1.25rem',
                    background: '#1e293b',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                        {art.category || 'General'}
                      </span>
                      {!art.is_published && (
                        <span style={{ fontSize: '0.7rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          Draft Mode
                        </span>
                      )}
                    </div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 'bold', color: '#fff' }}>{art.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.4, height: '80px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                      {art.content}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>Published: {new Date(art.created_at).toLocaleDateString()}</span>
                    
                    {isStaffOrAdmin && (
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          onClick={() => {
                            setKbArticleId(art.id);
                            setNewKbTitle(art.title);
                            setNewKbContent(art.content);
                            setNewKbCategory(art.category || 'General');
                            setNewKbPublished(art.is_published);
                            setShowKbModal(true);
                          }}
                          style={{ padding: '0.25rem 0.5rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteKbId(art.id)}
                          style={{ padding: '0.25rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB CONTENT: SLA & CSAT REPORTS */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Top Score Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Average Customer CSAT Rating</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>{csatData?.averageScore || '5.0'}</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', color: '#f59e0b' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={14} fill={(csatData?.averageScore || 5) >= star ? '#f59e0b' : 'none'} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Based on {csatData?.totalRatingsCount || 0} reviews</span>
                </div>
              </div>
            </div>

            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>SLA Target Response Compliance</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981' }}>
                {slaBreaches.length === 0 ? '100%' : `${Math.round(100 - (slaBreaches.length / Math.max(1, tickets.length)) * 100)}%`}
              </span>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: slaBreaches.length === 0 ? '100%' : `${Math.max(10, 100 - (slaBreaches.length / Math.max(1, tickets.length)) * 100)}%`, background: '#10b981' }} />
              </div>
            </div>

            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Volume Active Tickets</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#3b82f6' }}>{volumeData?.totalVolume || 0}</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Resolved: {volumeData?.status?.Resolved || 0} | Closed: {volumeData?.status?.Closed || 0}
              </span>
            </div>
          </div>

          {/* SLA Breaches & CSAT Logs */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            
            <div style={{ flex: '1 1 400px', background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>SLA Incident Alerts ({slaBreaches.length})</h4>
              {slaBreaches.length === 0 ? (
                <span style={{ fontSize: '0.85rem', color: '#64748b', padding: '2rem 0', textAlign: 'center' }}>No SLA target breaches logged. Team is within response boundaries.</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                  {slaBreaches.map(b => (
                    <div key={b.id} style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff', display: 'block' }}>{b.ticket?.subject}</span>
                        <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Breached Time: {new Date(b.breached_at).toLocaleDateString()}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', background: '#ef4444', color: '#fff', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                        {b.breach_type.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ flex: '1 1 400px', background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>Customer Satisfaction Ratings</h4>
              {(!csatData?.ratings || csatData.ratings.length === 0) ? (
                <span style={{ fontSize: '0.85rem', color: '#64748b', padding: '2rem 0', textAlign: 'center' }}>No customer feedback reviews logged yet.</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                  {csatData.ratings.map((r: any) => (
                    <div key={r.id} style={{ padding: '0.75rem', background: '#0f172a', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#e2e8f0' }}>Ticket: {r.ticket?.subject}</span>
                        <div style={{ display: 'flex', color: '#f59e0b' }}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={10} fill={r.rating >= s ? '#f59e0b' : 'none'} style={{ border: 'none' }} />
                          ))}
                        </div>
                      </div>
                      {r.feedback && <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>"{r.feedback}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: TEAM ROSTER */}
      {activeTab === 'agents' && (
        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>Support Team Active Workload Directory</h4>
          {loadingAgents ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <RefreshCw size={24} className="animate-spin" style={{ color: '#3b82f6' }} />
            </div>
          ) : agents.length === 0 ? (
            <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', textAlign: 'center' }}>No support staff profiles identified.</span>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', color: '#94a3b8', fontSize: '0.85rem' }}>
                  <th style={{ padding: '0.75rem' }}>Agent Full Name</th>
                  <th style={{ padding: '0.75rem' }}>Email Address</th>
                  <th style={{ padding: '0.75rem' }}>Assigned System Scope</th>
                  <th style={{ padding: '0.75rem' }}>Availability State</th>
                </tr>
              </thead>
              <tbody>
                {agents.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', color: '#e2e8f0', fontSize: '0.85rem' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{a.full_name}</td>
                    <td style={{ padding: '0.75rem' }}>{a.email}</td>
                    <td style={{ padding: '0.75rem' }}>{a.role?.toUpperCase()}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', background: '#10b98120', color: '#10b981', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                        AVAILABLE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 6. TOAST NOTIFICATIONS */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {toasts.map(t => (
          <Toast key={t.id} id={t.id} type={t.type} title={t.title} message={t.message} onClose={removeToast} />
        ))}
      </div>

      {/* 7. DIALOGS / CONFIRM MODALS */}
      <ConfirmDialog 
        isOpen={deleteTicketId !== null}
        title="Delete Ticket"
        message="Are you sure you want to permanently delete this support ticket request? This action cannot be undone."
        onConfirm={handleDeleteTicket}
        onCancel={() => setDeleteTicketId(null)}
      />

      <ConfirmDialog 
        isOpen={deleteKbId !== null}
        title="Delete Article"
        message="Are you sure you want to permanently delete this help article from the Knowledge Base directory?"
        onConfirm={handleDeleteKb}
        onCancel={() => setDeleteKbId(null)}
      />

      {/* 8. CREATE TICKET MODAL OVERLAY */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', width: '450px', color: '#fff' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 'bold', fontSize: '1.25rem' }}>Submit Ticket Request</h3>
            
            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Subject</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Summary of issue..." 
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Description Details</label>
                <textarea 
                  required 
                  rows={4}
                  placeholder="Describe your issue, questions, or requests..." 
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', cursor: 'pointer' }}
                  >
                    <option value="Accounting">Accounting</option>
                    <option value="Compliance">Compliance</option>
                    <option value="DMS / Files">DMS / Files</option>
                    <option value="Billing / Stripe">Billing / Stripe</option>
                    <option value="General Support">General Support</option>
                  </select>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Priority Level</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', cursor: 'pointer' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '0.5rem 1rem', background: '#334155', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={creatingTicket} style={{ padding: '0.5rem 1rem', background: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
                  {creatingTicket ? 'Submitting...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. CREATE/EDIT KB ARTICLE MODAL OVERLAY */}
      {showKbModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', width: '500px', color: '#fff' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 'bold', fontSize: '1.25rem' }}>
              {kbArticleId ? 'Edit Knowledge Article' : 'Create Knowledge Article'}
            </h3>
            
            <form onSubmit={handleCreateOrUpdateKb} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Title</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Title of help article..." 
                  value={newKbTitle}
                  onChange={e => setNewKbTitle(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Article Content (Markdown supported)</label>
                <textarea 
                  required 
                  rows={6}
                  placeholder="Provide detailed instructions, help references, or answers..." 
                  value={newKbContent}
                  onChange={e => setNewKbContent(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Help Category</label>
                  <select
                    value={newKbCategory}
                    onChange={e => setNewKbCategory(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', cursor: 'pointer' }}
                  >
                    <option value="Accounting Help">Accounting Help</option>
                    <option value="Compliance Guides">Compliance Guides</option>
                    <option value="Platform Security">Platform Security</option>
                    <option value="Document Vault FAQ">Document Vault FAQ</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
                  <input
                    type="checkbox"
                    id="published-chk"
                    checked={newKbPublished}
                    onChange={e => setNewKbPublished(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="published-chk" style={{ fontSize: '0.85rem', color: '#e2e8f0', cursor: 'pointer' }}>Publish Article Immediately</label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowKbModal(false)} style={{ padding: '0.5rem 1rem', background: '#334155', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', background: '#10b981', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. CSAT RATING MODAL OVERLAY */}
      {showRateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', width: '400px', color: '#fff', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontWeight: 'bold', fontSize: '1.25rem' }}>Review Ticket Experience</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.5rem' }}>Please rate your service quality score experience for the closed support ticket.</p>
            
            <form onSubmit={handleRateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingVal(star)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b' }}
                  >
                    <Star size={32} fill={ratingVal >= star ? '#f59e0b' : 'none'} />
                  </button>
                ))}
              </div>

              <textarea 
                rows={3}
                placeholder="Optional comments or suggestions..." 
                value={ratingFeedback}
                onChange={e => setRatingFeedback(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', outline: 'none' }}
              />

              <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowRateModal(false)} style={{ padding: '0.5rem 1rem', background: '#334155', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submittingRating} style={{ padding: '0.5rem 1rem', background: '#f59e0b', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
                  {submittingRating ? 'Saving...' : 'Submit Rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
