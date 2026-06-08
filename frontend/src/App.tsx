import React, { useContext, useState } from 'react';
import { AppContext, supabaseClient } from './context/AppContext.tsx';
import ClientPortal from './portals/ClientPortal.tsx';
import AccountantPortal from './portals/AccountantPortal.tsx';
import AdminPortal from './portals/AdminPortal.tsx';
import MarketingLanding from './components/MarketingLanding.tsx';
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
    <MarketingLanding
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      fullName={fullName}
      setFullName={setFullName}
      businessName={businessName}
      setBusinessName={setBusinessName}
      businessType={businessType}
      setBusinessType={setBusinessType}
      isRegister={isRegister}
      setIsRegister={setIsRegister}
      error={error}
      loading={loading}
      handleLogin={handleLogin}
      handleRegister={handleRegister}
      inviteToken={inviteToken}
      inviteValidated={inviteValidated}
      inviteData={inviteData}
      handleAcceptInviteSubmit={handleAcceptInviteSubmit}
    />
  );
}

export default App;
