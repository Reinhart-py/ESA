import React, { useState } from 'react';
import Home from './Home';
import About from './About';
import Services from './Services';
import Pricing from './Pricing';
import Resources from './Resources';
import Contact from './Contact';
import Careers from './Careers';
import Booking from './Booking';
import Legal from './Legal';

export default function MarketingHub({ onLogin }) {
  const [page, setPage] = useState('home');

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8F9FA' }}>
      {/* Header */}
      <header style={{ background: '#0B192C', color: '#FFFFFF', padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setPage('home')}>
            <div style={{ background: '#008080', color: '#fff', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>E</div>
            <div>
              <h1 style={{ color: '#FFFFFF', fontSize: '1.4rem', margin: 0, fontWeight: 700 }}>EAC Solutions</h1>
              <span style={{ fontSize: '0.75rem', color: '#00A896', letterSpacing: 1, textTransform: 'uppercase' }}>Financial Intelligence</span>
            </div>
          </div>
          
          <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <button style={{ color: page === 'home' ? '#00A896' : '#fff', fontWeight: 500 }} onClick={() => setPage('home')}>Home</button>
            <button style={{ color: page === 'services' ? '#00A896' : '#fff', fontWeight: 500 }} onClick={() => setPage('services')}>Services</button>
            <button style={{ color: page === 'pricing' ? '#00A896' : '#fff', fontWeight: 500 }} onClick={() => setPage('pricing')}>Pricing</button>
            <button style={{ color: page === 'resources' ? '#00A896' : '#fff', fontWeight: 500 }} onClick={() => setPage('resources')}>Resources</button>
            <button style={{ color: page === 'about' ? '#00A896' : '#fff', fontWeight: 500 }} onClick={() => setPage('about')}>Company</button>
            <button style={{ color: page === 'careers' ? '#00A896' : '#fff', fontWeight: 500 }} onClick={() => setPage('careers')}>Careers</button>
            <button style={{ color: page === 'contact' ? '#00A896' : '#fff', fontWeight: 500 }} onClick={() => setPage('contact')}>Contact</button>
            <button className="btn btn-teal" style={{ padding: '0.5rem 1rem' }} onClick={() => setPage('booking')}>Book Meeting</button>
            <button className="btn btn-primary" style={{ border: '1px solid #00A896', padding: '0.5rem 1rem' }} onClick={onLogin}>Access Portal</button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {renderPage()}
      </main>

      {/* Footer */}
      <footer style={{ background: '#0B192C', color: '#9CA3AF', padding: '4rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem' }}>
          <div>
            <h3 style={{ color: '#FFF', fontSize: '1.2rem', marginBottom: '1rem' }}>EAC Solutions</h3>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>Enterprise financial operating system simplifying compliance, accounting, audit support, and advisory management.</p>
          </div>
          <div>
            <h4 style={{ color: '#FFF', fontSize: '0.95rem', marginBottom: '1rem' }}>Solutions</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('services'); }}>GST & TDS Filings</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('services'); }}>Corporate Bookkeeping</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('services'); }}>Payroll Automation</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('services'); }}>Audit Support Desk</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#FFF', fontSize: '0.95rem', marginBottom: '1rem' }}>Resources</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('resources'); }}>Filing Deadlines</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('pricing'); }}>Tax Calculators</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setPage('legal'); }}>Security Policies</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#FFF', fontSize: '0.95rem', marginBottom: '1rem' }}>Contact Info</h4>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>corporate@eacsolutions.com<br />+1 (555) 019-0000<br />Financial District, Suite 400</p>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '3rem auto 0 auto', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', flexWrap: 'wrap', gap: '1rem', paddingTop: '1.5rem' }}>
          <span>&copy; 2026 EAC Solutions. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="#" onClick={(e) => { e.preventDefault(); setPage('legal'); }}>Privacy Policy</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setPage('legal'); }}>Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
