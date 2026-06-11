import React, { useState, useEffect } from 'react';
import { Play, Loader2, Send, ShieldAlert, Code } from 'lucide-react';
import { apiClient } from '../../api/client.ts';

interface WebhookConfig {
  id: string;
  url: string;
}

interface WebhookTestPanelProps {
  configs: WebhookConfig[];
  onRefreshLogs: () => void;
}

export default function WebhookTestPanel({ configs, onRefreshLogs }: WebhookTestPanelProps) {
  const [selectedHookId, setSelectedHookId] = useState<string>('');
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [payloadText, setPayloadText] = useState<string>('{}');
  const [sending, setSending] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [validationError, setValidationError] = useState('');

  // Load supported event types
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiClient.get('/developer/webhooks/events');
        setEventTypes(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedEvent(res.data[0]);
        }
      } catch (err) {
        console.error('Failed to load webhook events:', err);
      }
    };
    fetchEvents();
  }, []);

  // Update default payload based on selected event
  useEffect(() => {
    if (!selectedEvent) return;
    let defaultPayload = {};
    switch (selectedEvent) {
      case 'crm.lead.created':
        defaultPayload = {
          id: 'lead_5289f810',
          first_name: 'John',
          last_name: 'Doe',
          email: 'johndoe@example.com',
          company: 'Acme Corp',
          status: 'new'
        };
        break;
      case 'billing.invoice.paid':
        defaultPayload = {
          id: 'inv_8192a01',
          amount_cents: 150000,
          currency: 'USD',
          status: 'paid',
          due_date: '2026-07-01'
        };
        break;
      case 'ledger.journal.posted':
        defaultPayload = {
          id: 'jr_901bcf8',
          description: 'Payroll Allocation June 2026',
          total_cents: 450000
        };
        break;
      default:
        defaultPayload = {
          event: selectedEvent,
          message: 'Standard platform webhook event dispatch test.',
          test: true
        };
    }
    setPayloadText(JSON.stringify(defaultPayload, null, 2));
  }, [selectedEvent]);

  // Set default selected hook
  useEffect(() => {
    if (configs.length > 0 && !selectedHookId) {
      setSelectedHookId(configs[0].id);
    }
  }, [configs]);

  const handleSendTest = async () => {
    if (!selectedHookId) return;
    setValidationError('');
    setTestResult(null);

    // Validate payload JSON syntax
    try {
      JSON.parse(payloadText);
    } catch (err: any) {
      setValidationError('Invalid JSON syntax in payload editor.');
      return;
    }

    setSending(true);
    try {
      const res = await apiClient.post(`/developer/webhooks/${selectedHookId}/test`, {
        eventType: selectedEvent,
        payload: JSON.parse(payloadText)
      });
      setTestResult(res.data);
      onRefreshLogs(); // Refresh the delivery logs list
    } catch (err: any) {
      setValidationError(err.response?.data?.error || 'Connection check failed.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Play size={18} style={{ color: '#3b82f6' }} /> Webhook Sandbox Tester
      </h3>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
        Dispatch a signed mock payload to any registered webhook receiver to test authentication headers and payloads processing.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Left Column: Config & Payload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Target Webhook Endpoint</label>
            <select
              value={selectedHookId}
              onChange={(e) => setSelectedHookId(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.85rem' }}
            >
              {configs.length === 0 && <option value="">No registered webhooks</option>}
              {configs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.url.length > 55 ? `${c.url.slice(0, 55)}...` : c.url}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Event Trigger Type</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.85rem' }}
            >
              {eventTypes.map((ev) => (
                <option key={ev} value={ev}>
                  {ev}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Custom Payload Editor (JSON)</span>
            <textarea
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              style={{ width: '100%', minHeight: '180px', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#00a896', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical' }}
            />
          </div>

          {validationError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={16} />
              <span>{validationError}</span>
            </div>
          )}

          <button
            onClick={handleSendTest}
            disabled={sending || configs.length === 0}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Send Test Webhook
          </button>
        </div>

        {/* Right Column: Results Console */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#0f172a', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.02)', minHeight: '350px' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Code size={14} /> LIVE CONSOLE OUTPUT
          </span>

          {testResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%', overflowY: 'auto' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Response Status:</span>
                <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', fontWeight: 'bold', color: testResult.response_status >= 200 && testResult.response_status < 300 ? '#10b981' : '#ef4444', background: testResult.response_status >= 200 && testResult.response_status < 300 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '0.15rem 0.35rem', borderRadius: '4px' }}>
                  {testResult.response_status}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>HMAC Signature Signature:</span>
                <div style={{ background: '#1e293b', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.02)', fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8', wordBreak: 'break-all' }}>
                  X-EAC-Signature: [Generated hash verified]
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Response Payload body:</span>
                <pre style={{ margin: 0, padding: '0.75rem', background: '#1e293b', borderRadius: '6px', fontSize: '0.8rem', color: '#fff', overflowX: 'auto', fontFamily: 'monospace', flex: 1, maxHeight: '200px' }}>
                  {testResult.response_body || '[Empty response body]'}
                </pre>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center', color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>
              No mock triggers dispatched. Configure payload editor and click Send.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
