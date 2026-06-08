import React, { useState } from 'react';
import { 
  Shield, Lock, Mail, User, Check, Sparkles, 
  Terminal, Activity, BookOpen, Layers, ArrowRight, X 
} from 'lucide-react';

interface MarketingLandingProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  fullName: string;
  setFullName: (val: string) => void;
  businessName: string;
  setBusinessName: (val: string) => void;
  businessType: string;
  setBusinessType: (val: string) => void;
  isRegister: boolean;
  setIsRegister: (val: boolean) => void;
  error: string;
  loading: boolean;
  handleLogin: (e: React.FormEvent) => Promise<void>;
  handleRegister: (e: React.FormEvent) => Promise<void>;
  inviteToken: string;
  inviteValidated: boolean;
  inviteData: any;
  handleAcceptInviteSubmit: (e: React.FormEvent) => Promise<void>;
}

export default function MarketingLanding({
  email, setEmail,
  password, setPassword,
  fullName, setFullName,
  businessName, setBusinessName,
  businessType, setBusinessType,
  isRegister, setIsRegister,
  error,
  loading,
  handleLogin,
  handleRegister,
  inviteToken,
  inviteValidated,
  inviteData,
  handleAcceptInviteSubmit
}: MarketingLandingProps) {
  const [showAuthModal, setShowAuthModal] = useState(inviteToken && inviteValidated);

  const handleOpenAuth = (registerMode: boolean) => {
    setIsRegister(registerMode);
    setShowAuthModal(true);
  };

  const handleCloseAuth = () => {
    if (inviteToken && inviteValidated) return; // Force invite acceptance if token present
    setShowAuthModal(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(ellipse at top, #0f172a, #020617)', 
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, sans-serif',
      overflowX: 'hidden'
    }}>
      {/* Navbar */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #00A896 0%, #3b82f6 100%)',
            width: 36,
            height: 36,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0, 168, 150, 0.3)'
          }}>
            <Shield size={20} color="#fff" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.025em' }}>EAC Solutions</span>
        </div>

        <nav style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: '#94a3b8' }}>
          <a href="#features" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>Features</a>
          <a href="#pricing" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>Pricing</a>
        </nav>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => handleOpenAuth(false)}
            style={{
              padding: '0.5rem 1.25rem',
              background: 'transparent',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'background 0.2s'
            }}
          >
            Sign In
          </button>
          <button 
            onClick={() => handleOpenAuth(true)}
            style={{
              padding: '0.5rem 1.25rem',
              background: '#00A896',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'opacity 0.2s'
            }}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        maxWidth: '1000px',
        margin: '5rem auto 3rem auto',
        padding: '0 2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1rem',
          background: 'rgba(0, 168, 150, 0.1)',
          border: '1px solid rgba(0, 168, 150, 0.2)',
          borderRadius: 99,
          fontSize: '0.8rem',
          fontWeight: 600,
          color: '#00d2c4'
        }}>
          <Sparkles size={14} /> The Next-Gen Finance Operating System
        </div>

        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          margin: 0,
          background: 'linear-gradient(to right, #ffffff, #94a3b8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Consolidate Finance & Compliance<br/>in a Single Workspace
        </h1>

        <p style={{
          fontSize: '1.15rem',
          color: '#94a3b8',
          maxWidth: '640px',
          lineHeight: 1.6,
          margin: 0
        }}>
          Automate your double-entry General Ledger, track real-time regulatory compliance obligations, manage secure vault documents, and leverage signed webhook integrations.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button 
            onClick={() => handleOpenAuth(true)}
            style={{
              padding: '0.75rem 2rem',
              background: 'linear-gradient(135deg, #00A896 0%, #028090 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 10px 25px -5px rgba(0, 168, 150, 0.4)'
            }}
          >
            Deploy Console <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{
        maxWidth: '1200px',
        margin: '6rem auto',
        padding: '0 2rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Built for Scale and Compliance</h2>
          <p style={{ color: '#94a3b8' }}>A comprehensive stack tailored for founders, operators, and developers.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          {/* Card 1 */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 16,
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ background: 'rgba(0, 168, 150, 0.1)', color: '#00A896', width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={22} />
            </div>
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Double-Entry Ledger</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              Verify balance sheets and trial balances with cryptographic audit records and multi-company account trees.
            </p>
          </div>

          {/* Card 2 */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 16,
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={22} />
            </div>
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Compliance Tracker</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              Track filing status, set reminders, upload evidence, and manage regional regulatory obligations seamlessly.
            </p>
          </div>

          {/* Card 3 */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 16,
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Terminal size={22} />
            </div>
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Developer Integrations</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              Configure SHA-256 API tokens and HMAC-signed webhook URLs to stream event updates directly into your systems.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{
        maxWidth: '1200px',
        margin: '6rem auto',
        padding: '0 2rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        paddingTop: '6rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Simple, Transparent Pricing</h2>
          <p style={{ color: '#94a3b8' }}>Select the package that fits your operational complexity.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          alignItems: 'stretch'
        }}>
          {/* Plan 1 */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 16,
            padding: '2.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>STARTUP</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', margin: '0.75rem 0' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>$49</span>
                <span style={{ color: '#94a3b8' }}>/mo</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '2rem' }}>Ideal for early-stage companies needing basic compliance tracking.</p>
              
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#00A896" /> 1 Operating Tenant</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#00A896" /> Basic Ledger Engine</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#00A896" /> 50 GB Vault Storage</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#00A896" /> Email Support Queue</li>
              </ul>
            </div>
            <button 
              onClick={() => handleOpenAuth(true)}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginTop: '2rem',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              Choose Plan
            </button>
          </div>

          {/* Plan 2 - Featured */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '2px solid #00A896',
            borderRadius: 16,
            padding: '2.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            boxShadow: '0 20px 40px -15px rgba(0, 168, 150, 0.15)'
          }}>
            <div style={{
              position: 'absolute',
              top: '-12px',
              right: '24px',
              background: '#00A896',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.25rem 0.75rem',
              borderRadius: 99
            }}>
              RECOMMENDED
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#00A896', fontWeight: 700 }}>SCALE</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', margin: '0.75rem 0' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>$149</span>
                <span style={{ color: '#94a3b8' }}>/mo</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '2rem' }}>Perfect for growing enterprises looking for custom integrations.</p>
              
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#00A896" /> Up to 5 Operating Tenants</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#00A896" /> Double-Entry General Ledger</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#00A896" /> 500 GB Vault Storage</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#00A896" /> Developer API & Signed Webhooks</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#00A896" /> Priority Helpdesk Queue</li>
              </ul>
            </div>
            <button 
              onClick={() => handleOpenAuth(true)}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginTop: '2rem',
                background: '#00A896',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
            >
              Choose Plan
            </button>
          </div>

          {/* Plan 3 */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 16,
            padding: '2.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>ENTERPRISE</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', margin: '0.75rem 0' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>$499</span>
                <span style={{ color: '#94a3b8' }}>/mo</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '2rem' }}>For large enterprises demanding high scale and absolute safety.</p>
              
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#00A896" /> Unlimited Tenants</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#00A896" /> Dedicated Database Isolation</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#00A896" /> 5 TB Vault Storage</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#00A896" /> 24/7 Phone & Slack Support</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#00A896" /> Dedicated Account Manager</li>
              </ul>
            </div>
            <button 
              onClick={() => handleOpenAuth(true)}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginTop: '2rem',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              Choose Plan
            </button>
          </div>
        </div>
      </section>

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '450px',
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '2.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}>
            {/* Close Button */}
            {(!inviteToken || !inviteValidated) && (
              <button 
                onClick={handleCloseAuth}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            )}

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #00A896 0%, #3b82f6 100%)',
                marginBottom: '1rem',
                boxShadow: '0 0 20px rgba(0, 168, 150, 0.2)'
              }}>
                <Shield size={32} color="#fff" />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 0.5rem 0' }}>
                {inviteToken && inviteValidated ? 'Complete Setup' : isRegister ? 'Create Account' : 'Sign In'}
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                {inviteToken && inviteValidated ? 'Join your enterprise workspace' : 'EAC Solutions Enterprise Console'}
              </p>
            </div>

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: '#f87171',
                fontSize: '0.875rem',
                marginBottom: '1.5rem'
              }}>
                {error}
              </div>
            )}

            {inviteToken && inviteValidated ? (
              <form onSubmit={handleAcceptInviteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '0.5rem', background: 'rgba(0,168,150,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #00A896' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#00A896' }}>
                    Invited as: <strong>{inviteData?.role}</strong>
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', outline: 'none' }}
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    style={{ width: '100%', padding: '0.75rem 1rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#94a3b8', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Create Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', outline: 'none' }}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'linear-gradient(135deg, #00A896 0%, #028090 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '0.5rem',
                    transition: 'opacity 0.2s'
                  }}
                >
                  {loading ? 'Setting up profile...' : 'Accept Invite & Join Workspace'}
                </button>
              </form>
            ) : (
              <>
                <form onSubmit={isRegister ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {isRegister && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Full Name</label>
                        <div style={{ position: 'relative' }}>
                          <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', outline: 'none' }}
                            placeholder="John Doe"
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Business Name</label>
                        <input
                          type="text"
                          required
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          style={{ width: '100%', padding: '0.75rem 1rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', outline: 'none' }}
                          placeholder="Acme Corp"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Business Type</label>
                        <input
                          type="text"
                          required
                          value={businessType}
                          onChange={(e) => setBusinessType(e.target.value)}
                          style={{ width: '100%', padding: '0.75rem 1rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', outline: 'none' }}
                          placeholder="SaaS / Logistics / Retail"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', outline: 'none' }}
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', outline: 'none' }}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'linear-gradient(135deg, #00A896 0%, #3b82f6 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginTop: '0.5rem',
                      transition: 'opacity 0.2s'
                    }}
                  >
                    {loading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In'}
                  </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
                  <button
                    onClick={() => setIsRegister(!isRegister)}
                    style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 500 }}
                  >
                    {isRegister ? 'Already have an account? Sign In' : 'New enterprise tenant? Register here'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
