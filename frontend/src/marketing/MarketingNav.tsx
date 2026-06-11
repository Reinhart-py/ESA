import React, { useContext } from 'react';
import { Shield, Sun, Moon } from 'lucide-react';
import { AppContext } from '../context/AppContext';

interface MarketingNavProps {
  themeMode: 'light' | 'dark';
  toggleTheme: () => void;
  onOpenAuth: (registerMode: boolean) => void;
  onOpenTopic: (topic: string) => void;
}

export default function MarketingNav({
  themeMode,
  toggleTheme,
  onOpenAuth,
  onOpenTopic
}: MarketingNavProps) {
  const context = useContext(AppContext);
  const title = context?.webConfig?.WEBSITE_TITLE || 'EAC Solutions';

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: themeMode === 'light' ? 'rgba(255, 255, 255, 0.92)' : 'rgba(11, 15, 25, 0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${themeMode === 'light' ? '#F3F4F6' : 'rgba(197, 155, 39, 0.15)'}`,
      padding: '1.25rem 2rem',
      transition: 'background-color 0.3s, border-color 0.3s'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--primary-color)',
            width: 36,
            height: 36,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={20} color="#fff" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--primary-color)' }}>{title}</span>
        </div>

        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', fontWeight: 600 }}>
          <a href="#features" style={{ color: 'var(--text-sec)', textDecoration: 'none', transition: 'color 0.2s' }}>Features</a>
          <a href="#pricing" style={{ color: 'var(--text-sec)', textDecoration: 'none', transition: 'color 0.2s' }}>Pricing</a>
          <a href="#faqs" style={{ color: 'var(--text-sec)', textDecoration: 'none', transition: 'color 0.2s' }}>FAQs</a>
          <button 
            onClick={() => onOpenTopic('how-it-works')} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', color: 'var(--text-sec)', transition: 'color 0.2s' }}
          >
            How It Works
          </button>
          <button 
            onClick={() => onOpenTopic('reviews')} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', color: 'var(--text-sec)', transition: 'color 0.2s' }}
          >
            Reviews
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-color)',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {themeMode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <button 
            onClick={() => onOpenAuth(false)}
            style={{
              padding: '0.5rem 1.25rem',
              background: 'transparent',
              color: 'var(--text-sec)',
              border: '1px solid var(--card-border)',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            Log In
          </button>
          <button 
            onClick={() => onOpenAuth(true)}
            style={{
              padding: '0.5rem 1.25rem',
              background: 'var(--accent-color)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'background-color 0.2s'
            }}
          >
            Free Trial
          </button>
        </div>
      </div>
    </nav>
  );
}
