import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function Pricing({ onNavigate }) {
  return (
    <div style={{ padding: '4rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Transparent Enterprise Pricing</h2>
      <p style={{ color: '#6B7280', textAlign: 'center', marginBottom: '3rem' }}>No hidden setup charges. Pick the plan that matches your monthly transactions volume.</p>
      
      <div className="grid-cols-3" style={{ gap: '2rem' }}>
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid #E5E7EB' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Growth Scale</h3>
            <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Ideal for startups & small trading units.</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0B192C', marginBottom: '1.5rem' }}>$249<span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#6B7280' }}>/mo</span></p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', listStyle: 'none', padding: 0 }}>
              <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}><CheckCircle2 size={16} color="#008080" /> Up to 100 Transactions</li>
              <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}><CheckCircle2 size={16} color="#008080" /> GST & Payroll Filing</li>
              <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}><CheckCircle2 size={16} color="#008080" /> Appointed Compliance Specialist</li>
            </ul>
          </div>
          <button className="btn btn-secondary w-full mt-6" onClick={() => onNavigate('booking')}>Choose Growth</button>
        </div>

        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid #008080', transform: 'scale(1.03)', boxShadow: 'var(--shadow-lg)' }}>
          <div>
            <div style={{ display: 'flex', justifycontent: 'space-between', alignitems: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Professional Scale</h3>
              <span style={{ background: 'rgba(0,128,128,0.1)', color: '#008080', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 10, fontWeight: 'bold' }}>RECOMMENDED</span>
            </div>
            <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>For active SMEs and logistics companies.</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0B192C', marginBottom: '1.5rem' }}>$499<span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#6B7280' }}>/mo</span></p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', listStyle: 'none', padding: 0 }}>
              <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}><CheckCircle2 size={16} color="#008080" /> Up to 500 Transactions</li>
              <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}><CheckCircle2 size={16} color="#008080" /> TDS / GST / Annual Filings</li>
              <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}><CheckCircle2 size={16} color="#008080" /> Interactive Monthly P&L Review</li>
              <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}><CheckCircle2 size={16} color="#008080" /> 10GB Google Drive Storage</li>
            </ul>
          </div>
          <button className="btn btn-teal w-full mt-6" onClick={() => onNavigate('booking')}>Choose Professional</button>
        </div>

        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid #0B192C' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Enterprise Scale</h3>
            <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>For corporate groups & manufacturing plants.</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0B192C', marginBottom: '1.5rem' }}>Custom Plan</p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', listStyle: 'none', padding: 0 }}>
              <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}><CheckCircle2 size={16} color="#008080" /> Unlimited Transactions</li>
              <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}><CheckCircle2 size={16} color="#008080" /> Custom Compliance Audits</li>
              <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}><CheckCircle2 size={16} color="#008080" /> CFO Advisory Attendance</li>
              <li style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem' }}><CheckCircle2 size={16} color="#008080" /> Dedicated Portal Admin Support</li>
            </ul>
          </div>
          <button className="btn btn-secondary w-full mt-6" onClick={() => onNavigate('booking')}>Contact Corporate Sales</button>
        </div>
      </div>
    </div>
  );
}
