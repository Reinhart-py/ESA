import React from 'react';

export default function Resources() {
  return (
    <div style={{ padding: '4rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Resources & Compliance Updates</h2>
      <p style={{ color: '#6B7280', textAlign: 'center', marginBottom: '3rem' }}>Keep up to date with taxation changes, templates, and corporate guidelines.</p>
      
      <div className="grid-cols-3" style={{ gap: '2rem' }}>
        <div className="premium-card">
          <span style={{ fontSize: '0.75rem', background: 'rgba(0,128,128,0.1)', color: '#008080', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 'bold' }}>TAX GUIDE</span>
          <h3 style={{ fontSize: '1.2rem', margin: '0.5rem 0' }}>Q3 Filing Compliance Changes</h3>
          <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>A complete breakdown of the adjusted GST margins for logistical operations under new guidelines.</p>
        </div>
        <div className="premium-card">
          <span style={{ fontSize: '0.75rem', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 'bold' }}>TEMPLATE</span>
          <h3 style={{ fontSize: '1.2rem', margin: '0.5rem 0' }}>Payroll Allocation Excel Guide</h3>
          <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Download our validated payroll sheet template configured for correct TDS calculations.</p>
        </div>
        <div className="premium-card">
          <span style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 'bold' }}>INDUSTRY ARTICLE</span>
          <h3 style={{ fontSize: '1.2rem', margin: '0.5rem 0' }}>Optimizing Corporate Audit Prep</h3>
          <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Tips and procedures on coordinating with external auditors and ensuring clean reconciliations.</p>
        </div>
      </div>
    </div>
  );
}
