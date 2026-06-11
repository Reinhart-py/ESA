import React, { useState, useContext } from 'react';
import { Shield, Key, Monitor, ShieldAlert, User } from 'lucide-react';
import { AppContext } from '../../context/AppContext.tsx';
import AuditLogs from './AuditLogs.tsx';
import MfaSetup from './MfaSetup.tsx';
import SessionManager from './SessionManager.tsx';
import IncidentReports from './IncidentReports.tsx';

type SecurityTab = 'profile' | 'audit' | 'mfa' | 'sessions' | 'incidents';

export default function SecurityLayout() {
  const context = useContext(AppContext);
  const [activeTab, setActiveTab] = useState<SecurityTab>('profile');

  const currentUser = context?.currentUser;

  const tabs = [
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'audit', label: 'Audit Logs', icon: Shield },
    { id: 'mfa', label: 'MFA Security', icon: Key },
    { id: 'sessions', label: 'Active Sessions', icon: Monitor },
    { id: 'incidents', label: 'Anomaly Logs', icon: ShieldAlert }
  ] as const;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', width: '100%', paddingBottom: '3rem' }}>
      
      {/* Sidebar navigation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', background: '#1e293b', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', height: 'fit-content' }}>
        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', padding: '0 0.5rem 0.5rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.5rem' }}>
          SECURITY SUITE
        </span>

        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(0,168,150,0.1)' : 'none',
                color: isActive ? '#00a896' : '#94a3b8',
                fontWeight: 'bold',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div>
        {activeTab === 'profile' && (
          <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User style={{ color: '#00a896' }} size={22} /> User Profile Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Full Name</label>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 600, color: '#fff' }}>{currentUser?.full_name || 'EAC User'}</p>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Email Address</label>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 600, color: '#fff' }}>{currentUser?.email || 'user@eacsolutions.com'}</p>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Role Profile</label>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 600, color: '#00a896', textTransform: 'capitalize' }}>
                  {(currentUser?.role || 'Guest').replace('_', ' ')}
                </p>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Organization Workspace ID</label>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 600, color: '#fff', fontFamily: 'monospace' }}>
                  {currentUser?.tenant_id || 'Global Admin Space'}
                </p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'audit' && <AuditLogs />}
        {activeTab === 'mfa' && <MfaSetup />}
        {activeTab === 'sessions' && <SessionManager />}
        {activeTab === 'incidents' && <IncidentReports />}
      </div>

    </div>
  );
}
