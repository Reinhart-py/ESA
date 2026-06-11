import React, { useState, useEffect } from 'react';
import { Terminal, RefreshCw, Loader2, Database, ShieldAlert, Cpu } from 'lucide-react';
import { apiClient } from '../../api/client.ts';

interface AuditLog {
  id: string;
  user_identity: string;
  action: string;
  category: string;
  details: any;
  ip_address: string;
  created_at: string;
}

export default function ApiRequestHistory() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/developer/api-logs');
      setLogs(res.data || []);
    } catch (err: any) {
      console.error('Failed to load api/developer audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Terminal size={18} style={{ color: '#00a896' }} /> Developer Audit Trails
        </h3>
        <button
          onClick={fetchLogs}
          disabled={loading}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
        Review security access logs, token generation audits, rate limit configurations, and system API setups.
      </p>

      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
          No developer audit events logged.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {logs.map((log) => (
            <div key={log.id} style={{ background: '#0f172a', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(0,168,150,0.15)', color: '#00a896', padding: '0.1rem 0.35rem', borderRadius: '4px', fontFamily: 'monospace' }}>
                    {log.category}
                  </span>
                  <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{log.action}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  <span>Actor: {log.user_identity}</span>
                  <span>IP: {log.ip_address || 'Internal'}</span>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {new Date(log.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
