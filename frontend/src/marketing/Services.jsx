import React from 'react';

export default function Services() {
  return (
    <div style={{ padding: '4rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>Our Comprehensive Financial Services</h2>
      <p style={{ color: '#6B7280', textAlign: 'center', marginBottom: '3rem', maxWidth: 600, margin: '0 auto 3rem auto' }}>
        EAC Solutions delivers enterprise accounting solutions tailored for startups, trading houses, manufacturing plants, and service providers.
      </p>
      
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
  );
}
