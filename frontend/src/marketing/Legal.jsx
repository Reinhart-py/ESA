import React, { useState } from 'react';
import { Shield, FileText, Handshake } from 'lucide-react';

export default function Legal() {
  const [legalTab, setLegalTab] = useState('privacy');

  return (
    <div style={{ padding: '4rem 2rem', maxWidth: 1000, margin: '0 auto' }}>
      {/* Sub menu */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '3rem' }}>
        <button 
          className="btn" 
          style={{ background: legalTab === 'privacy' ? '#0B192C' : 'transparent', color: legalTab === 'privacy' ? '#fff' : '#0B192C', border: '1px solid #0B192C' }}
          onClick={() => setLegalTab('privacy')}
        >
          <Shield size={16} /> Privacy Policy
        </button>
        <button 
          className="btn" 
          style={{ background: legalTab === 'terms' ? '#0B192C' : 'transparent', color: legalTab === 'terms' ? '#fff' : '#0B192C', border: '1px solid #0B192C' }}
          onClick={() => setLegalTab('terms')}
        >
          <FileText size={16} /> Terms of Service
        </button>
        <button 
          className="btn" 
          style={{ background: legalTab === 'partners' ? '#0B192C' : 'transparent', color: legalTab === 'partners' ? '#fff' : '#0B192C', border: '1px solid #0B192C' }}
          onClick={() => setLegalTab('partners')}
        >
          <Handshake size={16} /> Partner Program
        </button>
      </div>

      <div className="premium-card">
        {legalTab === 'privacy' && (
          <div>
            <h2 style={{ marginBottom: '1rem' }}>Privacy & Data Isolation Policy</h2>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>Last updated: June 2026</p>
            <p style={{ marginBottom: '1rem' }}>EAC Solutions enforces strict multi-tenant isolation. Your financial ledgers, transactional logs, bank statement PDFs, and tax filings remain completely private and isolated inside your workspace container.</p>
            <p>Documents are stored in dedicated cloud directories. Under our primary integration, files reside in your own secure Google Workspace Drive container with 5TB dedicated storage allocation.</p>
          </div>
        )}

        {legalTab === 'terms' && (
          <div>
            <h2 style={{ marginBottom: '1rem' }}>Terms of Platform Service</h2>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>Last updated: June 2026</p>
            <p style={{ marginBottom: '1rem' }}>By subscribing to EAC Solutions platforms, you authorize our appointed accounting specialists to process bookkeeping ledgers, reconcile transactions, and submit filings to GSTIN/TDS portals on your behalf.</p>
            <p>Late warnings and compliance calendars are configured based on standard regulatory dates. The tenant is responsible for providing all requested transactional records before calendar deadlines.</p>
          </div>
        )}

        {legalTab === 'partners' && (
          <div>
            <h2 style={{ marginBottom: '1rem' }}>EAC Solutions Partner Program</h2>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>Join the Network</p>
            <p style={{ marginBottom: '1.5rem' }}>Refer growing companies to EAC Solutions. Partners receive up to 15% monthly recurring commission on the client's subscription scale for the first 12 months.</p>
            <button className="btn btn-teal" onClick={() => alert('Partnership desk: Contact partners@eacsolutions.com.')}>Register as Partner</button>
          </div>
        )}
      </div>
    </div>
  );
}
