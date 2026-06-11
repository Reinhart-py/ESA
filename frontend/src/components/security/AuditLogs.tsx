import React, { useState, useEffect } from 'react';
import { Shield, Search, RefreshCw, Loader2, Filter, Download } from 'lucide-react';
import { apiClient } from '../../api/client.ts';

interface AuditLog {
  id: string;
  user_identity: string;
  action: string;
  category: string;
  details: any;
  ip_address: string;
  created_at: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/security/audit-logs');
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const categories = ['all', 'Auth', 'Files', 'CRM', 'Finance', 'Compliance', 'Developer', 'Security', 'AI'];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user_identity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (log.ip_address && log.ip_address.includes(searchQuery));
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const handleExportCSV = () => {
    const headers = 'ID,Timestamp,Actor,Action,Category,IP Address\n';
    const csvContent = filteredLogs.map(l => 
      `"${l.id}","${l.created_at}","${l.user_identity}","${l.action.replace(/"/g, '""')}","${l.category}","${l.ip_address || ''}"`
    ).join('\n');
    
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={20} style={{ color: 'var(--accent-color)' }} /> Platform Audit Trails
        </h3>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--card-border)', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', background: 'none', color: 'var(--text-sec)', border: '1px solid var(--card-border)', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Sync Logs
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by actor email, action, or client IP..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: '100%', padding: '0.55rem 0.55rem 0.55rem 2.2rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem 0.5rem' }}>Timestamp</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Actor</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Category</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Action</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-sec)' }}>
                  <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto', color: 'var(--accent-color)' }} />
                  Loading audit database...
                </td>
              </tr>
            ) : paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No audit logs found matching criteria.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--card-border)', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-sec)' }}>{new Date(l.created_at).toLocaleString()}</td>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>{l.user_identity}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(0,168,150,0.1)', color: 'var(--accent-color)', fontFamily: 'monospace' }}>
                      {l.category}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{l.action}</td>
                  <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace', color: 'var(--text-sec)' }}>{l.ip_address || 'Internal'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{ padding: '0.35rem 0.75rem', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--card-border)', borderRadius: '4px', cursor: 'pointer' }}
            >
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{ padding: '0.35rem 0.75rem', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--card-border)', borderRadius: '4px', cursor: 'pointer' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
