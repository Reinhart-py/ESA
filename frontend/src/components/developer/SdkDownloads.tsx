import React, { useState, useEffect } from 'react';
import { Download, Copy, Check, Code, Blocks } from 'lucide-react';
import { apiClient } from '../../api/client.ts';

interface SdkRelease {
  id: string;
  version: string;
  language: string;
  download_url: string;
  released_at: string;
}

export default function SdkDownloads() {
  const [sdks, setSdks] = useState<SdkRelease[]>([]);
  const [copiedLang, setCopiedLang] = useState<string | null>(null);

  useEffect(() => {
    const fetchSdks = async () => {
      try {
        const res = await apiClient.get('/developer/sdks');
        setSdks(res.data || []);
      } catch (err) {
        console.error('Failed to fetch SDK builds list:', err);
      }
    };
    fetchSdks();
  }, []);

  const getInstallCmd = (language: string) => {
    switch (language) {
      case 'Node.js': return 'npm install @enterpriseos/sdk';
      case 'Python': return 'pip install enterpriseos-sdk';
      case 'Go': return 'go get github.com/enterpriseos/sdk-go';
      default: return 'npm install @enterpriseos/sdk';
    }
  };

  const handleCopyInstall = (lang: string, cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedLang(lang);
    setTimeout(() => setCopiedLang(null), 2000);
  };

  return (
    <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Blocks size={18} style={{ color: '#00a896' }} /> Client SDK Libraries
      </h3>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
        Accelerate your integrations using our officially maintained client SDKs. Download compiled libraries or install packages directly via CLI manager repositories.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
        {sdks.map((sdk) => {
          const installCmd = getInstallCmd(sdk.language);
          const isCopied = copiedLang === sdk.language;

          return (
            <div key={sdk.id} style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>{sdk.language} SDK</span>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(0,168,150,0.15)', color: '#00a896', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                    v{sdk.version}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '1rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>INSTALLATION</span>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#1e293b', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)' }}>
                    <code style={{ fontSize: '0.75rem', color: '#fff', fontFamily: 'monospace', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {installCmd}
                    </code>
                    <button
                      onClick={() => handleCopyInstall(sdk.language, installCmd)}
                      style={{ background: 'none', border: 'none', color: isCopied ? '#10b981' : '#94a3b8', cursor: 'pointer', padding: '0.2rem' }}
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  Released: {new Date(sdk.released_at).toLocaleDateString()}
                </span>
                <a
                  href={sdk.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#3b82f6', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold' }}
                >
                  <Download size={14} /> Source Tarball
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
