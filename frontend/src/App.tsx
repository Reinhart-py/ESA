import React, { useContext, useState } from 'react';
import { AppContext, supabaseClient } from './context/AppContext.tsx';
import ClientPortal from './portals/ClientPortal.tsx';
import AccountantPortal from './portals/AccountantPortal.tsx';
import AdminPortal from './portals/AdminPortal.tsx';
import MarketingLanding from './components/MarketingLanding.tsx';


import { Shield, Lock, Mail, User, Loader2 } from 'lucide-react';
// @ts-ignore
import MarketingHub from './marketing/MarketingHub.jsx';

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

  const [mfaChecked, setMfaChecked] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');

  const [inviteToken, setInviteToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || '';
  });
  const [inviteData, setInviteData] = useState<any>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteValidated, setInviteValidated] = useState(false);

  // Auth modal toggle used inside MarketingHub login trigger
  const [showAuthModal, setShowAuthModal] = useState(false);

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
          setShowAuthModal(true); // Open auth modal for validation
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

  React.useEffect(() => {
    if (sessionToken) {
      const checkMfa = async () => {
        try {
          const res = await fetch('http://localhost:5000/api/auth/mfa/check', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sessionToken}`
            }
          });
          const data = await res.json();
          if (data.mfaRequired) {
            const verifiedToken = localStorage.getItem('mfa_verified_token');
            if (!verifiedToken) {
              setMfaRequired(true);
            }
          }
          setMfaChecked(true);
        } catch (err) {
          console.error('MFA check failed', err);
          setMfaChecked(true);
        }
      };
      checkMfa();
    } else {
      setMfaRequired(false);
      setMfaChecked(false);
    }
  }, [sessionToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Developer Local Demo Mode Bypass
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail.endsWith('@eac.local') || cleanEmail === 'admin' || cleanEmail === 'accountant' || cleanEmail === 'client') {
      let role = 'client_owner';
      if (cleanEmail.startsWith('admin') || cleanEmail === 'admin') role = 'super_admin';
      else if (cleanEmail.startsWith('accountant') || cleanEmail === 'accountant') role = 'accountant';
      
      try {
        const res = await fetch('http://localhost:5000/api/auth/mfa/check', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer demo_token'
          }
        });
        const data = await res.json();
        if (data.mfaRequired) {
          const mfaToken = localStorage.getItem('mfa_verified_token');
          if (!mfaToken) {
            localStorage.setItem('supabase_token', 'demo_token');
            localStorage.setItem('eac_role', role);
            setMfaRequired(true);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        // Ignore API failures in demo mode
      }

      localStorage.setItem('supabase_token', 'demo_token');
      localStorage.setItem('eac_role', role);
      context.setSessionToken('demo_token');
      context.setUserRole(role);
      setLoading(false);
      return;
    }

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
    try {
      await supabaseClient.auth.signOut();
    } catch (e) {}
    localStorage.removeItem('supabase_token');
    context.setSessionToken(null);
    setUserRole('guest');
  };

  // Switch portals based on verified roles
  if (sessionToken && currentUser) {
    if (mfaRequired && !localStorage.getItem('mfa_verified_token')) {
      return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0B192C', color: '#fff', padding: '2rem' }}>
          <div style={{ background: '#1E3E62', padding: '2.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', maxWidth: '400px', width: '100%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
              <Shield size={48} style={{ color: '#00a896', marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Two-Factor Verification</h2>
              <p style={{ fontSize: '0.875rem', color: '#9CA3AF', marginTop: '0.5rem', textAlign: 'center' }}>
                Please enter the 6-digit verification code from your authenticator app or a backup recovery code.
              </p>
            </div>

            {mfaError && (
              <div style={{ background: '#ef444415', borderLeft: '4px solid #ef4444', padding: '0.75rem', borderRadius: '6px', color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 500 }}>
                {mfaError}
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              setMfaLoading(true);
              setMfaError('');
              try {
                const res = await fetch('http://localhost:5000/api/auth/mfa/verify-login', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionToken}`
                  },
                  body: JSON.stringify({ token: mfaCode })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Verification failed');
                
                localStorage.setItem('mfa_verified_token', data.mfaToken);
                setMfaRequired(false);
              } catch (err: any) {
                setMfaError(err.message || 'Invalid code');
              } finally {
                setMfaLoading(false);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="text" 
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value.trim())}
                placeholder="Code or Backup Token"
                style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff', textAlign: 'center', fontSize: '1.1rem', fontWeight: 600, outline: 'none' }}
                autoFocus
              />
              <button 
                type="submit" 
                disabled={mfaLoading || !mfaCode}
                style={{ padding: '0.75rem', background: '#00a896', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {mfaLoading && <Loader2 size={16} className="animate-spin" />}
                Verify & Access Account
              </button>
            </form>

            <button 
              onClick={handleLogout}
              style={{ width: '100%', marginTop: '1rem', background: 'none', border: 'none', color: '#9CA3AF', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Cancel & Log Out
            </button>
          </div>
        </div>
      );
    }

    if (userRole === 'super_admin' || userRole === 'admin') {
      return <AdminPortal onLogout={handleLogout} />;
    } else if (['accountant', 'senior_accountant', 'tax_specialist', 'compliance_officer', 'payroll_specialist'].includes(userRole)) {
      return <AccountantPortal onLogout={handleLogout} />;
    } else {
      return <ClientPortal onLogout={handleLogout} />;
    }
  }

  return (
    <>
      <MarketingHub onLogin={() => setShowAuthModal(true)} />
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--card-border, #ccc)', padding: '2rem', borderRadius: '12px', width: '400px', position: 'relative', color: 'var(--text-primary, #000)' }}>
            <button onClick={() => { setShowAuthModal(false); setInviteToken(''); }} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}>✕</button>
            
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.4rem' }}>
              {inviteToken ? 'Accept Invitation Workspace' : (isRegister ? 'Register EAC Account' : 'Sign In To Portal')}
            </h3>
            
            <form onSubmit={inviteToken ? handleAcceptInviteSubmit : (isRegister ? handleRegister : handleLogin)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {isRegister && !inviteToken && (
                <>
                  <input type="text" required placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
                  <input type="text" required placeholder="Company Name" value={businessName} onChange={e => setBusinessName(e.target.value)} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
                  <input type="text" required placeholder="Business Type (e.g. LLC)" value={businessType} onChange={e => setBusinessType(e.target.value)} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
                </>
              )}

              {inviteToken && (
                <input type="text" required placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
              )}

              <input type="email" required placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
              <input type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />

              {error && <span style={{ color: 'red', fontSize: '0.8rem' }}>{error}</span>}

              <button type="submit" disabled={loading} style={{ padding: '0.6rem', background: '#B58A2B', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
                {loading ? 'Processing Workspace...' : (inviteToken ? 'Accept & Access' : (isRegister ? 'Register & Trial' : 'Sign In'))}
              </button>
            </form>

            {!inviteToken && (
              <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-sec)' }}>{isRegister ? 'Already registered?' : 'No active workspace?'}</span>{' '}
                <button onClick={() => setIsRegister(!isRegister)} style={{ background: 'none', border: 'none', color: '#B58A2B', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>
                  {isRegister ? 'Log In' : 'Register Free Trial'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
