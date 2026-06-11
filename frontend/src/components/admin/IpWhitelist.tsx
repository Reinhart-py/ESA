import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client.ts';
import { Globe, PlusCircle, Trash2, RefreshCw } from 'lucide-react';

interface IpEntry {
  id: string;
  ip_address: string;
  description: string;
  created_at: string;
}

export default function IpWhitelist() {
  const [ips, setIps] = useState<IpEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [description, setDescription] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchIps = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/ip-whitelist');
      setIps(res.data || []);
    } catch (err) {
      console.error('Failed to load whitelisted IPs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIps();
  }, []);

  const handleAddIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipAddress.trim()) return;
    setAdding(true);
    try {
      await apiClient.post('/admin/ip-whitelist', {
        ip_address: ipAddress,
        description
      });
      setIpAddress('');
      setDescription('');
      await fetchIps();
    } catch (err) {
      console.error('Failed to add IP:', err);
      alert('Failed to register IP in whitelists catalog.');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteIp = async (id: string) => {
    if (!window.confirm('Remove this IP address whitelist range? Users on this IP may lose access overrides.')) return;
    try {
      await apiClient.delete(`/admin/ip-whitelist/${id}`);
      await fetchIps();
    } catch (err) {
      console.error('Failed to delete whitelisted IP:', err);
      alert('Failed to remove IP from whitelist catalog.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 800 }}>Admin Route IP Whitelisting</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>Enforce network access constraints restricting super-admin login requests to whitelisted IP blocks.</p>
        </div>
        <button
          onClick={fetchIps}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Reload whitelist
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
        {/* Whitelist table */}
        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: '#94a3b8' }}>
              <RefreshCw size={24} className="animate-spin" />
            </div>
          ) : ips.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              No IP restrictions configured. The platform is accessible globally.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', color: '#94a3b8', fontSize: '0.85rem' }}>
                  <th style={{ padding: '0.75rem' }}>Whitelisted IP Address</th>
                  <th style={{ padding: '0.75rem' }}>Description / Scope</th>
                  <th style={{ padding: '0.75rem' }}>Added Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ips.map(entry => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', color: '#e2e8f0', fontSize: '0.85rem' }}>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#fff', fontWeight: 'bold' }}>
                      🏢 {entry.ip_address}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#e2e8f0' }}>
                      {entry.description || 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#94a3b8' }}>
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteIp(entry.id)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add whitelist record Form */}
        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', height: 'fit-content' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontWeight: 'bold', fontSize: '1rem', color: '#fff' }}>Whitelist Access IP</h3>
          
          <form onSubmit={handleAddIp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>IP Address Range</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. 192.168.1.1 or 0.0.0.0" 
                value={ipAddress}
                onChange={e => setIpAddress(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Scope Description</label>
              <input 
                type="text" 
                placeholder="e.g. Headquarters Office" 
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={adding}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.55rem',
                background: '#b58a2b',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}
            >
              <PlusCircle size={14} /> Whitelist Range
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
