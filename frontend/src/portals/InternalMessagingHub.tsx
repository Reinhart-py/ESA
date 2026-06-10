import React, { useState, useEffect, useRef } from 'react';
import { Send, Link, Video, FileText, Search, User, PlusCircle, Check, X, Calendar, ShieldAlert } from 'lucide-react';

interface MessageThread {
  id: string;
  subject: string;
  tenant_id: string;
  created_at: string;
  participants: {
    user_id: string;
    user: {
      id: string;
      full_name: string;
      email: string;
      role: string;
    };
  }[];
}

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  attachment_file_ids?: string[];
  created_at: string;
  sender: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  is_zoom_card?: boolean;
  zoom_time?: string;
  zoom_url?: string;
}

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_client?: boolean;
}

interface InternalMessagingHubProps {
  apiBase?: string;
  authToken?: string;
  currentUserId?: string;
  currentUserName?: string;
}

export function InternalMessagingHub({
  apiBase = 'http://localhost:3001',
  authToken,
  currentUserId = 'u1',
  currentUserName = 'You'
}: InternalMessagingHubProps) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Dropdowns
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [newChatSubject, setNewChatSubject] = useState('');
  
  // Custom contacts lists
  const [contacts, setContacts] = useState<TeamMember[]>([
    { id: 'c1', full_name: 'Stark Industries (Tony Stark)', email: 'tony@stark.com', role: 'client_manager', is_client: true },
    { id: 'c2', full_name: 'Wayne Enterprises (Bruce Wayne)', email: 'bruce@wayne.com', role: 'client_manager', is_client: true },
    { id: 'c3', full_name: 'Acme Corp (Wile E. Coyote)', email: 'wile@acme.com', role: 'client_staff', is_client: true },
    { id: 't1', full_name: 'Sarah Jenkins', email: 'sarah@eac.local', role: 'senior_accountant', is_client: false },
    { id: 't2', full_name: 'David Patel', email: 'david@eac.local', role: 'junior_accountant', is_client: false },
    { id: 't3', full_name: 'Elena Rostova', email: 'elena@eac.local', role: 'admin', is_client: false }
  ]);
  const [selectedContactId, setSelectedContactId] = useState('');

  // Zoom scheduling
  const [zoomTopic, setZoomTopic] = useState('Client Consultation');
  const [zoomDateTime, setZoomDateTime] = useState('');

  // File Upload Attachment State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: number }[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Build offline seeds
  const seedMockData = () => {
    const mockThreads: MessageThread[] = [
      {
        id: 'thread_1',
        subject: 'Stark Industries Q2 Financial Statement Review',
        tenant_id: 'tenant_stark',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        participants: [
          { user_id: 'c1', user: { id: 'c1', full_name: 'Tony Stark', email: 'tony@stark.com', role: 'client_manager' } },
          { user_id: 'u1', user: { id: 'u1', full_name: 'Specialist', email: 'accountant@eac.local', role: 'senior_accountant' } }
        ]
      },
      {
        id: 'thread_2',
        subject: 'Tax Filing Deductions Audit - Wayne Enterprises',
        tenant_id: 'tenant_wayne',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        participants: [
          { user_id: 'c2', user: { id: 'c2', full_name: 'Bruce Wayne', email: 'bruce@wayne.com', role: 'client_manager' } },
          { user_id: 'u1', user: { id: 'u1', full_name: 'Specialist', email: 'accountant@eac.local', role: 'senior_accountant' } }
        ]
      }
    ];
    setThreads(mockThreads);
    setSelectedThread(mockThreads[0]);

    setMessages([
      {
        id: 'msg_1',
        thread_id: 'thread_1',
        sender_id: 'c1',
        content: 'Hi! Did you review our travel expense reports for Q2? Some charges seem categorized incorrectly.',
        created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        sender: { id: 'c1', full_name: 'Tony Stark' }
      },
      {
        id: 'msg_2',
        thread_id: 'thread_1',
        sender_id: 'u1',
        content: 'Hello Tony, yes, I am currently audits of travel accounts. I reclassified several items to matching internal corporate brackets.',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        sender: { id: 'u1', full_name: 'Specialist' }
      }
    ]);
  };

  useEffect(() => {
    seedMockData();
  }, []);

  useEffect(() => {
    if (selectedThread) {
      setTimeout(scrollToBottom, 100);
    }
  }, [selectedThread?.id, messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() && attachedFiles.length === 0) return;

    let content = messageInput.trim();
    if (attachedFiles.length > 0) {
      content += `\n\n📎 Attached files:\n` + attachedFiles.map(f => `${f.name} (${(f.size / 1024).toFixed(1)} KB)`).join('\n');
    }

    const newMsg: Message = {
      id: 'msg_' + Math.random().toString(36).substring(7),
      thread_id: selectedThread?.id || 'thread_1',
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
      sender: { id: currentUserId, full_name: currentUserName }
    };

    setMessages(prev => [...prev, newMsg]);
    setMessageInput('');
    setAttachedFiles([]);
    setTimeout(scrollToBottom, 50);
  };

  const handleScheduleZoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoomDateTime) return;

    const zoomLink = `https://zoom.us/j/${Math.floor(100000000 + Math.random() * 900000000)}`;
    const newMsg: Message = {
      id: 'msg_' + Math.random().toString(36).substring(7),
      thread_id: selectedThread?.id || 'thread_1',
      sender_id: currentUserId,
      content: `Scheduled a Zoom Video Consultation: "${zoomTopic}"`,
      is_zoom_card: true,
      zoom_time: new Date(zoomDateTime).toLocaleString(),
      zoom_url: zoomLink,
      created_at: new Date().toISOString(),
      sender: { id: currentUserId, full_name: currentUserName }
    };

    setMessages(prev => [...prev, newMsg]);
    setShowZoomModal(false);
    setZoomDateTime('');
    setTimeout(scrollToBottom, 50);
  };

  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatSubject.trim() || !selectedContactId) return;

    const contact = contacts.find(c => c.id === selectedContactId);
    if (!contact) return;

    const newThread: MessageThread = {
      id: 'thread_' + Math.random().toString(36).substring(7),
      subject: newChatSubject,
      tenant_id: 'tenant_custom',
      created_at: new Date().toISOString(),
      participants: [
        { user_id: selectedContactId, user: { id: selectedContactId, full_name: contact.full_name, email: contact.email, role: contact.role } },
        { user_id: currentUserId, user: { id: currentUserId, full_name: currentUserName, email: 'user@eac.local', role: 'senior_accountant' } }
      ]
    };

    setThreads(prev => [newThread, ...prev]);
    setSelectedThread(newThread);
    setMessages([
      {
        id: 'msg_welcome',
        thread_id: newThread.id,
        sender_id: currentUserId,
        content: `Started workspace channel for: ${newChatSubject}. Ready for direct consultant dispatch.`,
        created_at: new Date().toISOString(),
        sender: { id: currentUserId, full_name: currentUserName }
      }
    ]);

    setShowNewChatModal(false);
    setNewChatSubject('');
    setSelectedContactId('');
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const arr = Array.from(files).map(f => ({ name: f.name, size: f.size }));
      setAttachedFiles(prev => [...prev, ...arr]);
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const filteredThreads = threads.filter(t =>
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: '620px', background: 'var(--card-bg)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
      
      {/* Sidebar: Chat navigation resembling Google Chat */}
      <div style={{ width: '280px', borderRight: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', background: 'var(--surface-color)' }}>
        
        {/* Search & Actions */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Chat Workspace</span>
            <button 
              onClick={() => setShowNewChatModal(true)}
              style={{ padding: '0.35rem 0.65rem', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <PlusCircle size={14} /> New Chat
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card-bg)', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search chat channels..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', width: '100%' }}
            />
          </div>
        </div>

        {/* Channels / Threads list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          
          {/* CLIENT CHANNELS */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ padding: '0 0.5rem 0.25rem', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Direct Client Portals
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {filteredThreads.map(t => {
                const isActive = selectedThread?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => { setSelectedThread(t); setShowNewChatModal(false); }}
                    style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: isActive ? 'rgba(181,138,43,0.1)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                    className="table-row-hover"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ position: 'relative' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary-color)' }} />
                        <span style={{ position: 'absolute', bottom: -2, right: -2, width: 6, height: 6, borderRadius: '50%', background: '#10b981', border: '1px solid #fff' }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: isActive ? 'bold' : 'normal', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                        {t.subject}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TEAM MEMBERS DIRECT CHAT */}
          <div>
            <div style={{ padding: '0 0.5rem 0.25rem', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Specialist Colleagues
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {contacts.filter(c => !c.is_client).map(c => (
                <div
                  key={c.id}
                  onClick={() => {
                    // Start or switch to a direct teammate thread
                    setNewChatSubject(`Internal Chat with ${c.full_name}`);
                    setSelectedContactId(c.id);
                    setShowNewChatModal(true);
                  }}
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  className="table-row-hover"
                >
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold', color: '#0f172a' }}>
                      {c.full_name[0]}
                    </div>
                    <span style={{ position: 'absolute', bottom: 0, right: 0, width: 6, height: 6, borderRadius: '50%', background: '#10b981', border: '1px solid #fff' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{c.full_name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{c.role.replace('_', ' ')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Main Chat Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--card-bg)' }}>
        {selectedThread ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', margin: 0, color: 'var(--text-primary)' }}>{selectedThread.subject}</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Continuous secure link with dedicated clients & stakeholders</span>
              </div>

              <button
                onClick={() => setShowZoomModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                <Video size={16} /> Schedule Zoom
              </button>
            </div>

            {/* Message Stream */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {messages.map((m) => {
                const isMe = m.sender_id === currentUserId;
                return (
                  <div key={m.id} style={{ display: 'flex', gap: '0.75rem', alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                    
                    {/* User initial avatar */}
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: isMe ? 'var(--primary-color)' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0 }}>
                      {m.sender.full_name[0]}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{m.sender.full_name}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Content block or Zoom Card */}
                      {m.is_zoom_card ? (
                        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '280px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Video size={16} style={{ color: '#10b981' }} /> Video Consultation Booked
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-sec)' }}>{m.content}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Date: {m.zoom_time}</span>
                          <a href={m.zoom_url} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', background: '#10b981', color: '#fff', textDecoration: 'none', padding: '0.4rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
                            Join Zoom Meeting
                          </a>
                        </div>
                      ) : (
                        <div style={{ background: isMe ? 'rgba(10,29,55,0.06)' : 'var(--surface-color)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                          {m.content}
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* File attachments preview */}
            {attachedFiles.length > 0 && (
              <div style={{ padding: '0.5rem 1.5rem', background: 'var(--surface-color)', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {attachedFiles.map((file, idx) => (
                  <div key={idx} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem' }}>
                    <FileText size={12} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-primary)' }}>{file.name}</span>
                    <button onClick={() => removeAttachedFile(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red', fontWeight: 'bold' }}>×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileAttachment} 
                multiple 
                style={{ display: 'none' }} 
              />
              <button
                type="button"
                onClick={triggerFileSelect}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                title="Attach Document"
              >
                <Link size={18} />
              </button>

              <input 
                type="text" 
                placeholder="Message direct client workspace... (press Enter to send)" 
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
              />

              <button
                type="submit"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 35, height: 35, borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '1rem' }}>
            <User size={48} style={{ opacity: 0.3 }} />
            <span>Select or start a chat to communicate with clients</span>
          </div>
        )}
      </div>

      {/* MODAL 1: Create Custom Chat Thread */}
      {showNewChatModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '1.5rem', borderRadius: '8px', width: '380px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Start Channel</h4>
              <button onClick={() => setShowNewChatModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
            </div>
            
            <form onSubmit={handleCreateThread} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-sec)', display: 'block', marginBottom: '0.25rem' }}>Channel Subject</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Q2 Bookkeeping Sync"
                  value={newChatSubject}
                  onChange={e => setNewChatSubject(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-sec)', display: 'block', marginBottom: '0.25rem' }}>Select Client / Specialist</label>
                <select
                  required
                  value={selectedContactId}
                  onChange={e => setSelectedContactId(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                >
                  <option value="">-- Choose Connection --</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.role.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>

              <button type="submit" style={{ padding: '0.5rem', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Open Workspace Connection
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Schedule Zoom Call */}
      {showZoomModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '1.5rem', borderRadius: '8px', width: '380px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Video size={16} /> Schedule Consultation</h4>
              <button onClick={() => setShowZoomModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
            </div>

            <form onSubmit={handleScheduleZoom} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-sec)', display: 'block', marginBottom: '0.25rem' }}>Meeting Topic</label>
                <input 
                  type="text" 
                  value={zoomTopic}
                  onChange={e => setZoomTopic(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-sec)', display: 'block', marginBottom: '0.25rem' }}>Date & Time</label>
                <input 
                  type="datetime-local" 
                  required
                  value={zoomDateTime}
                  onChange={e => setZoomDateTime(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <button type="submit" style={{ padding: '0.5rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Generate Zoom Invitation
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default InternalMessagingHub;
