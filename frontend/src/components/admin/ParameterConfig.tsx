import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.ts';
import { Settings, Check, X, Edit2, RefreshCw } from 'lucide-react';

interface Parameter {
  key: string;
  value: string;
  description: string;
  updated_at: string;
}

export default function ParameterConfig() {
  const [params, setParams] = useState<Parameter[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingDesc, setEditingDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchParams = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/parameters');
      setParams(res.data || []);
    } catch (err) {
      console.error('Failed to load system parameters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParams();
  }, []);

  const handleUpdateParameter = async (key: string) => {
    setSaving(true);
    try {
      await apiClient.put('/admin/parameters', {
        key,
        value: editingValue,
        description: editingDesc
      });
      setEditingKey(null);
      await fetchParams();
    } catch (err) {
      console.error('Failed to update system parameter:', err);
      alert('Failed to save configuration adjustment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800 }}>Global System Parameters & Constants</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>Configure whitelabel parameters, default rates, CORS allowed domains, and SMTP constants.</p>
        </div>
        <button
          onClick={fetchParams}
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
          Reload settings
        </button>
      </div>

      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: '#94a3b8' }}>
            <RefreshCw size={24} className="animate-spin" />
          </div>
        ) : params.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No system parameters found in database records. Proposing default keys...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', color: '#94a3b8', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem', width: '25%' }}>Parameter Key</th>
                <th style={{ padding: '0.75rem', width: '30%' }}>Value</th>
                <th style={{ padding: '0.75rem', width: '30%' }}>Scope Definition</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', width: '15%' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {params.map(param => (
                <tr key={param.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', color: '#e2e8f0', fontSize: '0.85rem' }}>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#fff', fontWeight: 'bold' }}>
                    {param.key}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {editingKey === param.key ? (
                      <input
                        type="text"
                        value={editingValue}
                        onChange={e => setEditingValue(e.target.value)}
                        style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.85rem' }}
                      />
                    ) : (
                      <span style={{ fontFamily: 'monospace', color: '#3b82f6' }}>{param.value}</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#94a3b8' }}>
                    {editingKey === param.key ? (
                      <input
                        type="text"
                        value={editingDesc}
                        onChange={e => setEditingDesc(e.target.value)}
                        style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.85rem' }}
                      />
                    ) : (
                      param.description
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    {editingKey === param.key ? (
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          disabled={saving}
                          onClick={() => handleUpdateParameter(param.key)}
                          style={{ background: '#10b981', border: 'none', color: '#fff', padding: '0.35rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingKey(null)}
                          style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '0.35rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingKey(param.key);
                          setEditingValue(param.value);
                          setEditingDesc(param.description || '');
                        }}
                        style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: '#3b82f6', padding: '0.35rem 0.65rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Custom Parameters Wizard block */}
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', fontWeight: 'bold', fontSize: '1rem', color: '#fff' }}>Provision New Param / Overrides</h4>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const key = (form.elements.namedItem('paramKey') as HTMLInputElement).value;
            const val = (form.elements.namedItem('paramValue') as HTMLInputElement).value;
            const desc = (form.elements.namedItem('paramDesc') as HTMLInputElement).value;
            
            try {
              await apiClient.put('/admin/parameters', { key, value: val, description: desc });
              form.reset();
              await fetchParams();
            } catch (err) {
              alert('Failed to register custom parameter key.');
            }
          }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Configuration Key</label>
            <input name="paramKey" type="text" required placeholder="e.g. SMTP_OUTBOUND_PORT" style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.85rem' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Parameter Value</label>
            <input name="paramValue" type="text" required placeholder="e.g. 587" style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.85rem' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Scope Definition</label>
            <input name="paramDesc" type="text" required placeholder="e.g. Default mail delivery gateway port" style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.85rem' }} />
          </div>
          <button type="submit" style={{ padding: '0.55rem', background: '#b58a2b', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>
            Create Parameter
          </button>
        </form>
      </div>
    </div>
  );
}
