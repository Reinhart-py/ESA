import React from 'react';
import { Check } from 'lucide-react';

interface PricingProps {
  themeMode: 'light' | 'dark';
  onOpenAuth: (registerMode: boolean) => void;
}

export default function Pricing({
  themeMode,
  onOpenAuth
}: PricingProps) {
  const plans = [
    {
      name: 'Stewardship Bookkeeping',
      price: '$149',
      description: 'Reconciled statements compiled by real professionals monthly.',
      features: [
        'Dedicated professional bookkeeper',
        'Monthly balanced P&L and Balance Sheet',
        'Secure Document Vault storage (20GB)',
        'Direct accountant messaging support',
        'Plaid automated read-only bank feeds'
      ]
    },
    {
      name: 'Bookkeeping & Tax preparation',
      price: '$299',
      description: 'End-to-end tax advisory, planning, IRS filings, and accounting.',
      features: [
        'Everything in Bookkeeping tier',
        'Dedicated senior tax specialist assignment',
        'State and Federal IRS tax return filing',
        'Year-round compliance advisory consultations',
        '100% Audit Protection guarantee'
      ]
    }
  ];

  return (
    <section id="pricing" style={{ padding: '6rem 2rem', background: 'var(--surface-color)', borderBottom: '1px solid var(--card-border)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-color)', fontFamily: 'var(--font-family-title)', marginBottom: '1rem' }}>Plans built for scaling businesses</h2>
        <p style={{ color: 'var(--text-sec)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 4rem auto' }}>
          Select the operation package that fits your accounting requirements. Upgrade or downgrade at any time.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', textAlign: 'left' }}>
          {plans.map((p, idx) => {
            const isPro = idx === 1;
            return (
              <div 
                key={idx}
                style={{
                  background: 'var(--card-bg)',
                  border: isPro ? '2px solid var(--accent-color)' : '1px solid var(--card-border)',
                  borderRadius: 16,
                  padding: '2.5rem',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                {isPro && (
                  <span style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'var(--accent-color)', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.25rem 0.6rem', borderRadius: 4 }}>
                    RECOMMENDED
                  </span>
                )}

                <div>
                  <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>{p.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginTop: '1rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{p.price}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/month</span>
                  </div>
                  <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>{p.description}</p>
                  
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {p.features.map((f, fIdx) => (
                      <li key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-sec)' }}>
                        <Check size={16} style={{ color: 'green', flexShrink: 0 }} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  onClick={() => onOpenAuth(true)}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    background: isPro ? 'var(--accent-color)' : 'var(--primary-color)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.95rem'
                  }}
                >
                  Start Free Trial
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
