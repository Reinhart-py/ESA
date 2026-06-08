import React, { useContext, useState } from 'react';
import { AppContext, supabaseClient } from './context/AppContext.tsx';
import ClientPortal from './portals/ClientPortal.tsx';
import AccountantPortal from './portals/AccountantPortal.tsx';
import AdminPortal from './portals/AdminPortal.tsx';
import { Shield, Lock, Mail, User } from 'lucide-react';

function App() {
  const context = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [inviteToken, setInviteToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || '';
  });
  const [inviteData, setInviteData] = useState<any>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteValidated, setInviteValidated] = useState(false);

  if (!context) return null;

  const { userRole, setUserRole, sessionToken, currentUser } = context;

  // Validate invite token on load
  React.useEffect(() => {
    if (inviteToken && !inviteValidated) {
      setInviteLoading(true);
      setError('');
      fetch(`http://localhost:5000/api/auth/invite/validate?token=${inviteToken}`)
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Invalid invitation token');
          setInviteData(data);
          setEmail(data.email); // Auto-fill email
          setInviteValidated(true);
        })
        .catch((err) => {
          setError(err.message);
          setInviteToken('');
        })
        .finally(() => {
          setInviteLoading(false);
        });
    }
  }, [inviteToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: loginErr } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (loginErr) throw loginErr;
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, businessName, businessType })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      // Auto signin after register
      const { error: loginErr } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (loginErr) throw loginErr;
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // 1. Sign up user in Supabase Auth
      const { data: signUpData, error: signUpErr } = await supabaseClient.auth.signUp({
        email,
        password,
      });

      if (signUpErr) throw signUpErr;
      if (!signUpData.user) throw new Error('User creation failed');

      // 2. Accept invite in backend to create public profile linked to tenant
      const res = await fetch('http://localhost:5000/api/auth/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: inviteToken,
          userId: signUpData.user.id,
          fullName
        })
      });

      const acceptData = await res.json();
      if (!res.ok) throw new Error(acceptData.error || 'Failed to link account to organization');

      // 3. Clear token to redirect to dashboard upon active session detection
      setInviteToken('');
      
      // 4. Force login trigger
      const { error: loginErr } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (loginErr) throw loginErr;
    } catch (err: any) {
      setError(err.message || 'Invitation acceptance failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    setUserRole('guest');
  };

  // Switch portals based on verified roles
  if (sessionToken && currentUser) {
    if (userRole === 'super_admin' || userRole === 'admin') {
      return <AdminPortal onLogout={handleLogout} />;
    } else if (['accountant', 'senior_accountant', 'tax_specialist', 'compliance_officer', 'payroll_specialist'].includes(userRole)) {
      return <AccountantPortal onLogout={handleLogout} />;
    } else {
      return <ClientPortal onLogout={handleLogout} />;
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      fontFamily: 'Inter, sans-serif',
      color: '#fff',
      padding: '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '450px',
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(16px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '2.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            marginBottom: '1rem'
          }}>
            <Shield size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 0.5rem 0' }}>
            EAC Solutions
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Enterprise Regulatory & Compliance Portal
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
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', background: 'rgba(0,168,150,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid #00A896' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#00A896' }}>
                You have been invited to join the organization as a <strong>{inviteData?.role}</strong>.
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
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                  transition: 'opacity 0.2s'
                }}
              >
                {loading ? 'Processing...' : isRegister ? 'Register Enterprise Account' : 'Sign In'}
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
  );
}

export default App;
