import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.ts';
import { Activity, RefreshCw, Cpu, Database, Server, Clock } from 'lucide-react';

interface TelemetryPoint {
  id: string;
  cpu_usage: number;
  memory_usage_bytes: number;
  request_count: number;
  error_count: number;
  latency_ms_avg: number;
  timestamp: string;
}

interface HealthData {
  status: string;
  database: string;
  dbLatencyMs: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
  uptimeSeconds: number;
}

export default function SystemTelemetry() {
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTelemetry = async () => {
    try {
      const res = await apiClient.get('/admin/telemetry/traffic');
      setTelemetryHistory(res.data || []);
    } catch (err) {
      console.error('Failed to fetch telemetry history:', err);
    }
  };

  const checkHealth = async () => {
    setRefreshing(true);
    try {
      const res = await apiClient.get('/admin/telemetry/health');
      setHealth(res.data);
      await fetchTelemetry();
    } catch (err) {
      console.error('Failed to run health check:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTelemetry(), checkHealth()]).finally(() => setLoading(false));
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor((seconds % (3600*24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  // Helper to render custom premium SVG sparklines
  const renderSvgChart = (dataPoints: number[], color: string, title: string, suffix: string = '') => {
    if (dataPoints.length === 0) return null;
    const maxVal = Math.max(...dataPoints, 1);
    const minVal = Math.min(...dataPoints, 0);
    const range = maxVal - minVal;
    const width = 500;
    const height = 150;
    const padding = 20;

    const points = dataPoints.reverse().map((val, idx) => {
      const x = padding + (idx / (dataPoints.length - 1 || 1)) * (width - padding * 2);
      const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
      return { x, y, val };
    });

    const pathD = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaD = points.length > 0 
      ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` 
      : '';

    return (
      <div style={{ flex: 1, minWidth: '300px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>{title}</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
            {dataPoints[0].toFixed(1)}{suffix}
          </span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', overflow: 'visible' }}>
          <defs>
            <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
              <stop offset="100%" stopColor={color} stopOpacity="0"/>
            </linearGradient>
          </defs>
          {/* Horizontal lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
          <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" />

          {/* Area under the line */}
          <path d={areaD} fill={`url(#grad-${title.replace(/\s+/g, '')})`} />
          
          {/* Line itself */}
          <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Draw dots */}
          {points.map((p, idx) => (
            <circle 
              key={idx} 
              cx={p.x} 
              cy={p.y} 
              r={idx === points.length - 1 ? 5 : 2} 
              fill={idx === points.length - 1 ? color : '#fff'} 
              stroke={idx === points.length - 1 ? '#fff' : color}
              strokeWidth="1.5"
            />
          ))}
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem', alignItems: 'center', gap: '0.75rem', color: '#94a3b8' }}>
        <RefreshCw className="animate-spin" size={24} /> Loading platform diagnostic telemetry...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800 }}>Platform Diagnostics & Telemetry</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>Real-time telemetry, server resource utilization, and health metrics.</p>
        </div>
        <button
          onClick={checkHealth}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(59, 130, 246, 0.1)',
            color: '#3b82f6',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Testing...' : 'Trigger Diagnostics'}
        </button>
      </div>

      {/* Health Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: health?.status === 'HEALTHY' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: health?.status === 'HEALTHY' ? '#10b981' : '#ef4444', padding: '0.75rem', borderRadius: '8px' }}>
            <Server size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>SYSTEM HEALTH RATIO</span>
            <h3 style={{ margin: '0.15rem 0 0 0', fontSize: '1.4rem', color: health?.status === 'HEALTHY' ? '#10b981' : '#ef4444', fontWeight: 800 }}>
              {health?.status || 'UNKNOWN'}
            </h3>
          </div>
        </div>

        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.75rem', borderRadius: '8px' }}>
            <Database size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>DATABASE CONNECTION</span>
            <h3 style={{ margin: '0.15rem 0 0 0', fontSize: '1.4rem', color: '#fff', fontWeight: 800 }}>
              {health?.database || 'DISCONNECTED'}
            </h3>
          </div>
        </div>

        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '0.75rem', borderRadius: '8px' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>DATABASE LATENCY</span>
            <h3 style={{ margin: '0.15rem 0 0 0', fontSize: '1.4rem', color: '#fff', fontWeight: 800 }}>
              {health?.dbLatencyMs || 0} ms
            </h3>
          </div>
        </div>

        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '0.75rem', borderRadius: '8px' }}>
            <Activity size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>UPTIME</span>
            <h3 style={{ margin: '0.15rem 0 0 0', fontSize: '1.4rem', color: '#fff', fontWeight: 800 }}>
              {health?.uptimeSeconds ? formatUptime(health.uptimeSeconds) : '0s'}
            </h3>
          </div>
        </div>
      </div>

      {/* SVG Charts Area */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
        {renderSvgChart(
          telemetryHistory.map(p => p.cpu_usage),
          '#10b981',
          'CPU Resource Utilization',
          '%'
        )}
        {renderSvgChart(
          telemetryHistory.map(p => p.memory_usage_bytes / 1024 / 1024),
          '#3b82f6',
          'Process Memory Allocation (Heap)',
          ' MB'
        )}
      </div>

      {/* Detailed Diagnostics Info */}
      <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', fontWeight: 'bold', fontSize: '1rem', color: '#fff' }}>Detailed Infrastructure Specifications</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Resident Set Size (RSS)</span>
            <strong style={{ fontSize: '0.95rem', color: '#e2e8f0' }}>{health?.memoryUsage?.rss ? formatBytes(health.memoryUsage.rss) : 'N/A'}</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Memory Heap Total</span>
            <strong style={{ fontSize: '0.95rem', color: '#e2e8f0' }}>{health?.memoryUsage?.heapTotal ? formatBytes(health.memoryUsage.heapTotal) : 'N/A'}</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Memory Heap Used</span>
            <strong style={{ fontSize: '0.95rem', color: '#e2e8f0' }}>{health?.memoryUsage?.heapUsed ? formatBytes(health.memoryUsage.heapUsed) : 'N/A'}</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Average API Latency</span>
            <strong style={{ fontSize: '0.95rem', color: '#e2e8f0' }}>
              {telemetryHistory.length > 0 
                ? (telemetryHistory.reduce((acc, p) => acc + p.latency_ms_avg, 0) / telemetryHistory.length).toFixed(1)
                : 0} ms
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
