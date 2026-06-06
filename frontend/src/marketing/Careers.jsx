import React, { useState } from 'react';
import { Briefcase } from 'lucide-react';

export default function Careers() {
  const [applied, setApplied] = useState(false);
  const [position, setPosition] = useState('Senior Chartered Accountant');

  return (
    <div style={{ padding: '4rem 2rem', maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Careers at EAC Solutions</h2>
      <p style={{ color: '#6B7280', textAlign: 'center', marginBottom: '3rem' }}>Join a modern financial advisory team combining technology and premium consulting.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="premium-card">
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0B192C' }}>
              <Briefcase size={18} /> Senior Chartered Accountant
            </h3>
            <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: '0.5rem 0' }}>Location: New York HQ / Hybrid | Category: Taxation & Audits</p>
            <p style={{ fontSize: '0.95rem' }}>Responsible for leading multi-tenant corporate GST reviews, client corporate P&L compilations, and direct advisory representation.</p>
            <button className="btn btn-secondary mt-4" onClick={() => { setPosition('Senior Chartered Accountant'); setApplied(false); }}>Apply Now</button>
          </div>

          <div className="premium-card">
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0B192C' }}>
              <Briefcase size={18} /> Compliance & Tax Specialist
            </h3>
            <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: '0.5rem 0' }}>Location: Remote / USA | Category: Regulatory Filings</p>
            <p style={{ fontSize: '0.95rem' }}>Manage and file TDS, payroll forms, annual returns, corporate filings calendars, and support audits queries.</p>
            <button className="btn btn-secondary mt-4" onClick={() => { setPosition('Compliance & Tax Specialist'); setApplied(false); }}>Apply Now</button>
          </div>
        </div>

        <div className="premium-card" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Submit Application: {position}</h3>
          {applied ? (
            <div className="badge badge-success" style={{ width: '100%', padding: '1rem', display: 'block', textAlign: 'center', borderRadius: 8 }}>
              Application submitted successfully! Our talent team will review your resume.
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setApplied(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" className="form-input" placeholder="Full Name" required />
              <input type="email" className="form-input" placeholder="Email Address" required />
              <input type="text" className="form-input" placeholder="LinkedIn Profile URL" required />
              <button type="submit" className="btn btn-teal w-full">Submit Resume</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
