import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader2, Monitor, Globe, LogOut, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../api/client.ts';

interface UserSession {
  id: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  expires_at: string;
  token: string;
}

export default function SessionManager() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/security/sessions');
      setSessions(res.data || []);
    } catch (err) {
      console.error('Failed to load sessions list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (id: string) => {
    if (!confirm('Are you sure you want to terminate this session? The user will be instantly logged out.')) return;
    setRevokingId(id);
    try {
      await apiClient.delete(`/security/sessions/${id}`);
      await fetchSessions();
    } catch (err) {
      console.error('Failed to revoke session:', err);
    } finally {
      setRevokingId(null);
    }
  };

  // Helper to parse user agent string simply
  const getDeviceDetails = (ua: string) => {
    if (!ua) return 'Unknown Client';
    const uaLower = ua.toLowerCase();
    
    let os = 'Unknown OS';
    if (uaLower.includes('windows')) os = 'Windows';
    else if (uaLower.includes('macintosh') || uaLower.includes('mac os')) os = 'macOS';
    else if (uaLower.includes('linux')) os = 'Linux';
    else if (uaLower.includes('android')) os = 'Android';
    else if (uaLower.includes('iphone') || uaLower.includes('ipad')) os = 'iOS';

    let browser = 'Unknown Browser';
    if (uaLower.includes('chrome')) browser = 'Chrome';
    else if (uaLower.includes('safari') && !uaLower.includes('chrome')) browser = 'Safari';
    else if (uaLower.includes('firefox')) browser = 'Firefox';
    else if (uaLower.includes('edge')) browser = 'Edge';

    return `${browser} on ${os}`;
  };

  return (
    <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Monitor size={18} style={{ color: '#00a896' }} /> Active Browser Sessions
        </h3>
        <button
          onClick={fetchSessions}
          disabled={loading}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
        Review and manage browser sessions connected to your account. Terminating a session will revoke its tokens.
      </p>

      {loading && sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto', color: '#00a896' }} />
          Syncing sessions list...
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
          No active sessions retrieved.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sessions.map((s, index) => {
            const isCurrent = index === 0; // The first session is usually the active one or we highlight it
            return (
              <div key={s.id} style={{ background: '#0f172a', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ background: isCurrent ? 'rgba(0,168,150,0.1)' : 'rgba(255,255,255,0.02)', color: isCurrent ? '#00a896' : '#94a3b8', padding: '0.5rem', borderRadius: '50%' }}>
                    <Globe size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{getDeviceDetails(s.user_agent)}</strong>
                      {isCurrent && (
                        <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '0.1rem 0.35rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.15rem', fontWeight: 'bold' }}>
                          <CheckCircle2 size={10} /> Active Session
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                      <span>IP Address: {s.ip_address || '127.0.0.1'}</span>
                      <span>•</span>
                      <span>Connected: {new Date(s.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {!isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(s.id)}
                    disabled={revokingId === s.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'none', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    {revokingId === s.id ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                    Revoke
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
