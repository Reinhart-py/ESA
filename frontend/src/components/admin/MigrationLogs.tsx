import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.ts';
import { Layers, CheckCircle, RefreshCw } from 'lucide-react';

interface Migration {
  id: string;
  version: string;
  name: string;
  applied_at: string;
}

export default function MigrationLogs() {
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMigrations = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/migrations');
      setMigrations(res.data || []);
    } catch (err) {
      console.error('Failed to load migration logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMigrations();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800 }}>Database Migration Logs</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>Audit trail documenting database schema upgrade histories, table patches, and indexes build history.</p>
        </div>
        <button
          onClick={fetchMigrations}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Reload history
        </button>
      </div>

      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: '#94a3b8' }}>
            <RefreshCw size={24} className="animate-spin" />
          </div>
        ) : migrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            No migrations found. The database schema matches base specifications.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', color: '#94a3b8', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem' }}>Version Indicator</th>
                <th style={{ padding: '0.75rem' }}>Migration Name / Description</th>
                <th style={{ padding: '0.75rem' }}>Applied Timestamp</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {migrations.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', color: '#e2e8f0', fontSize: '0.85rem' }}>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#fff', fontWeight: 'bold' }}>
                    v{m.version}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#e2e8f0' }}>
                    {m.name}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#94a3b8' }}>
                    {new Date(m.applied_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', background: '#10b98120', color: '#10b981', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                      <CheckCircle size={10} /> SUCCESS
                    </span>
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
