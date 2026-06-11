import React, { useState, useEffect } from 'react';
import { Radio, RefreshCw, Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '../../api/client.ts';

interface WebhookConfig {
  id: string;
  url: string;
}

interface WebhookDeliveryLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: any;
  response_status: number;
  response_body: string;
  delivered_at: string;
}

interface WebhookLogsProps {
  configs: WebhookConfig[];
}

export default function WebhookLogs({ configs }: WebhookLogsProps) {
  const [selectedHookId, setSelectedHookId] = useState<string>('all');
  const [logs, setLogs] = useState<WebhookDeliveryLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    if (configs.length === 0) return;
    setLoading(true);
    try {
      // If 'all', we fetch logs for each config and combine them, or fetch them sequentially
      const hookId = selectedHookId === 'all' ? configs[0].id : selectedHookId;
      const res = await apiClient.get(`/developer/webhooks/${hookId}/logs`);
      setLogs(res.data || []);
    } catch (err: any) {
      console.error('Failed to load webhook delivery logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedHookId, configs]);

  return (
    <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Radio size={18} style={{ color: '#00a896' }} /> Delivery Logs & History
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

      {/* Filter selector */}
      {configs.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Filter by Webhook:</span>
          <select
            value={selectedHookId}
            onChange={(e) => setSelectedHookId(e.target.value)}
            style={{ padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.8rem' }}
          >
            <option value="all">First Registered Endpoint</option>
            {configs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.url.length > 40 ? `${c.url.slice(0, 40)}...` : c.url}
              </option>
            ))}
          </select>
        </div>
      )}

      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
          No recent delivery logs found. Send a test webhook to populate logs.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {logs.map((log) => {
            const isSuccess = log.response_status >= 200 && log.response_status < 300;
            const isExpanded = expandedLogId === log.id;

            return (
              <div key={log.id} style={{ background: '#0f172a', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)', overflow: 'hidden' }}>
                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isSuccess ? <CheckCircle2 size={16} style={{ color: '#10b981' }} /> : <XCircle size={16} style={{ color: '#ef4444' }} />}
                    <span style={{ fontSize: '0.85rem', color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {log.event_type}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: isSuccess ? '#10b981' : '#ef4444', background: isSuccess ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '0.15rem 0.35rem', borderRadius: '4px', fontFamily: 'monospace' }}>
                      {log.response_status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>{new Date(log.delivered_at).toLocaleTimeString()}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '1rem', background: '#1e293b', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>Payload JSON</span>
                      <pre style={{ margin: 0, padding: '0.5rem', background: '#0f172a', borderRadius: '6px', fontSize: '0.75rem', color: '#00a896', overflowX: 'auto', fontFamily: 'monospace', maxHeight: '150px' }}>
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>Response Body</span>
                      <pre style={{ margin: 0, padding: '0.5rem', background: '#0f172a', borderRadius: '6px', fontSize: '0.75rem', color: isSuccess ? '#94a3b8' : '#ef4444', overflowX: 'auto', fontFamily: 'monospace', maxHeight: '150px' }}>
                        {log.response_body || '[Empty Response]'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
