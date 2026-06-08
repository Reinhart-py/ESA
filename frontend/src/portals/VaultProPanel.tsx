import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client.ts';
import { 
  FolderPlus, Trash2, Share2, PenTool, CheckSquare, Square, 
  Download, Link2, Copy, Check, X, ShieldCheck, Mail, Eye
} from 'lucide-react';

interface FolderItem {
  id: string;
  name: string;
}

interface FileItem {
  id: string;
  name: string;
  size_bytes: number;
  category: string;
  status: 'Reviewing' | 'Approved' | 'Rejected';
}

interface VaultProProps {
  folders: FolderItem[];
  files: FileItem[];
  currentFolderId: string | null;
  setCurrentFolderId: (id: string | null) => void;
  createFolder: (name: string, parentId: string | null) => Promise<void>;
  uploadFile: (name: string, sizeBytes: number, category: string, mimeType: string, fileData: string, folderId: string | null) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
}

export default function VaultProPanel({
  folders,
  files,
  currentFolderId,
  setCurrentFolderId,
  createFolder,
  uploadFile,
  deleteFile
}: VaultProProps) {
  // Checkbox selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [activeFile, setActiveFile] = useState<FileItem | null>(null);

  // Form inputs
  const [newFolderName, setNewFolderName] = useState('');
  const [shareHours, setShareHours] = useState(24);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [signerEmail, setSignerEmail] = useState('');
  const [signatureText, setSignatureText] = useState('');
  
  // List of active E-sign requests
  const [esignRequests, setEsignRequests] = useState<any[]>([]);
  const [loadingSign, setLoadingSign] = useState(false);

  // File upload state
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('General');
  const [uploadBase64, setUploadBase64] = useState('');
  const [uploadSize, setUploadSize] = useState(0);

  const fetchESignRequests = async () => {
    try {
      const res = await apiClient.get('/documents/esign');
      setEsignRequests(res.data || []);
    } catch (err) {
      console.error('Error fetching esign requests:', err);
    }
  };

  useEffect(() => {
    fetchESignRequests();
  }, []);

  const toggleSelectFile = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const currentFolderFiles = files.filter(f => !f.status || f.status !== 'Rejected');
    if (selectedIds.length === currentFolderFiles.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentFolderFiles.map(f => f.id));
    }
  };

  const handleBulkDownload = () => {
    if (selectedIds.length === 0) return;
    const token = localStorage.getItem('supabase_token') || '';
    window.open(`http://localhost:5000/api/documents/bulk-download?fileIds=${selectedIds.join(',')}&access_token=${token}`, '_blank');
  };

  const handleCreateShareLink = async () => {
    if (!activeFile) return;
    try {
      const res = await apiClient.post('/documents/share', {
        fileId: activeFile.id,
        expiresInHours: Number(shareHours)
      });
      const link = `${window.location.origin}/share/${res.data.share_token}`;
      setGeneratedLink(link);
    } catch (err) {
      console.error('Error sharing document:', err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendESignRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFile || !signerEmail) return;
    setLoadingSign(true);
    try {
      await apiClient.post('/documents/esign', {
        fileId: activeFile.id,
        signerEmail
      });
      setSignerEmail('');
      await fetchESignRequests();
      alert('E-Sign request dispatched successfully!');
    } catch (err) {
      console.error('Error requesting signature:', err);
    } finally {
      setLoadingSign(false);
    }
  };

  const handleExecuteSignature = async (reqId: string) => {
    if (!signatureText.trim()) {
      alert('Please type your name as authentication.');
      return;
    }
    setLoadingSign(true);
    try {
      await apiClient.post(`/documents/esign/${reqId}/sign`, {
        signatureText
      });
      setSignatureText('');
      await fetchESignRequests();
      alert('Document signed successfully!');
      setShowSignModal(false);
      setActiveFile(null);
    } catch (err) {
      console.error('Error signing document:', err);
    } finally {
      setLoadingSign(false);
    }
  };

  // Upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadName(file.name);
      setUploadSize(file.size);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setUploadBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName || !uploadBase64) return;
    await uploadFile(uploadName, uploadSize, uploadCategory, 'application/octet-stream', uploadBase64, currentFolderId);
    setUploadName('');
    setUploadBase64('');
    setUploadSize(0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Folder Creator & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {currentFolderId && (
            <button 
              onClick={() => setCurrentFolderId(null)}
              style={{ padding: '0.5rem 1rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              ← Up Folder
            </button>
          )}

          <form onSubmit={(e) => {
            e.preventDefault();
            if (newFolderName.trim()) {
              createFolder(newFolderName, currentFolderId);
              setNewFolderName('');
            }
          }} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="New folder name"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', color: '#fff' }}
            />
            <button type="submit" style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <FolderPlus size={16} /> Create
            </button>
          </form>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', background: '#1e293b', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
              {selectedIds.length} Selected
            </span>
            <button 
              onClick={handleBulkDownload}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.8rem', background: '#00a896', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              <Download size={14} /> Bulk Download (.ZIP)
            </button>
          </div>
        )}
      </div>

      {/* Folders & Files Grid */}
      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', color: '#94a3b8' }}>
              <th style={{ padding: '0.75rem', width: '40px' }}>
                <button 
                  onClick={toggleSelectAll} 
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  {selectedIds.length === files.length && files.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              </th>
              <th>Name</th>
              <th>Size</th>
              <th>Category</th>
              <th>Status</th>
              <th style={{ textAlign: 'right', paddingRight: '0.75rem' }}>Vault Tools</th>
            </tr>
          </thead>
          <tbody>
            {folders.map(f => (
              <tr key={f.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '0.75rem' }}></td>
                <td 
                  style={{ padding: '0.75rem', cursor: 'pointer', color: '#3b82f6', fontWeight: 'bold' }} 
                  onClick={() => setCurrentFolderId(f.id)}
                >
                  📁 {f.name}
                </td>
                <td>-</td>
                <td>Folder</td>
                <td>-</td>
                <td></td>
              </tr>
            ))}
            
            {files.map(file => (
              <tr key={file.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', color: '#cbd5e1' }}>
                <td style={{ padding: '0.75rem' }}>
                  <button 
                    onClick={() => toggleSelectFile(file.id)}
                    style={{ background: 'none', border: 'none', color: '#00a896', cursor: 'pointer' }}
                  >
                    {selectedIds.includes(file.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </td>
                <td style={{ padding: '0.75rem' }}>📄 {file.name}</td>
                <td>{(file.size_bytes / 1024 / 1024).toFixed(2)} MB</td>
                <td>{file.category}</td>
                <td>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.2rem 0.4rem', 
                    borderRadius: '4px',
                    background: file.status === 'Approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: file.status === 'Approved' ? '#10b981' : '#f59e0b'
                  }}>
                    {file.status || 'Reviewing'}
                  </span>
                </td>
                <td style={{ textAlign: 'right', paddingRight: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => { setActiveFile(file); setShowShareModal(true); }}
                      style={{ padding: '0.35rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#3b82f6', cursor: 'pointer' }}
                      title="Share link"
                    >
                      <Share2 size={14} />
                    </button>
                    
                    <button 
                      onClick={() => { setActiveFile(file); setShowSignModal(true); }}
                      style={{ padding: '0.35rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#00a896', cursor: 'pointer' }}
                      title="E-Sign document"
                    >
                      <PenTool size={14} />
                    </button>

                    <button 
                      onClick={() => deleteFile(file.id)}
                      style={{ padding: '0.35rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}
                      title="Delete file"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upload Box */}
      <div style={{ marginTop: '0.5rem', padding: '1.5rem', background: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#fff' }}>Secure Document Upload</h3>
        <form onSubmit={handleUploadSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="file" onChange={handleFileChange} style={{ color: '#fff' }} />
          
          <select 
            value={uploadCategory} 
            onChange={e => setUploadCategory(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff' }}
          >
            <option value="General">General</option>
            <option value="Taxation">Taxation</option>
            <option value="Audit">Audit</option>
            <option value="Filing Proof">Filing Proof</option>
          </select>

          <button 
            type="submit" 
            disabled={!uploadName}
            style={{ padding: '0.5rem 1.2rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', opacity: uploadName ? 1 : 0.6 }}
          >
            Upload to Vault
          </button>
        </form>
      </div>

      {/* Share Modal */}
      {showShareModal && activeFile && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', width: '450px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
            <button 
              onClick={() => { setShowShareModal(false); setGeneratedLink(''); setActiveFile(null); }}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ color: '#fff', margin: '0 0 1rem 0' }}>Share Document Guest Link</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>📄 {activeFile.name}</p>

            {!generatedLink ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Link Expiry Time</label>
                  <select 
                    value={shareHours} 
                    onChange={e => setShareHours(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff' }}
                  >
                    <option value={1}>1 Hour</option>
                    <option value={24}>24 Hours (1 Day)</option>
                    <option value={48}>48 Hours (2 Days)</option>
                    <option value={168}>168 Hours (7 Days)</option>
                  </select>
                </div>
                <button 
                  onClick={handleCreateShareLink}
                  style={{ padding: '0.6rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Generate Share Key
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', background: '#0f172a', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <input 
                    type="text" 
                    readOnly 
                    value={generatedLink}
                    style={{ flex: 1, background: 'none', border: 'none', color: '#cbd5e1', fontSize: '0.85rem' }}
                  />
                  <button 
                    onClick={handleCopyLink}
                    style={{ background: 'none', border: 'none', color: copied ? '#10b981' : '#3b82f6', cursor: 'pointer' }}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#10b981', textAlign: 'center' }}>
                  Expiring secure link generated! Give it to guests.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* E-Sign request / Sign modal */}
      {showSignModal && activeFile && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', width: '500px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
            <button 
              onClick={() => { setShowSignModal(false); setActiveFile(null); }}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ color: '#fff', margin: '0 0 1rem 0' }}>E-Signature Verification Desk</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>📄 {activeFile.name}</p>

            {/* List active requests for this file */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: '#fff', margin: '0 0 0.5rem 0' }}>Active Signing Requests</h4>
              {esignRequests.filter(r => r.file_id === activeFile.id).length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>No signature requests created.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {esignRequests.filter(r => r.file_id === activeFile.id).map(req => (
                    <div key={req.id} style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <div>
                        <div style={{ color: '#fff' }}>{req.signer_email}</div>
                        {req.status === 'Signed' ? (
                          <span style={{ color: '#10b981', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <ShieldCheck size={12} /> SHA-256 Hash: {req.signature_hash.slice(0, 10)}...
                          </span>
                        ) : (
                          <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>Pending Signature</span>
                        )}
                      </div>

                      {req.status === 'Pending' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <input 
                            type="text" 
                            placeholder="Type full name to sign" 
                            value={signatureText} 
                            onChange={e => setSignatureText(e.target.value)}
                            style={{ padding: '0.35rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', color: '#fff', fontSize: '0.8rem' }}
                          />
                          <button 
                            onClick={() => handleExecuteSignature(req.id)}
                            disabled={loadingSign}
                            style={{ padding: '0.35rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                          >
                            Sign Now
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Request form */}
            <form onSubmit={handleSendESignRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
              <h4 style={{ color: '#fff', margin: 0 }}>Request New E-Signature</h4>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="email" 
                  placeholder="signer@company.com" 
                  value={signerEmail} 
                  onChange={e => setSignerEmail(e.target.value)}
                  required
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.85rem' }}
                />
                <button 
                  type="submit" 
                  disabled={loadingSign}
                  style={{ padding: '0.5rem 1rem', background: '#00a896', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
