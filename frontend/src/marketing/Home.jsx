import React from 'react';
import { ShieldCheck, BarChart3, FileText, ArrowRight } from 'lucide-react';

export default function Home({ onNavigate, onLogin }) {
  return (
    <div>
      {/* Hero Section */}
      <section style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)', color: '#fff', padding: '6rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <span style={{ background: 'rgba(0, 168, 150, 0.2)', color: '#00A896', padding: '0.5rem 1rem', borderRadius: 50, fontSize: '0.85rem', fontWeight: 600, display: 'inline-block', marginBottom: '1.5rem' }}>ENTERPRISE COMPLIANCE & FINANCIAL MANAGEMENT</span>
          <h1 style={{ color: '#fff', fontSize: '3.5rem', lineHeight: 1.15, marginBottom: '1.5rem', fontWeight: 800 }}>Confidence in your numbers, absolute compliance.</h1>
          <p style={{ fontSize: '1.2rem', color: '#D1D5DB', marginBottom: '2.5rem', maxWidth: 700, margin: '0 auto 2.5rem auto' }}>
            The unified operating system for high-growth businesses. We manage your bookkeeping, tax filing, payroll operations, compliance reporting, and audits so you can focus on building your enterprise.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button className="btn btn-teal" style={{ padding: '0.8rem 1.8rem', fontSize: '1rem' }} onClick={() => onNavigate('booking')}>Get a Free Consultation <ArrowRight size={18} /></button>
            <button className="btn btn-secondary" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', padding: '0.8rem 1.8rem', fontSize: '1rem' }} onClick={onLogin}>Explore Client Portal Demo</button>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section style={{ background: '#FFFFFF', padding: '3rem 2rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#6B7280', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 2, marginBottom: '1.5rem' }}>Trusted by over 5,000+ businesses across industries</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', gap: '2rem', alignItems: 'center', opacity: 0.7 }}>
            <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0B192C' }}>✦ NEXUS LOGISTICS</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0B192C' }}>✦ APEX RETAIL</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0B192C' }}>✦ VERIDIAN CAPITAL</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0B192C' }}>✦ CHRONOS GLOBAL</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0B192C' }}>✦ SKYLINE SAAS</span>
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section style={{ padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Enterprise operations, simplified.</h2>
            <p style={{ color: '#6B7280', maxWidth: 600, margin: '0 auto' }}>A comprehensive ecosystem that handles your back-office financial tasks with professional precision and security.</p>
          </div>
          
          <div className="grid-cols-3">
            <div className="premium-card">
              <div style={{ color: '#008080', marginBottom: '1rem' }}><ShieldCheck size={40} /></div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Absolute Regulatory Compliance</h3>
              <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>Automated GST, TDS, annual filings, and audit calendars. Never miss a submission with real-time deadline warnings.</p>
            </div>
            <div className="premium-card">
              <div style={{ color: '#008080', marginBottom: '1rem' }}><BarChart3 size={40} /></div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Real-time Dashboard Analytics</h3>
              <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>Get instant access to profit & loss, balance sheets, cash flow tracking, and custom tax summaries. Clean financial records, ready for review.</p>
            </div>
            <div className="premium-card">
              <div style={{ color: '#008080', marginBottom: '1rem' }}><FileText size={40} /></div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Secure Document Portal</h3>
              <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>Secure upload environment. Virtual Google Drive directory architecture allowing simple file search, categorization, and full access controls.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section style={{ background: '#0B192C', color: '#fff', padding: '5rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ color: '#fff', fontSize: '2.2rem', marginBottom: '1rem' }}>Ready to clean up your bookkeeping & tax filings?</h2>
          <p style={{ color: '#9CA3AF', marginBottom: '2rem' }}>Book a personal discovery session with our senior charter accountant team. We will review your current systems for free.</p>
          <button className="btn btn-teal" style={{ padding: '0.8rem 1.8rem' }} onClick={() => onNavigate('booking')}>Schedule Consultation Now</button>
        </div>
      </section>
    </div>
  );
}
