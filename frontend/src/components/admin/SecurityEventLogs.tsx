import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.ts';
import { ShieldAlert, Search, RefreshCw, Filter } from 'lucide-react';

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  message: string;
  user_identity: string;
  ip_address: string;
  details: any;
  created_at: string;
}

export default function SecurityEventLogs() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState('');
  const [severity, setSeverity] = useState('');
  const [search, setSearch] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/security-events', {
        params: {
          eventType: eventType || undefined,
          severity: severity || undefined
        }
      });
      setEvents(res.data || []);
    } catch (err) {
      console.error('Failed to load security events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [eventType, severity]);

  const filteredEvents = events.filter(e => 
    e.message.toLowerCase().includes(search.toLowerCase()) || 
    (e.user_identity && e.user_identity.toLowerCase().includes(search.toLowerCase())) ||
    (e.ip_address && e.ip_address.includes(search))
  );

  const getSeverityColor = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      default: return '#94a3b8';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800 }}>Security Incident & Audit Trail Logs</h2>
          <p style={{ color: 'var(--text-sec)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>Immutable ledger tracking RLS exceptions, failed log-ins, session overrides, and key creations.</p>
        </div>
        <button
          onClick={fetchEvents}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-primary)',
            border: '1px solid var(--card-border)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Reload logs
        </button>
      </div>

      {/* Filter panel */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search events by message, triggering email, or IP address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '0.55rem 0.55rem 0.55rem 2.25rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-primary)', width: '100%', fontSize: '0.85rem' }}
          />
        </div>
        
        <select
          value={eventType}
          onChange={e => setEventType(e.target.value)}
          style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-primary)', minWidth: '150px', fontSize: '0.85rem' }}
        >
          <option value="">All Event Types</option>
          <option value="tenant.suspended">Tenant Suspended</option>
          <option value="tenant.unsuspended">Tenant Unsuspended</option>
          <option value="tenant.created">Tenant Created</option>
          <option value="tenant.updated">Tenant Updated</option>
          <option value="auth.failed_login">Failed Logins</option>
          <option value="data.rls_violation">RLS Violations</option>
        </select>

        <select
          value={severity}
          onChange={e => setSeverity(e.target.value)}
          style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-primary)', minWidth: '150px', fontSize: '0.85rem' }}
        >
          <option value="">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Events logs table */}
      <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-sec)' }}>
            <RefreshCw size={24} className="animate-spin" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No security incidents logged.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--card-border)', textAlign: 'left', color: 'var(--text-sec)', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem' }}>Timestamp</th>
                <th style={{ padding: '0.75rem' }}>Severity</th>
                <th style={{ padding: '0.75rem' }}>Event Category</th>
                <th style={{ padding: '0.75rem' }}>Description Message</th>
                <th style={{ padding: '0.75rem' }}>Trigger User</th>
                <th style={{ padding: '0.75rem' }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map(event => (
                <tr key={event.id} style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                  <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', color: 'var(--text-sec)' }}>
                    {new Date(event.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ fontSize: '0.72rem', background: `${getSeverityColor(event.severity)}15`, color: getSeverityColor(event.severity), padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                      {event.severity.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <strong style={{ color: '#b58a2b' }}>{event.event_type}</strong>
                  </td>
                  <td style={{ padding: '0.75rem', lineHeight: 1.4 }}>
                    {event.message}
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-sec)' }}>
                    {event.user_identity || 'Anonymous'}
                  </td>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: 'var(--text-sec)' }}>
                    {event.ip_address || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
