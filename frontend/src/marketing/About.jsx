import React from 'react';
import { Lock, Network } from 'lucide-react';

export default function About() {
  return (
    <div style={{ padding: '4rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>About EAC Solutions</h2>
      <p style={{ color: '#6B7280', textAlign: 'center', marginBottom: '3rem', maxWidth: 700, margin: '0 auto 3rem auto' }}>
        EAC Solutions was founded to bridge the gap between complex accounting rules and everyday business operations. We combine a stellar advisory team with software excellence.
      </p>
      
      <div className="grid-cols-2" style={{ alignItems: 'center', gap: '3rem' }}>
        <div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Our Security & Infrastructure</h3>
          <p style={{ color: '#6B7280', marginBottom: '1rem' }}>
            We operate with multi-layered secure policies. All financial documents are processed through dedicated client directories utilizing your organization's own storage vaults (including Google Drive with 5TB dedicated storage) or cloud enterprise containers.
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#008080', fontWeight: 'bold' }}>
              <Lock size={18} /> SSL Encrypted
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#008080', fontWeight: 'bold' }}>
              <Network size={18} /> Google Drive API Configured
            </div>
          </div>
        </div>
        <div className="premium-card" style={{ background: '#0B192C', color: '#fff' }}>
          <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Our Leadership Principles</h3>
          <p style={{ color: '#D1D5DB', fontSize: '0.95rem', marginBottom: '1rem' }}>- Professional Accountability: Clean reports without exception.</p>
          <p style={{ color: '#D1D5DB', fontSize: '0.95rem', marginBottom: '1rem' }}>- Technology First: Continuous improvement of portals for ease-of-use.</p>
          <p style={{ color: '#D1D5DB', fontSize: '0.95rem' }}>- Client Centricity: Fast turnaround times and transparent ticketing.</p>
        </div>
      </div>
    </div>
  );
}
