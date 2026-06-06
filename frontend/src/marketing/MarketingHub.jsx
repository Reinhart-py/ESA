import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Building2, ShieldCheck, BarChart3, Users, FileText, ArrowRight, CheckCircle2, 
  HelpCircle, Calendar, MessageSquare, Briefcase, Info, Lock, Network
} from 'lucide-react';

export default function MarketingHub({ onLogin }) {
  const [activeTab, setActiveTab] = useState('home');
  const { bookConsultation, bookings } = useContext(AppContext);
  const [bookingForm, setBookingForm] = useState({ service: 'Corporate Tax Advisory', date: '', time: '', notes: '' });
  const [bookingStatus, setBookingStatus] = useState(null);
  
  const handleBooking = (e) => {
    e.preventDefault();
    if (!bookingForm.date || !bookingForm.time) {
      alert('Please select both date and time.');
      return;
    }
    const booked = bookConsultation(bookingForm.service, bookingForm.date, bookingForm.time, bookingForm.notes);
    setBookingStatus(`Consultation confirmed for ${booked.date} at ${booked.time}. An invite has been sent to your email.`);
    setBookingForm({ service: 'Corporate Tax Advisory', date: '', time: '', notes: '' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8F9FA' }}>
      {/* Header */}
      <header style={{ background: '#0B192C', color: '#FFFFFF', padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setActiveTab('home')}>
            <div style={{ background: '#008080', color: '#fff', width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>E</div>
            <div>
              <h1 style={{ color: '#FFFFFF', fontSize: '1.4rem', margin: 0, fontWeight: 700 }}>EAC Solutions</h1>
              <span style={{ fontSize: '0.75rem', color: '#00A896', letterSpacing: 1, textTransform: 'uppercase' }}>Financial Intelligence</span>
            </div>
          </div>
          
          <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <button style={{ color: activeTab === 'home' ? '#00A896' : '#fff', fontWeight: 500 }} onClick={() => setActiveTab('home')}>Home</button>
            <button style={{ color: activeTab === 'services' ? '#00A896' : '#fff', fontWeight: 500 }} onClick={() => setActiveTab('services')}>Services</button>
            <button style={{ color: activeTab === 'industries' ? '#00A896' : '#fff', fontWeight: 500 }} onClick={() => setActiveTab('industries')}>Industries</button>
            <button style={{ color: activeTab === 'pricing' ? '#00A896' : '#fff', fontWeight: 500 }} onClick={() => setActiveTab('pricing')}>Pricing</button>
            <button style={{ color: activeTab === 'resources' ? '#00A896' : '#fff', fontWeight: 500 }} onClick={() => setActiveTab('resources')}>Resources</button>
            <button style={{ color: activeTab === 'about' ? '#00A896' : '#fff', fontWeight: 500 }} onClick={() => setActiveTab('about')}>Company</button>
            <button className="btn btn-teal" style={{ padding: '0.5rem 1rem' }} onClick={() => setActiveTab('booking')}>Book Meeting</button>
            <button className="btn btn-primary" style={{ border: '1px solid #00A896', padding: '0.5rem 1rem' }} onClick={onLogin}>Access Portal</button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {activeTab === 'home' && (
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
                  <button className="btn btn-teal" style={{ padding: '0.8rem 1.8rem', fontSize: '1rem' }} onClick={() => setActiveTab('booking')}>Get a Free Consultation <ArrowRight size={18} /></button>
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
                <button className="btn btn-teal" style={{ padding: '0.8rem 1.8rem' }} onClick={() => setActiveTab('booking')}>Schedule Consultation Now</button>
              </div>
            </section>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div style={{ padding: '4rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Our Comprehensive Financial Services</h2>
            <p style={{ color: '#6B7280', textAlign: 'center', marginBottom: '3rem', maxWidth: 600, margin: '0 auto 3rem auto' }}>EAC Solutions delivers enterprise accounting solutions tailored for startups, trading houses, manufacturing plants, and service providers.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
              <div className="premium-card">
                <h3 style={{ fontSize: '1.2rem', color: '#008080', marginBottom: '0.5rem' }}>Taxation & Compliance</h3>
                <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Comprehensive GST, TDS return preparations, payroll taxes, audit support, and advisory services to prevent regulatory violations.</p>
              </div>
              <div className="premium-card">
                <h3 style={{ fontSize: '1.2rem', color: '#008080', marginBottom: '0.5rem' }}>Corporate Accounting</h3>
                <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Day-to-day transaction recording, bank ledger reconciliation, automated expense matching, and monthly financial statement closings.</p>
              </div>
              <div className="premium-card">
                <h3 style={{ fontSize: '1.2rem', color: '#008080', marginBottom: '0.5rem' }}>Payroll Management</h3>
                <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Complete salary computations, employee benefit distributions, tax deductions (TDS), salary slips delivery, and annual filing.</p>
              </div>
              <div className="premium-card">
                <h3 style={{ fontSize: '1.2rem', color: '#008080', marginBottom: '0.5rem' }}>CFO & Strategic Advisory</h3>
                <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Capital raising advice, historical analysis, monthly reviews, growth forecasting, cash runway modeling, and strategic compliance structures.</p>
              </div>
              <div className="premium-card">
                <h3 style={{ fontSize: '1.2rem', color: '#008080', marginBottom: '0.5rem' }}>Audit Support</h3>
                <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Independent auditing prep, internal control checks, balance sheet integrity testing, and clean, transparent reports representation.</p>
              </div>
              <div className="premium-card">
                <h3 style={{ fontSize: '1.2rem', color: '#008080', marginBottom: '0.5rem' }}>Company Registration</h3>
                <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>LLP incorporation, Pvt Ltd creation, tax registration (GSTIN/PAN/TAN Setup), and ongoing regulatory compliance advisory.</p>
              </div>
            </div>
          </div>
        )}

        {/* Industries Tab */}
        {activeTab === 'industries' && (
          <div style={{ padding: '4rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Customized Solutions for Every Sector</h2>
            <p style={{ color: '#6B7280', textAlign: 'center', marginBottom: '3rem' }}>Every industry requires specific financial compliance strategies. Here is how we specialize:</p>
            
            <div className="grid-cols-3" style={{ gap: '2rem' }}>
              <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ color: '#0B192C' }}>Manufacturing & Logistics</h3>
                <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>Inventory valuation methods (FIFO/LIFO), production cost sheets analysis, multi-state GST filing, customs, and duty compliance.</p>
              </div>
              <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ color: '#0B192C' }}>Retail & E-commerce</h3>
                <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>High-volume sales reconciliations, payment gateway statements matching, multi-channel taxation calculations, and return adjustments.</p>
              </div>
              <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ color: '#0B192C' }}>Startups & SaaS</h3>
                <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>Subscription billing mechanics management, deferred revenue matching, monthly cash runway metrics, R&D tax credits, and investor reports.</p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
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
                <button className="btn btn-secondary w-full mt-6" onClick={() => setActiveTab('booking')}>Choose Growth</button>
              </div>

              <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid #008080', transform: 'scale(1.03)', boxShadow: 'var(--shadow-lg)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                <button className="btn btn-teal w-full mt-6" onClick={() => setActiveTab('booking')}>Choose Professional</button>
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
                <button className="btn btn-secondary w-full mt-6" onClick={() => setActiveTab('booking')}>Contact Corporate Sales</button>
              </div>
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
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
        )}

        {/* Company / About Tab */}
        {activeTab === 'about' && (
          <div style={{ padding: '4rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>About EAC Solutions</h2>
            <p style={{ color: '#6B7280', textAlign: 'center', marginBottom: '3rem', maxWidth: 700, margin: '0 auto 3rem auto' }}>EAC Solutions was founded to bridge the gap between complex accounting rules and everyday business operations. We combine a stellar advisory team with software excellence.</p>
            
            <div className="grid-cols-2" style={{ alignItems: 'center', gap: '3rem' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Our Security & Infrastructure</h3>
                <p style={{ color: '#6B7280', marginBottom: '1rem' }}>We operate with multi-layered secure policies. All financial documents are processed through dedicated client directories utilizing your organization's own storage vaults (including Google Drive with 5TB dedicated storage) or cloud enterprise containers.</p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#008080', fontWeight: 'bold' }}><Lock size={18} /> SSL Encrypted</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#008080', fontWeight: 'bold' }}><Network size={18} /> Google Drive API Configured</div>
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
        )}

        {/* Booking Tab */}
        {activeTab === 'booking' && (
          <div style={{ padding: '4rem 2rem', maxWidth: 800, margin: '0 auto' }}>
            <div className="premium-card" style={{ padding: '3rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Calendar size={48} color="#008080" style={{ margin: '0 auto 1rem auto' }} />
                <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Book a Discovery Call</h2>
                <p style={{ color: '#6B7280' }}>Select a service and date below to meet with our advisory team.</p>
              </div>

              {bookingStatus && (
                <div className="badge badge-success" style={{ width: '100%', padding: '1rem', display: 'block', fontSize: '0.95rem', marginBottom: '2rem', textAlign: 'center', borderRadius: 8 }}>
                  {bookingStatus}
                </div>
              )}

              <form onSubmit={handleBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Select Service</label>
                  <select 
                    className="form-input" 
                    value={bookingForm.service} 
                    onChange={e => setBookingForm({...bookingForm, service: e.target.value})}
                  >
                    <option>Corporate Tax Advisory</option>
                    <option>GST Registration / Consultation</option>
                    <option>Monthly Bookkeeping Setup</option>
                    <option>Internal Audit & Control Review</option>
                    <option>Virtual CFO Advisory Services</option>
                  </select>
                </div>

                <div className="grid-cols-2">
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Choose Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={bookingForm.date} 
                      onChange={e => setBookingForm({...bookingForm, date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Preferred Time Slot</label>
                    <select 
                      className="form-input" 
                      value={bookingForm.time} 
                      onChange={e => setBookingForm({...bookingForm, time: e.target.value})}
                      required
                    >
                      <option value="">Select Time</option>
                      <option>09:00 AM - 10:00 AM</option>
                      <option>11:00 AM - 12:00 PM</option>
                      <option>02:00 PM - 03:00 PM</option>
                      <option>04:00 PM - 05:00 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Additional Business Details (Optional)</label>
                  <textarea 
                    className="form-input" 
                    rows={4} 
                    placeholder="Briefly describe your business transaction volume and primary filing requirements..."
                    value={bookingForm.notes}
                    onChange={e => setBookingForm({...bookingForm, notes: e.target.value})}
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-teal w-full" style={{ padding: '0.8rem' }}>Confirm Appointment Booking</button>
              </form>
            </div>
          </div>
        )}
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
              <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('services'); }}>GST & TDS Filings</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('services'); }}>Corporate Bookkeeping</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('services'); }}>Payroll Automation</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('services'); }}>Audit Support Desk</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#FFF', fontSize: '0.95rem', marginBottom: '1rem' }}>Resources</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('resources'); }}>Filing Deadlines</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('resources'); }}>Tax Calculators</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('about'); }}>Security Policies</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#FFF', fontSize: '0.95rem', marginBottom: '1rem' }}>Contact Info</h4>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>corporate@eacsolutions.com<br />+1 (555) 019-0000<br />Financial District, Suite 400</p>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '3rem auto 0 auto', paddingParent: '2rem 0 0 0', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', flexWrap: 'wrap', gap: '1rem' }}>
          <span>&copy; 2026 EAC Solutions. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="#" onClick={(e) => { e.preventDefault(); alert("Privacy Policy: All client financial records are strictly isolated and stored in Google Drive structures."); }}>Privacy Policy</a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert("Terms of Service: Platform usage governs automated filing notifications and storage allocations."); }}>Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
