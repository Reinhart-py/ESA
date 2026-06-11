import React, { useState } from 'react';
import { Key, Copy, Check, Trash2, Shield, Settings, Sliders } from 'lucide-react';
import { apiClient } from '../../api/client.ts';

interface ApiKey {
  id: string;
  key_name: string;
  key_prefix: string;
  expires_at: string;
  created_at: string;
}

interface ApiKeyListProps {
  keys: ApiKey[];
  onRevoke: (id: string) => void;
  onRefresh: () => void;
  submitting: boolean;
}

export default function ApiKeyList({ keys, onRevoke, onRefresh, submitting }: ApiKeyListProps) {
  const [selectedKeyForLimit, setSelectedKeyForLimit] = useState<string | null>(null);
  const [rateLimitValue, setRateLimitValue] = useState<number>(60);
  const [updatingLimit, setUpdatingLimit] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const handleSetRateLimit = async (apiKeyId: string) => {
    setUpdatingLimit(true);
    setFeedbackMsg('');
    try {
      await apiClient.post('/developer/rate-limits', {
        apiKeyId,
        maxRequestsPerMinute: rateLimitValue
      });
      setFeedbackMsg('Rate limit updated successfully.');
      setSelectedKeyForLimit(null);
      onRefresh();
    } catch (err: any) {
      setFeedbackMsg(err.response?.data?.error || 'Failed to update rate limit.');
    } finally {
      setUpdatingLimit(false);
      setTimeout(() => setFeedbackMsg(''), 3000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {feedbackMsg && (
        <div style={{ background: 'rgba(0, 168, 150, 0.1)', color: '#00a896', border: '1px solid rgba(0, 168, 150, 0.2)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
          {feedbackMsg}
        </div>
      )}

      {keys.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', background: '#0f172a', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
          <Shield size={36} style={{ color: '#64748b', marginBottom: '0.5rem' }} />
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>No active API integration keys exist.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {keys.map((k) => (
            <div key={k.id} style={{ background: '#0f172a', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{k.key_name}</strong>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(0,168,150,0.15)', color: '#00a896', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                      Active
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace', marginTop: '0.25rem' }}>
                    {k.key_prefix}******************
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setSelectedKeyForLimit(selectedKeyForLimit === k.id ? null : k.id);
                      setRateLimitValue(60);
                    }}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.4rem' }}
                    title="Configure Limits"
                  >
                    <Sliders size={16} />
                  </button>
                  <button
                    onClick={() => onRevoke(k.id)}
                    disabled={submitting}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem' }}
                    title="Revoke Key"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {selectedKeyForLimit === k.id && (
                <div style={{ background: '#1e293b', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>Update Rate Limits:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={rateLimitValue}
                      onChange={(e) => setRateLimitValue(parseInt(e.target.value) || 60)}
                      style={{ width: '80px', padding: '0.35rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.85rem' }}
                    />
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>req / minute</span>
                    <button
                      onClick={() => handleSetRateLimit(k.id)}
                      disabled={updatingLimit}
                      style={{ marginLeft: 'auto', padding: '0.35rem 0.75rem', background: '#00a896', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      {updatingLimit ? 'Saving...' : 'Apply'}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '0.5rem' }}>
                <span>Created: {new Date(k.created_at).toLocaleDateString()}</span>
                <span>Expires: {k.expires_at ? new Date(k.expires_at).toLocaleDateString() : 'Never'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
