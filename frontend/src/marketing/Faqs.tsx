import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FaqsProps {
  themeMode: 'light' | 'dark';
}

export default function Faqs({
  themeMode
}: FaqsProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'Will I be assigned a real person or is this automated software?',
      a: 'You get both. All bookkeeping, classifications, and tax returns are prepared and signed off by a real, dedicated human accountant. Our software platform simply acts as your portal to upload documents, review P&L graphs, check deadlines, and message your specialist.'
    },
    {
      q: 'How does the monthly books closing cycle operate?',
      a: 'We connect bank transaction statements via Plaid read-only feeds. Throughout the month, your assigned bookkeeper reconciles bank logs. By the 10th of the following month, your balanced Profit & Loss statement and Balance Sheet are posted to your Document Vault, fully audit-proof.'
    },
    {
      q: 'Is my historical financial information secure?',
      a: 'Absolutely. We store all files in encrypted vaults utilizing AES-256 standard encryption. Connections are established securely using SSL/TLS protocols. Access tokens to bank accounts are read-only.'
    },
    {
      q: 'Do you support back-taxes bookkeeping?',
      a: 'Yes. If you have months or years of catch-up books, your assigned accountant will map out a bookkeeping recovery plan to balance all historical statements and prepare them for IRS tax filings.'
    }
  ];

  const toggleFaq = (idx: number) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

  return (
    <section id="faqs" style={{ padding: '6rem 2rem', background: 'var(--bg-color)', borderBottom: '1px solid var(--card-border)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, textAlign: 'center', color: 'var(--primary-color)', fontFamily: 'var(--font-family-title)', marginBottom: '3rem' }}>Frequently Asked Questions</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqs.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div 
                key={idx}
                style={{
                  background: 'var(--surface-color)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 10,
                  overflow: 'hidden'
                }}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  style={{
                    width: '100%',
                    padding: '1.25rem 1.5rem',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    font: 'inherit',
                    fontWeight: 700,
                    color: 'var(--text-primary)'
                  }}
                >
                  <span>{faq.q}</span>
                  {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--accent-color)' }} /> : <ChevronDown size={18} style={{ color: 'var(--accent-color)' }} />}
                </button>

                {isExpanded && (
                  <div style={{ padding: '0 1.5rem 1.25rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-sec)', lineHeight: 1.6 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
