import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.ts';
import { Building, PlusCircle, Search, Edit2, ShieldAlert, Check, X, RefreshCw, Eye } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  business_type: string;
  revenue_bracket: string;
  compliance_score: number;
  storage_used_bytes: number;
  storage_limit_bytes: number;
  country: string;
  created_at: string;
  suspension?: {
    id: string;
    reason: string;
    created_at: string;
  };
}

interface TenantManagerProps {
  onImpersonate: (tenantId: string) => void;
  impersonatingId: string;
}

export default function TenantManager({ onImpersonate, impersonatingId }: TenantManagerProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [businessType, setBusinessType] = useState('');

  // Creation states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('LLC');
  const [newCountry, setNewCountry] = useState('US');
  const [newLimitGb, setNewLimitGb] = useState(10);
  const [savingTenant, setSavingTenant] = useState(false);

  // Quota states
  const [editingQuotaId, setEditingQuotaId] = useState<string | null>(null);
  const [newQuotaGb, setNewQuotaGb] = useState(10);

  // Suspension states
  const [suspendingTenantId, setSuspendingTenantId] = useState<string | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspending, setSuspending] = useState(false);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/tenants', {
        params: { search: search || undefined, type: businessType || undefined }
      });
      setTenants(res.data || []);
    } catch (err) {
      console.error('Failed to load tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [search, businessType]);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSavingTenant(true);
    try {
      await apiClient.post('/admin/tenants', {
        name: newName,
        business_type: newType,
        country: newCountry,
        storage_limit_bytes: newLimitGb * 1024 * 1024 * 1024
      });
      setShowCreateModal(false);
      setNewName('');
      setNewLimitGb(10);
      await fetchTenants();
    } catch (err) {
      console.error('Failed to create tenant:', err);
      alert('Failed to register new tenant workspace.');
    } finally {
      setSavingTenant(false);
    }
  };

  const handleUpdateQuota = async (id: string) => {
    try {
      await apiClient.put(`/admin/tenants/${id}`, {
        storage_limit_bytes: newQuotaGb * 1024 * 1024 * 1024
      });
      setEditingQuotaId(null);
      await fetchTenants();
    } catch (err) {
      console.error('Failed to update storage quota:', err);
      alert('Failed to update tenant storage limit.');
    }
  };

  const handleSuspendTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendingTenantId || !suspensionReason.trim()) return;
    setSuspending(true);
    try {
      await apiClient.post(`/admin/tenants/${suspendingTenantId}/suspend`, {
        reason: suspensionReason
      });
      setSuspendingTenantId(null);
      setSuspensionReason('');
      await fetchTenants();
    } catch (err) {
      console.error('Failed to suspend tenant:', err);
      alert('Failed to suspend tenant.');
    } finally {
      setSuspending(false);
    }
  };

  const handleUnsuspendTenant = async (id: string) => {
    if (!window.confirm('Are you sure you want to unsuspend this tenant? All users will regain workspace access.')) return;
    try {
      await apiClient.post(`/admin/tenants/${id}/unsuspend`);
      await fetchTenants();
    } catch (err) {
      console.error('Failed to unsuspend tenant:', err);
      alert('Failed to restore tenant access.');
    }
  };

  const formatBytes = (bytes: number) => {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800 }}>Client Workspaces Directory</h2>
          <p style={{ color: 'var(--text-sec)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>Provision new tenants, adjust storage constraints, and manage suspension locks.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: '#b58a2b',
            color: 'var(--text-primary)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          <PlusCircle size={16} /> Onboard Tenant
        </button>
      </div>

      {/* Filters bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search organizations by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '0.55rem 0.55rem 0.55rem 2.25rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-primary)', width: '100%', fontSize: '0.85rem' }}
          />
        </div>
        <select
          value={businessType}
          onChange={e => setBusinessType(e.target.value)}
          style={{ padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-primary)', minWidth: '150px', fontSize: '0.85rem' }}
        >
          <option value="">All Business Types</option>
          <option value="LLC">LLC</option>
          <option value="Corporation">Corporation</option>
          <option value="Partnership">Partnership</option>
        </select>
      </div>

      {/* Table grid */}
      <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-sec)' }}>
            <RefreshCw size={24} className="animate-spin" />
          </div>
        ) : tenants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No tenant workspaces identified matching active search criteria.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--card-border)', textAlign: 'left', color: 'var(--text-sec)', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.75rem' }}>Tenant Details</th>
                <th style={{ padding: '0.75rem' }}>Country</th>
                <th style={{ padding: '0.75rem' }}>Storage Allocated</th>
                <th style={{ padding: '0.75rem' }}>State</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Governance Operations</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(tenant => {
                const isSuspended = !!tenant.suspension;
                return (
                  <tr key={tenant.id} style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{tenant.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tenant.business_type} · ID: {tenant.id.substring(0,8)}...</span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', background: '#3b82f620', color: '#3b82f6', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                        {tenant.country}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {editingQuotaId === tenant.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="number"
                            value={newQuotaGb}
                            onChange={e => setNewQuotaGb(Number(e.target.value))}
                            style={{ width: '70px', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                          />
                          <span style={{ fontSize: '0.8rem' }}>GB</span>
                          <button onClick={() => handleUpdateQuota(tenant.id)} style={{ background: '#10b981', border: 'none', color: 'var(--text-primary)', padding: '0.25rem', borderRadius: '4px', cursor: 'pointer' }}><Check size={14} /></button>
                          <button onClick={() => setEditingQuotaId(null)} style={{ background: '#ef4444', border: 'none', color: 'var(--text-primary)', padding: '0.25rem', borderRadius: '4px', cursor: 'pointer' }}><X size={14} /></button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{formatBytes(tenant.storage_used_bytes)} / {formatBytes(tenant.storage_limit_bytes)}</span>
                          <button
                            onClick={() => {
                              setEditingQuotaId(tenant.id);
                              setNewQuotaGb(Math.floor(tenant.storage_limit_bytes / (1024 * 1024 * 1024)));
                            }}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-sec)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {isSuspended ? (
                        <span style={{ fontSize: '0.75rem', background: '#ef444420', color: '#ef4444', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }} title={`Reason: ${tenant.suspension?.reason}`}>
                          SUSPENDED
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', background: '#10b98120', color: '#10b981', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        {isSuspended ? (
                          <button
                            onClick={() => handleUnsuspendTenant(tenant.id)}
                            style={{ padding: '0.35rem 0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Restore Access
                          </button>
                        ) : (
                          <button
                            onClick={() => setSuspendingTenantId(tenant.id)}
                            style={{ padding: '0.35rem 0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Lock Workspace
                          </button>
                        )}
                        <button
                          onClick={() => onImpersonate(impersonatingId === tenant.id ? '' : tenant.id)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            background: impersonatingId === tenant.id ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                            color: impersonatingId === tenant.id ? '#f59e0b' : '#3b82f6',
                            border: impersonatingId === tenant.id ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(59, 130, 246, 0.2)',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <Eye size={12} />
                          {impersonatingId === tenant.id ? 'Stop Impersonating' : 'Impersonate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Onboard Tenant Modal Overlay */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--card-border)', width: '450px', color: 'var(--text-primary)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 'bold', fontSize: '1.25rem' }}>Onboard Client Workspace</h3>
            
            <form onSubmit={handleCreateTenant} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-sec)' }}>Organization Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Stark Industries" 
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-sec)' }}>Business Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                  >
                    <option value="LLC">LLC</option>
                    <option value="Corporation">Corporation</option>
                    <option value="Partnership">Partnership</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-sec)' }}>Country Jurisdiction</label>
                  <input 
                    type="text" 
                    maxLength={2}
                    required
                    placeholder="US" 
                    value={newCountry}
                    onChange={e => setNewCountry(e.target.value.toUpperCase())}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-sec)' }}>Initial Storage Quota (GB)</label>
                <input 
                  type="number" 
                  required 
                  min={1}
                  value={newLimitGb}
                  onChange={e => setNewLimitGb(Number(e.target.value))}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--card-border)', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingTenant}
                  style={{ padding: '0.5rem 1rem', background: '#b58a2b', border: 'none', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {savingTenant ? 'Provisioning...' : 'Provision Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lock Workspace Modal Overlay */}
      {suspendingTenantId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--card-border)', width: '450px', color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#ef4444', marginBottom: '1rem' }}>
              <ShieldAlert size={20} />
              <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.2rem' }}>Lock Tenant Workspace</h3>
            </div>
            
            <form onSubmit={handleSuspendTenant} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-sec)', lineHeight: 1.5 }}>
                Locking this workspace will suspend all user log-ins and API request gates associated with this tenant immediately.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-sec)' }}>Suspension Reason / Note</label>
                <textarea 
                  required 
                  rows={3}
                  placeholder="e.g. Delinquent account subscription renewal balance unpaid..." 
                  value={suspensionReason}
                  onChange={e => setSuspensionReason(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setSuspendingTenantId(null);
                    setSuspensionReason('');
                  }}
                  style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--card-border)', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={suspending}
                  style={{ padding: '0.5rem 1rem', background: '#ef4444', border: 'none', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {suspending ? 'Locking...' : 'Lock Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
