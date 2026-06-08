import React, { useState, useEffect, useRef } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'compliance' | 'task' | 'message' | 'document' | 'billing' | 'system' | 'marketplace';
  is_read: boolean;
  reference_id?: string;
  created_at: string;
}

interface NotificationBellProps {
  apiBase?: string;
  authToken?: string;
}

const TYPE_ICONS: Record<string, string> = {
  compliance: '⚖️',
  task: '✅',
  message: '💬',
  document: '📄',
  billing: '💳',
  system: '🔔',
  marketplace: '🏪'
};

const TYPE_COLORS: Record<string, string> = {
  compliance: '#f59e0b',
  task: '#10b981',
  message: '#6366f1',
  document: '#3b82f6',
  billing: '#ef4444',
  system: '#8b5cf6',
  marketplace: '#ec4899'
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell({ apiBase = 'http://localhost:3001', authToken }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/notifications`, { headers });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
      }
    } catch {
      // Network error — backend not yet configured
    }
    setLoading(false);
  };

  const markRead = async (id: string) => {
    try {
      await fetch(`${apiBase}/api/notifications/${id}/read`, { method: 'PATCH', headers });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await fetch(`${apiBase}/api/notifications/mark-all-read`, { method: 'PATCH', headers });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`${apiBase}/api/notifications/${id}`, { method: 'DELETE', headers });
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => {
        const n = notifications.find(x => x.id === id);
        return n && !n.is_read ? Math.max(0, prev - 1) : prev;
      });
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={panelRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
        style={{
          position: 'relative',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '10px',
          width: '40px',
          height: '40px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          transition: 'background 0.2s',
          color: '#fff'
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#ef4444',
            color: '#fff',
            borderRadius: '50%',
            fontSize: '10px',
            fontWeight: 700,
            minWidth: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
            lineHeight: 1
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '48px',
          right: 0,
          width: '380px',
          maxHeight: '520px',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.98) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          zIndex: 9999,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                  {unreadCount} unread
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6366f1',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'background 0.2s'
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔔</div>
                <p style={{ margin: 0, fontSize: '14px' }}>You're all caught up!</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markRead(n.id)}
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: n.is_read ? 'transparent' : 'rgba(99,102,241,0.06)',
                    cursor: n.is_read ? 'default' : 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}
                  onMouseEnter={e => { if (!n.is_read) e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(99,102,241,0.06)'; }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: `${TYPE_COLORS[n.type] || '#6366f1'}20`,
                    border: `1px solid ${TYPE_COLORS[n.type] || '#6366f1'}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    flexShrink: 0
                  }}>
                    {TYPE_ICONS[n.type] || '🔔'}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '8px'
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: '13px',
                        fontWeight: n.is_read ? 500 : 700,
                        color: n.is_read ? '#94a3b8' : '#f1f5f9',
                        lineHeight: '1.4'
                      }}>
                        {n.title}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {!n.is_read && (
                          <div style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: '#6366f1',
                            flexShrink: 0
                          }} />
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); deleteNotification(n.id); }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#475569',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '2px',
                            lineHeight: 1
                          }}
                          title="Dismiss"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <p style={{
                      margin: '3px 0 4px',
                      fontSize: '12px',
                      color: '#64748b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {n.message}
                    </p>
                    <span style={{ fontSize: '11px', color: '#334155' }}>
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              textAlign: 'center'
            }}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#475569',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
