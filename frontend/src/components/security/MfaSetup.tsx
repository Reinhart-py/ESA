import React, { useState, useEffect } from 'react';
import { Shield, Key, Check, Copy, AlertTriangle, QrCode, Lock, Unlock, Download } from 'lucide-react';
import { apiClient } from '../../api/client.ts';

interface MfaStatus {
  enabled: boolean;
}

export default function MfaSetup() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Setup state
  const [setupDetails, setSetupDetails] = useState<{ secret: string; qrCodeUrl: string; backupCodes: string[] } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Disable state
  const [disableCode, setDisableCode] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);

  const checkMfaStatus = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/mfa/check');
      setIsEnabled(res.data.mfaRequired);
    } catch (err) {
      console.error('Failed to query MFA status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkMfaStatus();
  }, []);

  const handleInitiateSetup = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setSetupDetails(null);
    try {
      const res = await apiClient.post('/security/mfa/setup');
      setSetupDetails({
        secret: res.data.secret,
        qrCodeUrl: res.data.qrCodeUrl,
        backupCodes: res.data.backupCodes
      });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to initiate MFA setup.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiClient.post('/security/mfa/enable', {
        code: verificationCode
      });
      setSuccessMsg('Multi-Factor Authentication enabled successfully.');
      setIsEnabled(true);
      setSetupDetails(null);
      setVerificationCode('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableCode.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiClient.post('/security/mfa/disable', {
        code: disableCode
      });
      setSuccessMsg('Multi-Factor Authentication disabled.');
      setIsEnabled(false);
      setDisableCode('');
      setIsDisabling(false);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Disable failed. Invalid code or backup token.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (!setupDetails) return;
    navigator.clipboard.writeText(setupDetails.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleDownloadBackupCodes = () => {
    if (!setupDetails) return;
    const content = `Enterprise Operating System - MFA Backup Codes\n\nSave these codes in a secure location. Each code can only be used once.\n\n` + setupDetails.backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'mfa_backup_codes.txt');
    link.click();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
      
      {/* Configuration Status Card */}
      <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={18} style={{ color: 'var(--accent-color)' }} /> Multi-Factor Authentication (MFA)
        </h3>
        <p style={{ color: 'var(--text-sec)', fontSize: '0.85rem', margin: 0 }}>
          Protect your enterprise workspace by enforcing an extra layer of TOTP verification on login attempts.
        </p>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Current State Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
          {isEnabled ? (
            <>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.75rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={24} />
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.95rem' }}>MFA Enforced</strong>
                <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Your account is secured with standard TOTP credentials.</span>
              </div>
              <button
                onClick={() => setIsDisabling(true)}
                style={{ marginLeft: 'auto', padding: '0.4rem 0.8rem', background: 'none', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Disable
              </button>
            </>
          ) : (
            <>
              <div style={{ background: 'rgba(100, 116, 139, 0.15)', color: 'var(--text-sec)', padding: '0.75rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Unlock size={24} />
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.95rem' }}>MFA Inactive</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Secure your account credentials by setting up MFA authentication.</span>
              </div>
              <button
                onClick={handleInitiateSetup}
                disabled={loading}
                style={{ marginLeft: 'auto', padding: '0.4rem 0.8rem', background: 'var(--accent-color)', color: 'var(--text-primary)', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Configure setup
              </button>
            </>
          )}
        </div>

        {/* Setup Wizard */}
        {setupDetails && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
              {/* QR Code Container */}
              <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCode size={120} style={{ color: '#000' }} />
              </div>

              {/* Steps/Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>1. Scan QR Code</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-sec)', margin: 0 }}>
                  Scan the QR code with an authenticator app (Google Authenticator, Microsoft Authenticator, or 1Password).
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>OR ENTER TEXT KEY:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color)', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                    <code style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontFamily: 'monospace', flex: 1 }}>{setupDetails.secret}</code>
                    <button
                      onClick={handleCopySecret}
                      style={{ background: 'none', border: 'none', color: copiedSecret ? '#10b981' : '#94a3b8', cursor: 'pointer' }}
                    >
                      {copiedSecret ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Backup Codes */}
            <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>2. Save Backup Codes</span>
                <button
                  onClick={handleDownloadBackupCodes}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold' }}
                >
                  <Download size={12} /> Download Codes
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-sec)' }}>
                {setupDetails.backupCodes.map((c, idx) => (
                  <span key={idx}>{c}</span>
                ))}
              </div>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleEnableMfa} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-sec)', marginBottom: '0.25rem' }}>3. Enter Authenticator Token Code</label>
                <input
                  type="text"
                  placeholder="e.g. 123456"
                  maxLength={8}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{ padding: '0.5rem 1.2rem', background: 'var(--accent-color)', color: 'var(--text-primary)', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Verify & Enable
              </button>
            </form>
          </div>
        )}

        {/* Disable Dialog form */}
        {isDisabling && (
          <form onSubmit={handleDisableMfa} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <AlertTriangle size={14} /> Disable Authenticator Security
            </span>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-sec)', margin: 0 }}>
              To disable Multi-Factor Authentication, enter a code from your authenticator app or one of your backup recovery codes.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Authenticator code or backup code"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'var(--text-primary)', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Verify & Disable
              </button>
              <button
                type="button"
                onClick={() => setIsDisabling(false)}
                style={{ padding: '0.5rem 1rem', background: 'none', color: 'var(--text-sec)', border: '1px solid var(--card-border)', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Info Panel / Side Panel */}
      <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Key size={16} style={{ color: '#3b82f6' }} /> MFA Security Rules
        </h4>
        <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-sec)' }}>
          <li>
            <strong>Required on Login:</strong> Once enabled, your login screens will prompt for a 6-digit TOTP verification token before issuing session cookies.
          </li>
          <li>
            <strong>Backup Recovery:</strong> In case you lose access to your authenticator application, backup codes can bypass security screens. Each code is one-time use.
          </li>
          <li>
            <strong>Session Revocation:</strong> Enabling or disabling MFA resets all other active browser session tokens.
          </li>
        </ul>
      </div>

    </div>
  );
}
