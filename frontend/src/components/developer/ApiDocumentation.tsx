import React, { useState, useEffect } from 'react';
import { Terminal, Database, FileText, ChevronRight, Copy, Check, Shield } from 'lucide-react';
import { apiClient } from '../../api/client.ts';

interface ApiDoc {
  id: string;
  endpoint: string;
  method: string;
  description: string;
  request_schema: any;
  response_schema: any;
}

export default function ApiDocumentation() {
  const [docs, setDocs] = useState<ApiDoc[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [codeLang, setCodeLang] = useState<'javascript' | 'curl' | 'python'>('javascript');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/developer/docs');
      setDocs(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedDocId(res.data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load api docs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const activeDoc = docs.find((d) => d.id === selectedDocId);

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return '#10b981';
      case 'POST': return '#3b82f6';
      case 'PUT': return '#f59e0b';
      case 'DELETE': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getCodeSnippet = (doc: ApiDoc) => {
    const host = window.location.origin;
    if (codeLang === 'curl') {
      return `curl -X ${doc.method} "${host}${doc.endpoint}" \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Content-Type: application/json"${doc.method === 'POST' || doc.method === 'PUT' ? ` \\
  -d '${JSON.stringify(doc.request_schema?.body || {}, null, 2)}'` : ''}`;
    } else if (codeLang === 'python') {
      return `import requests

url = "${host}${doc.endpoint}"
headers = {
    "Authorization": "Bearer <YOUR_API_KEY>",
    "Content-Type": "application/json"
}
${doc.method === 'POST' || doc.method === 'PUT' ? `
payload = ${JSON.stringify(doc.request_schema?.body || {}, null, 4)}
response = requests.${doc.method.toLowerCase()}(url, headers=headers, json=payload)` : `
response = requests.${doc.method.toLowerCase()}(url, headers=headers)`}

print(response.json())`;
    } else {
      return `// Node.js API client dispatch
const fetch = require('node-fetch');

async function callApi() {
  const response = await fetch('${host}${doc.endpoint}', {
    method: '${doc.method}',
    headers: {
      'Authorization': 'Bearer <YOUR_API_KEY>',
      'Content-Type': 'application/json'
    }${doc.method === 'POST' || doc.method === 'PUT' ? `,
    body: JSON.stringify(${JSON.stringify(doc.request_schema?.body || {}, null, 4)})` : ''}
  });

  const data = await response.json();
  console.log(data);
}

callApi();`;
    }
  };

  const handleCopySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '1.5rem', minHeight: '450px' }}>
      
      {/* Sidebar List */}
      <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', padding: '0 0.5rem' }}>ENDPOINT SCHEMAS</span>
        {loading ? (
          <div style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>Loading schema maps...</div>
        ) : (
          docs.map((d) => (
            <div
              key={d.id}
              onClick={() => setSelectedDocId(d.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                borderRadius: '8px',
                background: selectedDocId === d.id ? 'rgba(255, 255, 255, 0.05)' : 'none',
                cursor: 'pointer',
                border: '1px solid ' + (selectedDocId === d.id ? 'rgba(255, 255, 255, 0.05)' : 'transparent')
              }}
            >
              <span style={{ fontSize: '0.65rem', background: getMethodColor(d.method), color: '#fff', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: 'bold', width: '50px', textAlign: 'center' }}>
                {d.method}
              </span>
              <span style={{ fontSize: '0.8rem', color: selectedDocId === d.id ? '#fff' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, fontFamily: 'monospace' }}>
                {d.endpoint}
              </span>
              <ChevronRight size={14} style={{ color: selectedDocId === d.id ? '#00a896' : 'transparent' }} />
            </div>
          ))
        )}
      </div>

      {/* Details Area */}
      {activeDoc ? (
        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', background: getMethodColor(activeDoc.method), color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
                {activeDoc.method}
              </span>
              <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontFamily: 'monospace' }}>{activeDoc.endpoint}</h4>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: 0 }}>
              {activeDoc.description}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>Request Payload Mapping</span>
              <pre style={{ margin: 0, padding: '0.75rem', background: '#0f172a', borderRadius: '6px', fontSize: '0.8rem', color: '#00a896', overflowX: 'auto', fontFamily: 'monospace', border: '1px solid rgba(255,255,255,0.02)' }}>
                {JSON.stringify(activeDoc.request_schema, null, 2)}
              </pre>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>Expected Response Shape</span>
              <pre style={{ margin: 0, padding: '0.75rem', background: '#0f172a', borderRadius: '6px', fontSize: '0.8rem', color: '#3b82f6', overflowX: 'auto', fontFamily: 'monospace', border: '1px solid rgba(255,255,255,0.02)' }}>
                {JSON.stringify(activeDoc.response_schema, null, 2)}
              </pre>
            </div>
          </div>

          {/* Interactive Snippets Tab */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['javascript', 'python', 'curl'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setCodeLang(lang)}
                    style={{
                      background: codeLang === lang ? 'rgba(0, 168, 150, 0.15)' : 'none',
                      border: '1px solid ' + (codeLang === lang ? 'rgba(0, 168, 150, 0.2)' : 'rgba(255,255,255,0.05)'),
                      color: codeLang === lang ? '#00a896' : '#94a3b8',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {lang === 'javascript' ? 'JavaScript' : lang === 'python' ? 'Python' : 'cURL'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleCopySnippet(getCodeSnippet(activeDoc))}
                style={{ background: 'none', border: 'none', color: copiedSnippet ? '#10b981' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
              >
                {copiedSnippet ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy Code</>}
              </button>
            </div>

            <pre style={{ margin: 0, padding: '1rem', background: '#0f172a', borderRadius: '8px', fontSize: '0.8rem', color: '#fff', overflowX: 'auto', fontFamily: 'monospace', border: '1px solid rgba(255,255,255,0.03)' }}>
              {getCodeSnippet(activeDoc)}
            </pre>
          </div>

        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color: '#64748b' }}>
          Select an API endpoint to view schema parameters.
        </div>
      )}

    </div>
  );
}
