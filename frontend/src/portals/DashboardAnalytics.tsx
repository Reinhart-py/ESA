import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client.ts';
import { 
  Database, Activity, Calendar, CheckSquare, DollarSign, 
  TrendingUp, Shield, HelpCircle, Loader2
} from 'lucide-react';

interface AuditLog {
  id: string;
  category: string;
  action: string;
  user_identity: string;
  ip_address: string;
  created_at: string;
}

interface Metrics {
  storageUsedBytes: number;
  storageLimitBytes: number;
  activeObligationsCount: number;
  activeTasksCount: number;
  mrrEstimateCents: number;
  recentLogs: AuditLog[];
}

export default function DashboardAnalytics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchMetrics = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.get('/analytics/metrics');
      setMetrics(res.data || null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to sync dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading && !metrics) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: '#94a3b8' }}>
        <Loader2 size={32} className="animate-spin" style={{ marginRight: '0.5rem', color: '#00a896' }} />
        Compiling live dashboard metrics...
      </div>
    );
  }

  if (!metrics) {
    return <p style={{ color: '#94a3b8' }}>Dashboard metrics unavailable. Ensure backend database matches schema.</p>;
  }

  // Format Helpers
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const storagePercentage = Math.min(100, Math.round((metrics.storageUsedBytes / metrics.storageLimitBytes) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        
        {/* Storage */}
        <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', width: '45px', height: '45px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vault Storage</div>
            <strong style={{ fontSize: '1.2rem', color: '#fff' }}>{formatBytes(metrics.storageUsedBytes)}</strong>
          </div>
        </div>

        {/* Compliance */}
        <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '45px', height: '45px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compliance Obligations</div>
            <strong style={{ fontSize: '1.2rem', color: '#fff' }}>{metrics.activeObligationsCount} Active</strong>
          </div>
        </div>

        {/* Incomplete Tasks */}
        <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: '45px', height: '45px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckSquare size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Task Checklist</div>
            <strong style={{ fontSize: '1.2rem', color: '#fff' }}>{metrics.activeTasksCount} Pending</strong>
          </div>
        </div>

        {/* Monthly Subscription MRR */}
        <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: 'rgba(0, 168, 150, 0.1)', color: '#00a896', width: '45px', height: '45px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan Billing MRR</div>
            <strong style={{ fontSize: '1.2rem', color: '#fff' }}>${(metrics.mrrEstimateCents / 100).toFixed(2)}</strong>
          </div>
        </div>

      </div>

      {/* Storage and Audit Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        
        {/* Storage Bar Graphic */}
        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>Vault Allocation</h3>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
              <span>Used space</span>
              <span>{storagePercentage}% of {formatBytes(metrics.storageLimitBytes)}</span>
            </div>

            {/* Custom progress bar */}
            <div style={{ width: '100%', height: '12px', background: '#0f172a', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${storagePercentage}%`, height: '100%', background: 'linear-gradient(90deg, #00a896, #3b82f6)', borderRadius: '6px' }}></div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Shield size={14} /> Encrypted at rest. Storage auto-scales with billing tier.
          </div>
        </div>

        {/* Audit Logs Table */}
        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} style={{ color: '#00a896' }} /> Live Workspace Audit Trail
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', color: '#94a3b8' }}>
                <th style={{ padding: '0.5rem' }}>Timestamp</th>
                <th>Operator</th>
                <th>Action details</th>
                <th>IP address</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: '#94a3b8', padding: '1rem 0', textAlign: 'center' }}>
                    No audit records logged.
                  </td>
                </tr>
              ) : (
                metrics.recentLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', color: '#cbd5e1' }}>
                    <td style={{ padding: '0.5rem', color: '#64748b' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td>{log.user_identity}</td>
                    <td>{log.action}</td>
                    <td style={{ fontFamily: 'monospace', color: '#64748b' }}>{log.ip_address || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
