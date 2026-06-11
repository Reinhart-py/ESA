import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.ts';
import { Users, Eye, EyeOff, Search, RefreshCw, Building, AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  tenant_id: string | null;
  tenants?: {
    name: string;
  };
}

export default function ImpersonatorConsole() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  const originalAdminToken = localStorage.getItem('admin_token');
  const activeImpersonationUserId = localStorage.getItem('impersonated_user_id');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to load system user directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStartImpersonate = async (targetUser: User) => {
    if (!window.confirm(`Initiate session override? You will be logged in as "${targetUser.full_name}" (${targetUser.email}).`)) return;

    try {
      const res = await apiClient.post(`/admin/impersonate/${targetUser.id}`);
      const { token } = res.data;

      // Backup current admin credentials
      const currentToken = localStorage.getItem('token') || '';
      localStorage.setItem('admin_token', currentToken);
      localStorage.setItem('impersonated_user_id', targetUser.id);
      localStorage.setItem('impersonated_user_name', targetUser.full_name);

      // Overwrite active session credentials
      localStorage.setItem('token', token);

      // Reload application
      window.location.href = '/';
    } catch (err) {
      console.error('Failed to switch session:', err);
      alert('Impersonation gateway declined. Check security logs.');
    }
  };

  const handleStopImpersonate = () => {
    if (!originalAdminToken) return;

    // Restore original admin token
    localStorage.setItem('token', originalAdminToken);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('impersonated_user_id');
    localStorage.removeItem('impersonated_user_name');

    // Reload application
    window.location.href = '/';
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800 }}>User Impersonation Console</h2>
          <p style={{ color: 'var(--text-sec)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>Bypass authorization rules to inspect client dashboards and troubleshoot tenant workspaces directly.</p>
        </div>
        
        {originalAdminToken && (
          <button
            onClick={handleStopImpersonate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#ef4444',
              color: 'var(--text-primary)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 'bold'
            }}
          >
            <EyeOff size={14} /> Stop Impersonation
          </button>
        )}
      </div>

      {originalAdminToken && (
        <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={16} /> <span><strong>Active Impersonation Mode:</strong> You are currently logged in as user ID: <code>{activeImpersonationUserId}</code> ({localStorage.getItem('impersonated_user_name')}). All RLS queries and document actions will be performed as this identity.</span>
        </div>
      )}

      {/* Search filters */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search system users by name or email address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '0.55rem 0.55rem 0.55rem 2.25rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-primary)', width: '100%', fontSize: '0.85rem' }}
          />
        </div>
        
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-primary)', minWidth: '150px', fontSize: '0.85rem' }}
        >
          <option value="">All Security Roles</option>
          <option value="client_owner">Client Owner</option>
          <option value="client_staff">Client Staff</option>
          <option value="accountant">Accountant</option>
          <option value="support_agent">Support Agent</option>
        </select>
      </div>

      {/* Directory Grid */}
      <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-sec)' }}>
            <RefreshCw size={24} className="animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No system user accounts matching active filters found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--card-border)', textAlign: 'left', color: 'var(--text-sec)', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem' }}>Full User Identity</th>
                <th style={{ padding: '0.75rem' }}>Email Address</th>
                <th style={{ padding: '0.75rem' }}>Assigned Role</th>
                <th style={{ padding: '0.75rem' }}>Tenant Workspace</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Session Override</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {user.full_name}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {user.email}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-sec)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Building size={14} /> {user.tenants?.name || 'Platform (Super Admin)'}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleStartImpersonate(user)}
                      disabled={activeImpersonationUserId === user.id}
                      style={{
                        padding: '0.35rem 0.75rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Eye size={12} /> Impersonate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
