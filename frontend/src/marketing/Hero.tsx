import React from 'react';
import { Sparkles, Award } from 'lucide-react';

interface HeroProps {
  themeMode: 'light' | 'dark';
  onOpenAuth: (registerMode: boolean) => void;
  onOpenChat: () => void;
  onOpenFeature: (feature: string) => void;
}

export default function Hero({
  themeMode,
  onOpenAuth,
  onOpenChat,
  onOpenFeature
}: HeroProps) {
  return (
    <section style={{
      background: themeMode === 'light' ? 'var(--primary-color)' : 'var(--bg-color)',
      color: '#FFFFFF',
      padding: '6rem 2rem 7rem 2rem',
      borderBottom: themeMode === 'dark' ? '1px solid var(--card-border)' : 'none',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.05,
        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '850px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1.2rem',
            background: 'var(--color-success-bg)',
            border: '1px solid var(--color-success)',
            borderRadius: 99,
            fontSize: '0.8rem',
            fontWeight: 700,
            alignSelf: 'center',
            marginBottom: '1.5rem'
          }}>
            <Sparkles size={14} /> Humanized Precision in Accounting
          </div>
          <h1 style={{
            fontSize: '3.75rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            margin: '0 0 1.5rem 0',
            fontFamily: 'var(--font-family-title)'
          }}>
            Confidence in your numbers without doing the math.
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: themeMode === 'light' ? '#CBD5E1' : 'var(--text-muted)',
            lineHeight: 1.6,
            marginBottom: '2.5rem',
            maxWidth: '700px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Get a dedicated bookkeeper in your corner who really knows your business, backed by software that keeps everything organized and visible. You get clarity when you need it and stay focused on running your business.
          </p>
          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
            <button 
              onClick={() => {
                const element = document.getElementById('consultation-form');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                padding: '0.9rem 2.5rem',
                background: 'var(--accent-color)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: '1.05rem',
                fontWeight: 700,
                boxShadow: '0 10px 20px rgba(181, 138, 43, 0.2)',
                transition: 'transform 0.2s, background-color 0.2s'
              }}
            >
              Schedule Consultation
            </button>
            <button 
              onClick={() => onOpenAuth(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: '6px'
              }}
            >
              Start Free Trial
            </button>
          </div>
        </div>

        {/* Interactive Floating Chat Bubble Demo */}
        <div style={{ marginTop: '5rem', width: '100%', maxWidth: '1000px', position: 'relative' }}>
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: 16,
            padding: '1.5rem',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--card-border)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--color-success)' }} />
                <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>Live Portal Demo Overview</span>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-sec)' }}>Status: Ready for Onboarding</span>
            </div>
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-color)', borderRadius: 12, border: '1px dashed var(--card-border)' }}>
              <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
                <Award size={48} color="var(--accent-color)" style={{ margin: '0 auto 1rem auto' }} />
                <h4 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Experience Managed Precision</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-sec)', marginBottom: '1.5rem' }}>See real dashboard mockups and check write-off calculators by clicking the interactives below.</p>
                <button 
                  onClick={() => onOpenFeature('reporting')}
                  style={{ background: 'var(--primary-color)', color: '#FFF', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Open Feature Previews
                </button>
              </div>
            </div>
          </div>

          {/* Clickable float chat simulation */}
          <div 
            onClick={onOpenChat}
            style={{
              position: 'absolute',
              top: '-2.5rem',
              right: '2rem',
              background: 'var(--card-bg)',
              padding: '1rem',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              maxWidth: '300px',
              cursor: 'pointer',
              textAlign: 'left',
              borderLeft: '4px solid var(--accent-color)',
              color: 'var(--text-primary)'
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>JM</div>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>DEDICATED STEWARD</p>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>"Hey! Jessica here. Your books are ready to reconcile. Tap to chat!"</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
