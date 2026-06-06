import React, { useContext, useState } from 'react';
import { AppContext } from './context/AppContext';
import MarketingHub from './marketing/MarketingHub';
import ClientPortal from './portals/ClientPortal';
import AccountantPortal from './portals/AccountantPortal';
import AdminPortal from './portals/AdminPortal';
import { Users, Info } from 'lucide-react';

function App() {
  const { userRole, setUserRole } = useContext(AppContext);
  const [showPersonaInfo, setShowPersonaInfo] = useState(true);

  // Render proper view based on active role
  const renderView = () => {
    switch (userRole) {
      case 'client':
        return <ClientPortal onLogout={() => setUserRole('guest')} />;
      case 'accountant':
        return <AccountantPortal onLogout={() => setUserRole('guest')} />;
      case 'admin':
        return <AdminPortal onLogout={() => setUserRole('guest')} />;
      case 'guest':
      default:
        return <MarketingHub onLogin={() => setUserRole('client')} />;
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Floating Demo Persona Switcher for Evaluation */}
      <div style={{ 
        position: 'fixed', 
        bottom: '20px', 
        right: '20px', 
        background: '#0B192C', 
        color: '#fff', 
        padding: '1rem', 
        borderRadius: '12px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)', 
        zIndex: 10000,
        width: '320px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h4 style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '0.9rem' }}>
            <Users size={16} /> Demo Role Sandbox
          </h4>
          <button style={{ color: '#00A896', fontSize: '0.75rem' }} onClick={() => setShowPersonaInfo(!showPersonaInfo)}>
            {showPersonaInfo ? 'Hide Guide' : 'Show Guide'}
          </button>
        </div>

        {showPersonaInfo && (
          <p style={{ fontSize: '0.75rem', color: '#D1D5DB', marginBottom: '0.75rem', lineHeight: '1.4' }}>
            Toggle between roles to verify multi-tenant data syncing. Changes to folders, files, or obligations in one view will dynamically propagate across others.
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <button 
            style={{ 
              padding: '0.5rem', 
              fontSize: '0.8rem', 
              borderRadius: '6px', 
              border: 'none',
              background: userRole === 'guest' ? '#008080' : 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontWeight: 500
            }}
            onClick={() => setUserRole('guest')}
          >
            Guest (Marketing)
          </button>
          
          <button 
            style={{ 
              padding: '0.5rem', 
              fontSize: '0.8rem', 
              borderRadius: '6px', 
              border: 'none',
              background: userRole === 'client' ? '#008080' : 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontWeight: 500
            }}
            onClick={() => setUserRole('client')}
          >
            Client Portal
          </button>

          <button 
            style={{ 
              padding: '0.5rem', 
              fontSize: '0.8rem', 
              borderRadius: '6px', 
              border: 'none',
              background: userRole === 'accountant' ? '#008080' : 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontWeight: 500
            }}
            onClick={() => setUserRole('accountant')}
          >
            Accountant Portal
          </button>

          <button 
            style={{ 
              padding: '0.5rem', 
              fontSize: '0.8rem', 
              borderRadius: '6px', 
              border: 'none',
              background: userRole === 'admin' ? '#008080' : 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontWeight: 500
            }}
            onClick={() => setUserRole('admin')}
          >
            System Admin
          </button>
        </div>
      </div>

      {renderView()}
    </div>
  );
}

export default App;
