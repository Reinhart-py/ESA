import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client.ts';
import { 
  Key, Radio, Plus, Trash2, Check, Copy, AlertTriangle, 
  Terminal, ShieldCheck, RefreshCw, Loader2
} from 'lucide-react';

interface ApiKey {
  id: string;
  key_name: string;
  key_prefix: string;
  expires_at: string;
  created_at: string;
}

interface WebhookConfig {
  id: string;
  url: string;
  secret: string;
  is_active: boolean;
  created_at: string;
}

export default function DeveloperSettings() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [hooks, setHooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Key form
  const [keyName, setKeyName] = useState('');
  const [newKeyDetails, setNewKeyDetails] = useState<{ key: string; expiresAt: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Webhook form
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  const loadDeveloperData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [keysRes, hooksRes] = await Promise.all([
        apiClient.get('/developer/keys'),
        apiClient.get('/developer/webhooks')
      ]);
      setKeys(keysRes.data || []);
      setHooks(hooksRes.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to sync developer settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeveloperData();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    setNewKeyDetails(null);
    try {
      const res = await apiClient.post('/developer/keys', {
        keyName
      });
      setNewKeyDetails({
        key: res.data.apiKey,
        expiresAt: res.data.expiresAt
      });
      setKeyName('');
      await loadDeveloperData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to generate API key.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Outbound connections using it will instantly fail.')) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiClient.delete(`/developer/keys/${id}`);
      setSuccessMsg('API key revoked successfully.');
      await loadDeveloperData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to revoke API key.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim() || !webhookSecret.trim()) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiClient.post('/developer/webhooks', {
        url: webhookUrl,
        secret: webhookSecret
      });
      setWebhookUrl('');
      setWebhookSecret('');
      setSuccessMsg('Webhook configuration added successfully.');
      await loadDeveloperData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to configure webhook.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to remove this webhook endpoint? Outbound dispatches will cease.')) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiClient.delete(`/developer/webhooks/${id}`);
      setSuccessMsg('Webhook endpoint deleted.');
      await loadDeveloperData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to delete webhook.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyKey = () => {
    if (!newKeyDetails) return;
    navigator.clipboard.writeText(newKeyDetails.key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
            <Terminal size={24} style={{ color: '#00a896' }} /> Developer Integration Hub
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
            Generate API tokens for custom tools and register webhook URLs for real-time state changes.
          </p>
        </div>
        <button 
          onClick={loadDeveloperData} 
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer' }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Sync Connections
        </button>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Check size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main split grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* API KEYS COMPONENT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={18} style={{ color: '#00a896' }} /> Integration API Keys
            </h3>

            {/* Key creation form */}
            <form onSubmit={handleCreateKey} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                placeholder="Key label, e.g. TaxDomeSync" 
                value={keyName}
                onChange={e => setKeyName(e.target.value)}
                required
                style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff' }}
              />
              <button 
                type="submit" 
                disabled={submitting}
                style={{ padding: '0.6rem 1.2rem', background: '#00a896', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Plus size={16} /> Generate Key
              </button>
            </form>

            {/* Display newly generated key once */}
            {newKeyDetails && (
              <div style={{ background: 'rgba(0,168,150,0.1)', border: '1px solid rgba(0,168,150,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#00a896', fontWeight: 'bold' }}>COPY KEY - ONLY SHOWN ONCE:</span>
                  <button 
                    onClick={handleCopyKey}
                    style={{ background: 'none', border: 'none', color: copiedKey ? '#10b981' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
                  >
                    {copiedKey ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                  </button>
                </div>
                <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.85rem', color: '#fff', background: '#0f172a', padding: '0.5rem', borderRadius: '4px' }}>
                  {newKeyDetails.key}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                  Expires: {new Date(newKeyDetails.expiresAt).toLocaleDateString()}
                </div>
              </div>
            )}

            {/* Active Keys List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {keys.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>No active API keys found.</p>
              ) : (
                keys.map(k => (
                  <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                    <div>
                      <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{k.key_name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                        {k.key_prefix}******************
                      </div>
                    </div>

                    <button 
                      onClick={() => handleRevokeKey(k.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.35rem' }}
                      title="Revoke Key"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* WEBHOOKS COMPONENT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Radio size={18} style={{ color: '#3b82f6' }} /> Outbound Webhook Streams
            </h3>

            {/* Webhook form */}
            <form onSubmit={handleCreateWebhook} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Endpoint URL</label>
                <input 
                  type="url" 
                  placeholder="https://api.yourdomain.com/webhooks" 
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>HMAC Signature Secret Key</label>
                <input 
                  type="text" 
                  placeholder="Minimum 8 characters" 
                  value={webhookSecret}
                  onChange={e => setWebhookSecret(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                style={{ padding: '0.6rem 1.2rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
              >
                <Plus size={16} /> Register Webhook Endpoint
              </button>
            </form>

            {/* Active Webhooks List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {hooks.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>No active webhook endpoints registered.</p>
              ) : (
                hooks.map(h => (
                  <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '1rem' }}>
                      <div style={{ color: '#fff', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {h.url}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#00a896', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                        <ShieldCheck size={12} /> Active HMAC Signature Enabled
                      </span>
                    </div>

                    <button 
                      onClick={() => handleDeleteWebhook(h.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.35rem' }}
                      title="Delete Webhook"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
