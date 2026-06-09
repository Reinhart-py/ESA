import React, { useState, useEffect, useContext } from 'react';
import { apiClient } from '../api/client.ts';
import { AppContext } from '../context/AppContext.tsx';
import { 
  Shield, ShieldCheck, ShieldAlert, Key, Copy, Check, 
  Loader2, RefreshCw, Smartphone, Eye, EyeOff, Clipboard
} from 'lucide-react';

export default function ProfileSettings() {
  const context = useContext(AppContext);
  if (!context) return null;

  const { currentUser } = context;
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mfaSetupData, setMfaSetupData] = useState<{ secret: string; qrCodeUrl: string; backupCodes: string[] } | null>(null);
  const [setupStep, setSetupStep] = useState<'idle' | 'showing_qr' | 'success'>('idle');
  
  // Verification code inputs
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaSuccess, setMfaSuccess] = useState('');
  
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Check current MFA Status
  const checkMfaStatus = async () => {
    setLoading(true);
    setMfaError('');
    try {
      const token = localStorage.getItem('supabase_token');
      if (!token) return;
      
      const res = await apiClient.post('/auth/mfa/check', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMfaEnabled(res.data.mfaRequired);
    } catch (err: any) {
      console.error('Failed to fetch MFA status:', err);
      setMfaError('Could not sync current MFA status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkMfaStatus();
  }, []);

  // Initiate MFA Setup
  const handleSetupMfa = async () => {
    setActionLoading(true);
    setMfaError('');
    setMfaSuccess('');
    try {
      const res = await apiClient.post('/auth/mfa/setup');
      setMfaSetupData(res.data);
      setSetupStep('showing_qr');
    } catch (err: any) {
      setMfaError(err.response?.data?.error || 'Failed to initiate MFA setup.');
    } finally {
      setActionLoading(false);
    }
  };

  // Verify and Confirm Enable
  const handleVerifyEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setMfaError('Please enter a valid 6-digit code.');
      return;
    }
    setActionLoading(true);
    setMfaError('');
    try {
      await apiClient.post('/auth/mfa/enable', { token: verificationCode });
      setMfaEnabled(true);
      setSetupStep('success');
      setMfaSuccess('Multi-factor Authentication enabled successfully!');
      
      // Save dummy mfa token if developer bypass or get session verification updated
      const token = localStorage.getItem('supabase_token');
      if (token && (token === 'demo_token' || token.startsWith('demo_'))) {
        // Sign simple local token
        localStorage.setItem('mfa_verified_token', 'demo_verified');
      }
    } catch (err: any) {
      setMfaError(err.response?.data?.error || 'Verification failed. Please check your token and try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Disable MFA
  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableCode) {
      setMfaError('Please enter verification code or backup code.');
      return;
    }
    setActionLoading(true);
    setMfaError('');
    setMfaSuccess('');
    try {
      await apiClient.post('/auth/mfa/disable', { token: disableCode });
      setMfaEnabled(false);
      setSetupStep('idle');
      setMfaSetupData(null);
      setDisableCode('');
      localStorage.removeItem('mfa_verified_token');
      setMfaSuccess('Multi-factor Authentication disabled successfully.');
    } catch (err: any) {
      setMfaError(err.response?.data?.error || 'Failed to disable MFA. Verify code or backup token.');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'secret' | 'codes') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', color: '#1E3E62' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: '#00a896' }} />
        <span style={{ marginLeft: '1rem', fontWeight: 500 }}>Syncing Security Credentials...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Profile Info Header */}
      <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0B192C', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield style={{ color: '#00a896' }} /> Security & Profile Settings
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Full Name</label>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>{currentUser?.full_name || 'EAC User'}</p>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Email Address</label>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>{currentUser?.email || 'user@eacsolutions.com'}</p>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Role Profile</label>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 600, color: '#00a896', textTransform: 'capitalize' }}>
              {(currentUser?.role || 'Guest').replace('_', ' ')}
            </p>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Organization Workspace</label>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.05rem', fontWeight: 600, color: '#1e293b', fontFamily: 'monospace' }}>
              {currentUser?.tenant_id || 'Global Admin Space'}
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Factor Authentication Section */}
      <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0B192C', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Smartphone style={{ color: '#00a896' }} /> Two-Factor Authentication (2FA / TOTP)
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Protect your account from unauthorized access with cryptographic time-based security.
            </p>
          </div>
          <div>
            {mfaEnabled ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#D1FAE5', color: '#065F46', padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700 }}>
                <ShieldCheck size={14} /> Enabled
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#FEE2E2', color: '#991B1B', padding: '0.25rem 0.75rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700 }}>
                <ShieldAlert size={14} /> Disabled
              </span>
            )}
          </div>
        </div>

        {/* Success/Error Alerts */}
        {mfaError && (
          <div style={{ background: '#FEF2F2', borderLeft: '4px solid #EF4444', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', color: '#991B1B', fontSize: '0.9rem', fontWeight: 500 }}>
            {mfaError}
          </div>
        )}
        {mfaSuccess && (
          <div style={{ background: '#F0FDF4', borderLeft: '4px solid #22C55E', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', color: '#166534', fontSize: '0.9rem', fontWeight: 500 }}>
            {mfaSuccess}
          </div>
        )}

        {/* Render setup states */}
        {!mfaEnabled && setupStep === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.5rem 0' }}>
            <ShieldAlert size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: '#1e293b' }}>MFA is currently inactive</h4>
            <p style={{ margin: '0 0 1.5rem 0', maxWidth: '500px', fontSize: '0.9rem', color: '#64748b' }}>
              We strongly recommend enabling multi-factor authentication to secure legal documents, accounting ledgers, and company compliance resources.
            </p>
            <button 
              onClick={handleSetupMfa}
              disabled={actionLoading}
              style={{ padding: '0.75rem 1.5rem', background: '#00a896', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s' }}
            >
              {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />}
              Configure 2FA Authenticator
            </button>
          </div>
        )}

        {!mfaEnabled && setupStep === 'showing_qr' && mfaSetupData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontWeight: 700 }}>Step 1: Scan QR Code or Copy Setup Key</h4>
              <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.875rem', color: '#64748b' }}>
                Open Google Authenticator, Microsoft Authenticator, Authy, or your preferred authenticator app, and scan the barcode below or input the manual text key.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'row', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                {/* QR Code Container */}
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(mfaSetupData.qrCodeUrl)}`} 
                    alt="MFA QR Code"
                    style={{ width: '160px', height: '160px' }}
                  />
                </div>

                {/* Secret Key Container */}
                <div style={{ flex: 1, minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Manual Setup Key</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        readOnly 
                        value={mfaSetupData.secret} 
                        style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f1f5f9', fontFamily: 'monospace', fontSize: '0.9rem', color: '#334155', outline: 'none' }}
                      />
                      <button 
                        onClick={() => copyToClipboard(mfaSetupData.secret, 'secret')}
                        style={{ padding: '0.5rem', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Copy to clipboard"
                      >
                        {copiedSecret ? <Check size={16} style={{ color: '#22c55e' }} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ background: '#FEF3C7', padding: '0.75rem', borderRadius: '6px', border: '1px solid #FCD34D', display: 'flex', gap: '0.5rem' }}>
                    <ShieldAlert size={20} style={{ color: '#D97706', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.75rem', color: '#92400E', lineHeight: '1.25rem' }}>
                      <strong>Do not share this key:</strong> Anyone who obtains this setup key can generate security codes and access your account.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Backup Codes */}
            <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontWeight: 700 }}>Step 2: Save Your Backup Recovery Codes</h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#64748b' }}>
                If you lose access to your authenticator application, you can use these single-use backup codes to login. Store them securely.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', margin: '1rem 0', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                {mfaSetupData.backupCodes.map((code, idx) => (
                  <div key={idx} style={{ background: '#fff', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1e293b' }}>
                    {code}
                  </div>
                ))}
              </div>

              <button 
                onClick={() => copyToClipboard(mfaSetupData.backupCodes.join('\n'), 'codes')}
                style={{ background: 'none', border: 'none', color: '#00a896', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}
              >
                {copiedCodes ? <><Check size={14} style={{ color: '#22c55e' }} /> Saved Codes</> : <><Copy size={14} /> Copy Backup Codes</>}
              </button>
            </div>

            {/* Verification confirmation */}
            <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontWeight: 700 }}>Step 3: Confirm Setup</h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#64748b' }}>
                Enter the 6-digit verification code generated by your authenticator application to verify the configuration.
              </p>

              <form onSubmit={handleVerifyEnable} style={{ display: 'flex', gap: '0.75rem', maxWidth: '380px' }}>
                <input 
                  type="text" 
                  maxLength={6}
                  pattern="\d*"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.25em', fontWeight: 700, outline: 'none' }}
                />
                <button 
                  type="submit" 
                  disabled={actionLoading || verificationCode.length !== 6}
                  style={{ padding: '0.5rem 1.25rem', background: '#00a896', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  {actionLoading && <Loader2 size={16} className="animate-spin" />}
                  Verify & Activate
                </button>
              </form>
            </div>
          </div>
        )}

        {mfaEnabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1.5rem', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <ShieldCheck size={28} style={{ color: '#059669', flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: '#065F46', fontWeight: 700 }}>MFA Verification is Enabled</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#047857', lineHeight: '1.25rem' }}>
                  Your account is secured with a Time-Based One-Time Password (TOTP) factor. You will be prompted to provide authentication codes when logging in to the EAC Solutions Platform.
                </p>
              </div>
            </div>

            {/* Disable MFA form */}
            <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#991B1B', fontWeight: 700 }}>Disable Two-Factor Authentication</h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#64748b' }}>
                Disabling MFA reduces account security. To disable, enter the current 6-digit authenticator code or one of your unused backup recovery codes.
              </p>

              <form onSubmit={handleDisableMfa} style={{ display: 'flex', gap: '0.75rem', maxWidth: '420px' }}>
                <input 
                  type="text" 
                  value={disableCode}
                  onChange={e => setDisableCode(e.target.value.trim())}
                  placeholder="Code or Backup Token"
                  style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
                />
                <button 
                  type="submit" 
                  disabled={actionLoading || !disableCode}
                  style={{ padding: '0.5rem 1.25rem', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  {actionLoading && <Loader2 size={16} className="animate-spin" />}
                  Deactivate 2FA
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}
