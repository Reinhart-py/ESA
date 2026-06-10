import React from 'react';
import { Users, Layers, Award, ArrowRight, Check } from 'lucide-react';

interface FeaturesProps {
  themeMode: 'light' | 'dark';
  demoTransactions: any[];
  checklistItems: any[];
  onOpenFeature: (feature: string) => void;
}

export default function Features({
  themeMode,
  demoTransactions,
  checklistItems,
  onOpenFeature
}: FeaturesProps) {
  return (
    <section id="features" style={{ padding: '6rem 2rem', background: themeMode === 'light' ? '#F9FAFB' : '#111827' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '7rem' }}>
        
        {/* Feature 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#E0F2FE', color: '#0369A1', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} />
            </div>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: themeMode === 'light' ? 'var(--primary-color)' : 'var(--accent-color)', fontFamily: 'var(--font-family-title)' }}>One-on-one expert support</h3>
            <p style={{ color: 'var(--text-sec)', lineHeight: 1.6 }}>
              EAC Solutions gives you a dedicated team so you have a direct line to your own experts on desktop or mobile—professional support is just a few swipes, taps, or clicks away.
            </p>
            <button 
              onClick={() => onOpenFeature('support')}
              style={{ alignSelf: 'flex-start', background: 'var(--primary-color)', color: '#FFF', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              Launch Live Chat Simulator <ArrowRight size={16} />
            </button>
          </div>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2rem', borderRadius: 16, boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 'bold' }}>JM</div>
              <div>
                <h5 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Jessica Miller</h5>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stewardship Accountant</p>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-sec)', margin: 0 }}>
              "Hi! Reconciled your accounts for Q3. We saved you $1,400 in tax deductions from your office expenses!"
            </p>
          </div>
        </div>

        {/* Feature 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          <div style={{ order: 1 }}>
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2rem', borderRadius: 16, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ height: 120, display: 'flex', flexDirection: 'column', justifyItems: 'space-between', gap: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Quarterly VAT</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'green' }}>100% Ready</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--surface-color)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: 'green' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Income Reconciled</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#B58A2B' }}>80% Review</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--surface-color)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: '80%', height: '100%', background: '#B58A2B' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#D1FAE5', color: '#065F46', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={24} />
            </div>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: themeMode === 'light' ? 'var(--primary-color)' : 'var(--accent-color)', fontFamily: 'var(--font-family-title)' }}>Powerful financial reporting</h3>
            <p style={{ color: 'var(--text-sec)', lineHeight: 1.6 }}>
              The EAC Solutions platform gives you monthly financial statements and expense overviews to keep you in control of your money. At-a-glance visual reports help you see the big picture and give you actionable insights to help grow your business.
            </p>
            <button 
              onClick={() => onOpenFeature('reporting')}
              style={{ alignSelf: 'flex-start', background: 'var(--primary-color)', color: '#FFF', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              View Sample Reports <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Feature 3 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#E0F2FE', color: '#0284C7', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={24} />
            </div>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: themeMode === 'light' ? 'var(--primary-color)' : 'var(--accent-color)', fontFamily: 'var(--font-family-title)' }}>Real-time insights at your fingertips</h3>
            <p style={{ color: 'var(--text-sec)', lineHeight: 1.6 }}>
              Easily see your updated financial data every time you log in. With real-time insights, you can make on-the-fly decisions about where to spend and where to save, helping your business stay on budget.
            </p>
            <button 
              onClick={() => onOpenFeature('insights')}
              style={{ alignSelf: 'flex-start', background: 'var(--primary-color)', color: '#FFF', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              Try Transaction Categorizer <ArrowRight size={16} />
            </button>
          </div>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2rem', borderRadius: 16, boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>Live Dashboard Feed</span>
              <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '0.2rem 0.6rem', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700 }}>Active Connection</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {demoTransactions.slice(0, 2).map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--surface-color)', borderRadius: 8 }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem' }}>{item.merchant}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.date}</p>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'red' }}>${Math.abs(item.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature 4 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          <div style={{ order: 1 }}>
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2rem', borderRadius: 16, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {checklistItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, 
                      border: `2px solid ${item.checked ? 'green' : '#cbd5e1'}`,
                      background: item.checked ? 'green' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF'
                    }}>
                      {item.checked && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-sec)', textDecoration: item.checked ? 'line-through' : 'none' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#FEE2E2', color: '#991B1B', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={24} />
            </div>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: themeMode === 'light' ? 'var(--primary-color)' : 'var(--accent-color)', fontFamily: 'var(--font-family-title)' }}>Tax season, minus the stress</h3>
            <p style={{ color: 'var(--text-sec)', lineHeight: 1.6 }}>
              A year-end package with everything you need to file comes standard with EAC Solutions. Upgrade your plan, and cross even more off your to-do list. With our Bookkeeping &amp; Tax plan, you get expert tax prep, filing, and year-round tax advisory support.
            </p>
            <button 
              onClick={() => onOpenFeature('tax')}
              style={{ alignSelf: 'flex-start', background: 'var(--primary-color)', color: '#FFF', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              Open Compliance Checklist <ArrowRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
