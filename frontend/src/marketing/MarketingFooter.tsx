import React, { useContext } from 'react';
import { Shield } from 'lucide-react';
import { AppContext } from '../context/AppContext';

interface MarketingFooterProps {
  themeMode: 'light' | 'dark';
  onOpenTopic: (topic: string) => void;
}

export default function MarketingFooter({
  themeMode,
  onOpenTopic
}: MarketingFooterProps) {
  const context = useContext(AppContext);
  const title = context?.webConfig?.WEBSITE_TITLE || 'EAC Solutions';

  return (
    <footer style={{
      background: themeMode === 'light' ? '#0A1D37' : '#070A10',
      color: '#94A3B8',
      padding: '5rem 2rem',
      borderTop: `1px solid ${themeMode === 'light' ? 'transparent' : 'rgba(197,155,39,0.15)'}`
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '4rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: '#B58A2B', width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="#fff" />
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{title}</span>
          </div>
          <p style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>Managed bookkeeping & compliance prepared for modern businesses.</p>
        </div>

        <div>
          <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '1.25rem', fontWeight: 700 }}>Resources</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Platform Features</a>
            <a href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing Plans</a>
          </div>
        </div>

        <div>
          <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '1.25rem', fontWeight: 700 }}>Infrastructure</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <button onClick={() => onOpenTopic('security')} style={{ background: 'none', border: 'none', color: 'inherit', textTransform: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', font: 'inherit' }}>Security protocols</button>
            <button onClick={() => onOpenTopic('api-keys')} style={{ background: 'none', border: 'none', color: 'inherit', textTransform: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', font: 'inherit' }}>Developer Integrations</button>
          </div>
        </div>

        <div>
          <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '1.25rem', fontWeight: 700 }}>Jurisdictions</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <span>United States (IRS deadines)</span>
            <span>United Kingdom (HMRC VAT)</span>
            <span>India (GST & Corporate filings)</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem' }}>
        <span>&copy; {new Date().getFullYear()} {title} LLC. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span>Privacy Policy</span>
          <span>Terms of Use</span>
        </div>
      </div>
    </footer>
  );
}
