import React, { useState, useEffect, useRef } from 'react';

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
      avatar_url?: string;
    };
  }[];
}

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  attachment_file_ids: string[];
  created_at: string;
  sender: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface InternalMessagingHubProps {
  apiBase?: string;
  authToken?: string;
  currentUserId?: string;
  currentUserName?: string;
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function InternalMessagingHub({
  apiBase = 'http://localhost:3001',
  authToken,
  currentUserId = '',
  currentUserName = 'You'
}: InternalMessagingHubProps) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchThreads = async () => {
    try {
      const res = await fetch(`${apiBase}/api/messages/threads`, { headers });
      if (res.ok) {
        const data = await res.json();
        setThreads(data);
      }
    } catch {}
  };

  const fetchMessages = async (threadId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/messages/threads/${threadId}/messages`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      }
    } catch {}
    setLoading(false);
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch(`${apiBase}/api/users`, { headers });
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data.filter((u: TeamMember) => u.id !== currentUserId));
      }
    } catch {}
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedThread) return;
    setSending(true);
    try {
      const res = await fetch(
        `${apiBase}/api/messages/threads/${selectedThread.id}/messages`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ content: messageInput.trim() })
        }
      );
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setMessageInput('');
        setTimeout(scrollToBottom, 50);
      }
    } catch {}
    setSending(false);
  };

  const createThread = async () => {
    if (!newSubject.trim() || selectedParticipants.length === 0) return;
    try {
      const res = await fetch(`${apiBase}/api/messages/threads`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          subject: newSubject.trim(),
          participant_ids: selectedParticipants
        })
      });
      if (res.ok) {
        const thread = await res.json();
        setThreads(prev => [thread, ...prev]);
        setSelectedThread(thread);
        setMessages([]);
        setShowNewThread(false);
        setNewSubject('');
        setSelectedParticipants([]);
      }
    } catch {}
  };

  useEffect(() => {
    fetchThreads();
    fetchTeamMembers();
    const interval = setInterval(fetchThreads, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.id);
      const interval = setInterval(() => fetchMessages(selectedThread.id), 10000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [selectedThread?.id]);

  const filteredThreads = threads.filter(t =>
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      minHeight: '600px',
      background: 'linear-gradient(135deg, rgba(15,23,42,0.6) 0%, rgba(30,41,59,0.6) 100%)',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden',
      fontFamily: "'Inter', 'Outfit', sans-serif"
    }}>
      {/* LEFT PANEL — Thread List */}
      <div style={{
        width: '300px',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 16px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
              💬 Messages
            </h2>
            <button
              onClick={() => { setShowNewThread(true); setSelectedThread(null); }}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '18px',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700
              }}
              title="New Thread"
            >
              +
            </button>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#f1f5f9',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Thread List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredThreads.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#475569' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>💬</div>
              <p style={{ margin: 0, fontSize: '13px' }}>No conversations yet.</p>
              <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Start one with your team!</p>
            </div>
          ) : (
            filteredThreads.map(thread => {
              const isSelected = selectedThread?.id === thread.id;
              const participantNames = thread.participants
                ?.filter(p => p.user_id !== currentUserId)
                .map(p => p.user?.full_name || 'Unknown')
                .slice(0, 2)
                .join(', ');

              return (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  style={{
                    padding: '14px 16px',
                    cursor: 'pointer',
                    background: isSelected
                      ? 'rgba(99,102,241,0.15)'
                      : 'transparent',
                    borderLeft: isSelected ? '3px solid #6366f1' : '3px solid transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Avatar Group */}
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#fff',
                      flexShrink: 0
                    }}>
                      {thread.participants?.length > 2 ? `+${thread.participants.length}` : (participantNames?.[0] || '?')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: 0,
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#f1f5f9',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {thread.subject}
                      </p>
                      <p style={{
                        margin: '2px 0 0',
                        fontSize: '11px',
                        color: '#64748b',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {participantNames || 'No other participants'}
                      </p>
                    </div>
                    <span style={{ fontSize: '10px', color: '#334155', flexShrink: 0 }}>
                      {timeAgo(thread.created_at)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL — Messages */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {showNewThread ? (
          /* New Thread Form */
          <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
                New Conversation
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Start a new message thread with your team
              </p>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                SUBJECT
              </label>
              <input
                type="text"
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                placeholder="What's this about?"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: '#f1f5f9',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                ADD PARTICIPANTS
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {teamMembers.length === 0 ? (
                  <p style={{ color: '#475569', fontSize: '13px' }}>No team members available. Connect to Supabase to load users.</p>
                ) : (
                  teamMembers.map(member => {
                    const isSelected = selectedParticipants.includes(member.id);
                    return (
                      <div
                        key={member.id}
                        onClick={() => {
                          setSelectedParticipants(prev =>
                            isSelected ? prev.filter(id => id !== member.id) : [...prev, member.id]
                          );
                        }}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isSelected ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          background: isSelected ? '#6366f1' : 'rgba(100,116,139,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#fff'
                        }}>
                          {getInitials(member.full_name)}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
                            {member.full_name}
                          </p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                            {member.role}
                          </p>
                        </div>
                        {isSelected && (
                          <span style={{ marginLeft: 'auto', color: '#6366f1', fontSize: '16px' }}>✓</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={createThread}
                disabled={!newSubject.trim() || selectedParticipants.length === 0}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: newSubject.trim() && selectedParticipants.length > 0 ? 'pointer' : 'not-allowed',
                  opacity: newSubject.trim() && selectedParticipants.length > 0 ? 1 : 0.5
                }}
              >
                Start Conversation
              </button>
              <button
                onClick={() => { setShowNewThread(false); setNewSubject(''); setSelectedParticipants([]); }}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#94a3b8',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : selectedThread ? (
          <>
            {/* Thread Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0
              }}>
                💬
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                  {selectedThread.subject}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                  {selectedThread.participants?.length || 0} participants
                  {selectedThread.participants && ` · ${selectedThread.participants.map(p => p.user?.full_name || 'Unknown').join(', ')}`}
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', color: '#475569', paddingTop: '40px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#475569', paddingTop: '60px' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>👋</div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Start the conversation!</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Send the first message below.</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isOwn = msg.sender_id === currentUserId;
                  const showAvatar = i === 0 || messages[i - 1]?.sender_id !== msg.sender_id;

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        justifyContent: isOwn ? 'flex-end' : 'flex-start',
                        gap: '10px',
                        alignItems: 'flex-end'
                      }}
                    >
                      {!isOwn && showAvatar && (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#fff',
                          flexShrink: 0
                        }}>
                          {getInitials(msg.sender?.full_name || 'U')}
                        </div>
                      )}
                      {!isOwn && !showAvatar && <div style={{ width: '32px', flexShrink: 0 }} />}

                      <div style={{ maxWidth: '65%' }}>
                        {showAvatar && !isOwn && (
                          <p style={{ margin: '0 0 4px 4px', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                            {msg.sender?.full_name || 'Unknown'}
                          </p>
                        )}
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                          background: isOwn
                            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                            : 'rgba(255,255,255,0.07)',
                          border: isOwn ? 'none' : '1px solid rgba(255,255,255,0.08)'
                        }}>
                          <p style={{
                            margin: 0,
                            fontSize: '13px',
                            color: '#f1f5f9',
                            lineHeight: '1.5',
                            wordBreak: 'break-word'
                          }}>
                            {msg.content}
                          </p>
                        </div>
                        <p style={{
                          margin: '4px 4px 0',
                          fontSize: '10px',
                          color: '#334155',
                          textAlign: isOwn ? 'right' : 'left'
                        }}>
                          {timeAgo(msg.created_at)}
                        </p>
                      </div>

                      {isOwn && showAvatar && (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#fff',
                          flexShrink: 0
                        }}>
                          {getInitials(currentUserName)}
                        </div>
                      )}
                      {isOwn && !showAvatar && <div style={{ width: '32px', flexShrink: 0 }} />}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-end'
            }}>
              <textarea
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                rows={2}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#f1f5f9',
                  fontSize: '14px',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  lineHeight: '1.5'
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!messageInput.trim() || sending}
                style={{
                  background: messageInput.trim() && !sending
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : 'rgba(255,255,255,0.08)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '20px',
                  width: '48px',
                  height: '48px',
                  cursor: messageInput.trim() && !sending ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                title="Send Message"
              >
                {sending ? '⏳' : '➤'}
              </button>
            </div>
          </>
        ) : (
          /* Empty State */
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#475569',
            gap: '16px'
          }}>
            <div style={{ fontSize: '48px' }}>💬</div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#94a3b8' }}>
                Select a Conversation
              </h3>
              <p style={{ margin: 0, fontSize: '13px' }}>
                Choose a thread from the left, or start a new one.
              </p>
            </div>
            <button
              onClick={() => setShowNewThread(true)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              + New Conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default InternalMessagingHub;
