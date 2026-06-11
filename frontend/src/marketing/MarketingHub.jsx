import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Home from './Home';
import About from './About';
import Services from './Services';
import Pricing from './Pricing';
import Resources from './Resources';
import Contact from './Contact';
import Careers from './Careers';
import Booking from './Booking';
import Legal from './Legal';
import { Sun, Moon } from 'lucide-react';

export default function MarketingHub({ onLogin }) {
  const [page, setPage] = useState('home');
  const { themeMode, toggleTheme, webConfig } = useContext(AppContext);

  const renderPage = () => {
    switch (page) {
      case 'about':
        return <About />;
      case 'services':
        return <Services />;
      case 'pricing':
        return <Pricing onNavigate={setPage} />;
      case 'resources':
        return <Resources />;
      case 'contact':
        return <Contact />;
      case 'careers':
        return <Careers />;
      case 'booking':
        return <Booking />;
      case 'legal':
        return <Legal />;
      case 'home':
      default:
        return <Home onNavigate={setPage} onLogin={onLogin} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)' }}>
      {/* Header */}
      <header style={{ 
        background: 'var(--card-bg)', 
        color: 'var(--text-primary)', 
        padding: '1rem 2rem', 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        borderBottom: '1px solid var(--card-border)',
        backdropFilter: 'var(--glass-blur)',
        transition: 'background var(--transition-normal)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setPage('home')}>
            <div style={{ background: 'var(--accent-color)', color: '#fff', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>{webConfig?.WEBSITE_TITLE?.charAt(0) || 'E'}</div>
            <div>
              <h1 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', margin: 0, fontWeight: 700 }}>{webConfig?.WEBSITE_TITLE || 'EAC Solutions'}</h1>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', letterSpacing: 1, textTransform: 'uppercase' }}>Financial Intelligence</span>
            </div>
          </div>
          
          <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', outline: 'none', color: page === 'home' ? 'var(--accent-color)' : 'var(--text-sec)', fontWeight: 600 }} onClick={() => setPage('home')}>Home</button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', outline: 'none', color: page === 'services' ? 'var(--accent-color)' : 'var(--text-sec)', fontWeight: 600 }} onClick={() => setPage('services')}>Services</button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', outline: 'none', color: page === 'pricing' ? 'var(--accent-color)' : 'var(--text-sec)', fontWeight: 600 }} onClick={() => setPage('pricing')}>Pricing</button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', outline: 'none', color: page === 'resources' ? 'var(--accent-color)' : 'var(--text-sec)', fontWeight: 600 }} onClick={() => setPage('resources')}>Resources</button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', outline: 'none', color: page === 'about' ? 'var(--accent-color)' : 'var(--text-sec)', fontWeight: 600 }} onClick={() => setPage('about')}>Company</button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', outline: 'none', color: page === 'careers' ? 'var(--accent-color)' : 'var(--text-sec)', fontWeight: 600 }} onClick={() => setPage('careers')}>Careers</button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', outline: 'none', color: page === 'contact' ? 'var(--accent-color)' : 'var(--text-sec)', fontWeight: 600 }} onClick={() => setPage('contact')}>Contact</button>
            
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme} 
              style={{ background: 'var(--surface-color)', border: '1px solid var(--card-border)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer' }}
              title={themeMode === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {themeMode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
 
            <button className="btn btn-teal" style={{ padding: '0.5rem 1.25rem', background: 'var(--accent-color)', color: '#fff', borderRadius: '8px' }} onClick={() => setPage('booking')}>Book Meeting</button>
            <button className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', border: '1px solid var(--accent-color)', color: 'var(--text-primary)', background: 'transparent', borderRadius: '8px' }} onClick={onLogin}>Access Portal</button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {renderPage()}
      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--card-bg)', color: 'var(--text-sec)', padding: '4rem 2rem', borderTop: '1px solid var(--card-border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem' }}>
          <div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', marginBottom: '1rem' }}>{webConfig?.WEBSITE_TITLE || 'EAC Solutions'}</h3>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>Enterprise financial operating system simplifying compliance, accounting, audit support, and advisory management.</p>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '1rem' }}>Solutions</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('services'); }}>GST & TDS Filings</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('services'); }}>Corporate Bookkeeping</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('services'); }}>Payroll Automation</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('services'); }}>Audit Support Desk</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '1rem' }}>Resources</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('resources'); }}>Filing Deadlines</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('pricing'); }}>Tax Calculators</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('legal'); }}>Security Policies</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '1rem' }}>Contact Info</h4>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>{webConfig?.CONTACT_EMAIL || 'support@eacsolutions.com'}<br />{webConfig?.CONTACT_PHONE || '+1 (555) 019-2834'}<br />Financial District, Suite 400</p>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '3rem auto 0 auto', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', flexWrap: 'wrap', gap: '1rem', paddingTop: '1.5rem' }}>
          <span>&copy; 2026 {webConfig?.WEBSITE_TITLE || 'EAC Solutions'}. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="#" onClick={(e) => { e.preventDefault(); setPage('legal'); }}>Privacy Policy</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setPage('legal'); }}>Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
