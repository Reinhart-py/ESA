import React, { useContext } from 'react';
import { ShieldCheck, BarChart3, FileText, ArrowRight } from 'lucide-react';
import { AppContext } from '../context/AppContext.tsx';

export default function Home({ onNavigate, onLogin }) {
  const context = useContext(AppContext);
  const themeMode = context ? context.themeMode : 'light';

  const isLight = themeMode === 'light';

  return (
    <div>
      {/* Hero Section */}
      <section style={{ 
        background: isLight ? 'linear-gradient(135deg, #F8F9FB 0%, #E8ECEF 100%)' : 'linear-gradient(135deg, #0B0F17 0%, #1E293B 100%)', 
        color: 'var(--text-primary)', 
        padding: '6rem 2rem', 
        textAlign: 'center',
        borderBottom: '1px solid var(--card-border)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Shiny edge overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, var(--accent-color), transparent)' }} />
        
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <span style={{ 
            background: isLight ? 'rgba(181, 138, 43, 0.15)' : 'rgba(226, 184, 87, 0.15)', 
            color: 'var(--accent-color)', 
            padding: '0.55rem 1.25rem', 
            borderRadius: 50, 
            fontSize: '0.85rem', 
            fontWeight: 700, 
            display: 'inline-block', 
            marginBottom: '1.5rem',
            letterSpacing: '0.05em',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            ENTERPRISE COMPLIANCE & FINANCIAL MANAGEMENT
          </span>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '3.5rem', lineHeight: 1.15, marginBottom: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Confidence in your numbers, <span style={{ color: 'var(--accent-color)' }}>absolute compliance.</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-sec)', marginBottom: '2.5rem', maxWidth: 700, margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
            The unified operating system for high-growth businesses. We manage your bookkeeping, tax filing, payroll operations, compliance reporting, and audits so you can focus on building your enterprise.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-teal" style={{ padding: '0.8rem 1.8rem', fontSize: '1rem', background: 'var(--accent-color)', color: '#fff', borderRadius: '8px', boxShadow: '0 4px 15px rgba(181,138,43,0.35)' }} onClick={() => onNavigate('booking')}>
              Get a Free Consultation <ArrowRight size={18} />
            </button>
            <button className="btn btn-secondary" style={{ color: 'var(--text-primary)', borderColor: 'var(--card-border)', background: 'var(--card-bg)', padding: '0.8rem 1.8rem', fontSize: '1rem', border: '1px solid var(--card-border)', borderRadius: '8px' }} onClick={onLogin}>
              Explore Client Portal Demo
            </button>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section style={{ background: 'var(--card-bg)', padding: '3.5rem 2rem', borderBottom: '1px solid var(--card-border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 2, marginBottom: '1.75rem', fontWeight: 700 }}>Trusted by over 5,000+ businesses across industries</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', gap: '2rem', alignItems: 'center', opacity: 0.85 }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-sec)', letterSpacing: '0.05em' }}>✦ NEXUS LOGISTICS</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-sec)', letterSpacing: '0.05em' }}>✦ APEX RETAIL</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-sec)', letterSpacing: '0.05em' }}>✦ VERIDIAN CAPITAL</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-sec)', letterSpacing: '0.05em' }}>✦ CHRONOS GLOBAL</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-sec)', letterSpacing: '0.05em' }}>✦ SKYLINE SAAS</span>
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section style={{ padding: '6rem 2rem', background: 'var(--surface-color)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Enterprise operations, simplified.</h2>
            <p style={{ color: 'var(--text-sec)', maxWidth: 600, margin: '0 auto' }}>A comprehensive ecosystem that handles your back-office financial tasks with professional precision and security.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            <div className="premium-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2.5rem 2rem' }}>
              <div style={{ color: 'var(--accent-color)', marginBottom: '1.25rem' }}><ShieldCheck size={44} /></div>
              <h3 style={{ fontSize: '1.30rem', marginBottom: '0.75rem', fontWeight: 700 }}>Absolute Regulatory Compliance</h3>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.95rem', lineHeight: 1.6 }}>Automated GST, TDS, annual filings, and audit calendars. Never miss a submission with real-time deadline warnings.</p>
            </div>
            <div className="premium-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2.5rem 2rem' }}>
              <div style={{ color: 'var(--accent-color)', marginBottom: '1.25rem' }}><BarChart3 size={44} /></div>
              <h3 style={{ fontSize: '1.30rem', marginBottom: '0.75rem', fontWeight: 700 }}>Real-time Dashboard Analytics</h3>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.95rem', lineHeight: 1.6 }}>Get instant access to profit & loss, balance sheets, cash flow tracking, and custom tax summaries. Clean financial records, ready for review.</p>
            </div>
            <div className="premium-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2.5rem 2rem' }}>
              <div style={{ color: 'var(--accent-color)', marginBottom: '1.25rem' }}><FileText size={44} /></div>
              <h3 style={{ fontSize: '1.30rem', marginBottom: '0.75rem', fontWeight: 700 }}>Secure Document Portal</h3>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.95rem', lineHeight: 1.6 }}>Secure upload environment. Virtual Google Drive directory architecture allowing simple file search, categorization, and full access controls.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section style={{ 
        background: isLight ? '#0A1D37' : 'linear-gradient(135deg, #070A10 0%, #151D2A 100%)', 
        color: '#fff', 
        padding: '6rem 2rem', 
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <h2 style={{ color: '#fff', fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Ready to clean up your bookkeeping & filings?</h2>
          <p style={{ color: '#E2E8F0', marginBottom: '2.5rem', fontSize: '1.1rem', opacity: 0.9 }}>Book a personal discovery session with our senior chartered accountant team. We will review your current systems for free.</p>
          <button className="btn btn-teal" style={{ padding: '0.85rem 2rem', background: 'var(--accent-color)', color: '#fff', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(181,138,43,0.4)' }} onClick={() => onNavigate('booking')}>
            Schedule Consultation Now
          </button>
        </div>
      </section>
    </div>
  );
}
