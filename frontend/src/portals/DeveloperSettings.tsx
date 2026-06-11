import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client.ts';
import { 
  Key, Radio, Plus, Trash2, Check, Copy, AlertTriangle, 
  Terminal, ShieldCheck, RefreshCw, Loader2, Blocks, Play
} from 'lucide-react';

// Subcomponents imports
import ApiKeyList from '../components/developer/ApiKeyList.tsx';
import WebhookList from '../components/developer/WebhookList.tsx';
import WebhookLogs from '../components/developer/WebhookLogs.tsx';
import ApiRequestHistory from '../components/developer/ApiRequestHistory.tsx';
import ApiDocumentation from '../components/developer/ApiDocumentation.tsx';
import WebhookTestPanel from '../components/developer/WebhookTestPanel.tsx';
import SdkDownloads from '../components/developer/SdkDownloads.tsx';

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
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks' | 'logs' | 'docs' | 'sdks'>('keys');
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [hooks, setHooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Key form state
  const [keyName, setKeyName] = useState('');
  const [newKeyDetails, setNewKeyDetails] = useState<{ key: string; expiresAt: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Active testing hook state
  const [testingHook, setTestingHook] = useState<WebhookConfig | null>(null);

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

  const handleCreateWebhook = async (url: string, secret: string) => {
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiClient.post('/developer/webhooks', {
        url,
        secret
      });
      setSuccessMsg('Webhook endpoint registered successfully.');
      await loadDeveloperData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to register webhook.');
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

  const tabs = [
    { id: 'keys', label: 'API Keys', icon: Key },
    { id: 'webhooks', label: 'Webhooks Config', icon: Radio },
    { id: 'logs', label: 'Delivery Logs', icon: RefreshCw },
    { id: 'docs', label: 'API Documentation', icon: Terminal },
    { id: 'sdks', label: 'SDK Downloads', icon: Blocks }
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', paddingBottom: '3rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
            <Terminal size={24} style={{ color: '#00a896' }} /> Developer Integration Hub
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
            Configure client APIs access, outbound webhook webform payloads, and query development guides.
          </p>
        </div>
        <button 
          onClick={loadDeveloperData} 
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer' }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Sync Core Context
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                border: '1px solid ' + (isActive ? 'rgba(0,168,150,0.2)' : 'transparent'),
                background: isActive ? 'rgba(0,168,150,0.1)' : 'none',
                color: isActive ? '#00a896' : '#94a3b8',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
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

      {/* Tab Panels */}
      <div style={{ minHeight: '300px' }}>
        {activeTab === 'keys' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={18} style={{ color: '#00a896' }} /> Active API Keys
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                Keys allow external microservices to authenticate requests securely to your workspace. Keep keys private and configure per-key rate limits.
              </p>
              <ApiKeyList 
                keys={keys}
                onRevoke={handleRevokeKey}
                onRefresh={loadDeveloperData}
                submitting={submitting}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus size={18} style={{ color: '#00a896' }} /> Generate Integration Token
                </h3>
                <form onSubmit={handleCreateKey} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input 
                    type="text" 
                    placeholder="Key label, e.g. TaxDomeSync" 
                    value={keyName}
                    onChange={e => setKeyName(e.target.value)}
                    required
                    style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.85rem' }}
                  />
                  <button 
                    type="submit" 
                    disabled={submitting}
                    style={{ padding: '0.6rem 1.2rem', background: '#00a896', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                  >
                    <Plus size={16} /> Generate Key
                  </button>
                </form>

                {newKeyDetails && (
                  <div style={{ background: 'rgba(0,168,150,0.1)', border: '1px solid rgba(0,168,150,0.2)', padding: '1rem', borderRadius: '8px', marginTop: '1.5rem' }}>
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
              </div>
            </div>
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <WebhookList 
                hooks={hooks}
                onDelete={handleDeleteWebhook}
                onCreate={handleCreateWebhook}
                onTriggerTest={(h) => {
                  setTestingHook(h);
                }}
                submitting={submitting}
              />
            </div>

            <div>
              {testingHook ? (
                <WebhookTestPanel 
                  configs={[testingHook]}
                  onRefreshLogs={loadDeveloperData}
                />
              ) : (
                <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color: '#64748b', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '100%' }}>
                  <Play size={32} />
                  <span>Click "Test" on any registered webhook to trigger test dispatches.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <WebhookLogs configs={hooks} />
        )}

        {activeTab === 'docs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Terminal size={18} style={{ color: '#00a896' }} /> Interactive REST API Guides
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
                Explore exact endpoints paths, parameters schemas mapping, and copyable requests snippets in Node.js, Python, or cURL.
              </p>
            </div>
            <ApiDocumentation />
            <ApiRequestHistory />
          </div>
        )}

        {activeTab === 'sdks' && (
          <SdkDownloads />
        )}
      </div>
    </div>
  );
}
