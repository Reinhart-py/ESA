import React, { useState } from 'react';
import { Radio, Plus, Trash2, ShieldCheck, Play, Globe } from 'lucide-react';

interface WebhookConfig {
  id: string;
  url: string;
  secret: string;
  is_active: boolean;
  created_at: string;
}

interface WebhookListProps {
  hooks: WebhookConfig[];
  onDelete: (id: string) => void;
  onCreate: (url: string, secret: string) => Promise<void>;
  onTriggerTest: (hook: WebhookConfig) => void;
  submitting: boolean;
}

export default function WebhookList({ hooks, onDelete, onCreate, onTriggerTest, submitting }: WebhookListProps) {
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !secret.trim()) return;
    await onCreate(url, secret);
    setUrl('');
    setSecret('');
    setFormOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Radio size={18} style={{ color: '#3b82f6' }} /> Registered Endpoints
        </h3>
        <button
          onClick={() => setFormOpen(!formOpen)}
          style={{ padding: '0.4rem 0.8rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
        >
          <Plus size={14} /> Add Endpoint
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} style={{ background: '#1e293b', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Webhook Destination URL</label>
            <input
              type="url"
              placeholder="https://api.yourdomain.com/webhooks/receiver"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>HMAC Signature Secret Key</label>
            <input
              type="text"
              placeholder="Minimum 8 characters for token signatures verification"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              required
              minLength={8}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              style={{ padding: '0.4rem 0.8rem', background: 'none', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '0.4rem 0.8rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              {submitting ? 'Registering...' : 'Register Endpoint'}
            </button>
          </div>
        </form>
      )}

      {hooks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', background: '#0f172a', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
          <Globe size={36} style={{ color: '#64748b', marginBottom: '0.5rem' }} />
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>No webhook streams registered.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {hooks.map((h) => (
            <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '1rem', flex: 1 }}>
                <div style={{ color: '#fff', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' }}>
                  {h.url}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#00a896', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ShieldCheck size={12} /> HMAC Signature Enabled
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    Created: {new Date(h.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => onTriggerTest(h)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                  title="Send Test Payload"
                >
                  <Play size={12} /> Test
                </button>
                <button
                  onClick={() => onDelete(h.id)}
                  disabled={submitting}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.35rem' }}
                  title="Remove Endpoint"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
