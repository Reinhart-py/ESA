import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader2, ShieldAlert, Check, AlertTriangle, Eye, ShieldCheck } from 'lucide-react';
import { apiClient } from '../../api/client.ts';

interface IncidentReport {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  status: 'open' | 'resolved' | 'ignored';
  created_at: string;
}

export default function IncidentReports() {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/security/incidents');
      setIncidents(res.data || []);
    } catch (err) {
      console.error('Failed to load incidents list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await apiClient.post(`/security/incidents/${id}/resolve`);
      await fetchIncidents();
    } catch (err) {
      console.error('Failed to resolve incident:', err);
    } finally {
      setResolvingId(null);
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'low': return { bg: 'rgba(100, 116, 139, 0.1)', color: 'var(--text-sec)' };
      case 'medium': return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' };
      case 'high': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
      case 'critical': return { bg: 'rgba(185, 28, 28, 0.25)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)' };
      default: return { bg: 'rgba(100, 116, 139, 0.1)', color: 'var(--text-sec)' };
    }
  };

  return (
    <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={18} style={{ color: '#ef4444' }} /> Security Anomaly logs
        </h3>
        <button
          onClick={fetchIncidents}
          disabled={loading}
          style={{ background: 'none', border: 'none', color: 'var(--text-sec)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>
      <p style={{ color: 'var(--text-sec)', fontSize: '0.85rem', margin: 0 }}>
        Review system alerts raised by active threat-intelligence monitors, brute-force limits checks, and RLS constraint violations.
      </p>

      {loading && incidents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-sec)' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto', color: '#ef4444' }} />
          Loading alerts logs...
        </div>
      ) : incidents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-color)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
          <ShieldCheck size={36} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
          <p style={{ color: '#10b981', fontSize: '0.9rem', margin: 0, fontWeight: 'bold' }}>All Clear. Zero anomalies reported.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {incidents.map((inc) => {
            const sev = getSeverityStyle(inc.severity);
            const isOpen = inc.status === 'open';

            return (
              <div key={inc.id} style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: sev.bg, color: sev.color, fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {inc.severity}
                    </span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{inc.title}</strong>
                  </div>

                  {isOpen ? (
                    <button
                      onClick={() => handleResolve(inc.id)}
                      disabled={resolvingId === inc.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      {resolvingId === inc.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Resolve
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'bold' }}>
                      <Check size={14} /> Resolved
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-sec)', margin: 0 }}>
                  {inc.description}
                </p>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--card-border)', paddingTop: '0.5rem' }}>
                  Reported: {new Date(inc.created_at).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
