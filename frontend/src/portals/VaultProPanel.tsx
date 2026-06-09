import React, { useState, useEffect, useContext, useRef } from 'react';
import { apiClient } from '../api/client.ts';
import { AppContext } from '../context/AppContext.tsx';
import { 
  FolderPlus, Trash2, Share2, PenTool, CheckSquare, Square, 
  Download, Link2, Copy, Check, X, ShieldCheck, Mail, Eye,
  Search, Archive, Calendar, AlertTriangle, FileText, CheckCircle,
  FileCode, Scale, RefreshCw, FolderOpen
} from 'lucide-react';
import ConfirmDialog from '../components/ui/ConfirmDialog.tsx';
import EmptyState from '../components/ui/EmptyState.tsx';
import Toast, { ToastMessage } from '../components/ui/Toast.tsx';

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
  is_legal_hold?: boolean;
  retention_until?: string;
  ocr_text?: string;
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
  const context = useContext(AppContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'files' | 'trash' | 'ocr_search'>('files');

  // Checkbox selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Trash & Soft Delete
  const [trashFiles, setTrashFiles] = useState<FileItem[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);

  // OCR Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FileItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Compliance (Retention & Legal Holds)
  const [retentionDate, setRetentionDate] = useState('');
  const [legalHold, setLegalHold] = useState(false);
  const [complianceSaving, setComplianceSaving] = useState(false);

  // Document Preview
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    url: string;
    name: string;
    mime_type: string;
    ocr_text?: string;
    is_legal_hold?: boolean;
    retention_until?: string;
  } | null>(null);
  const [previewTab, setPreviewTab] = useState<'document' | 'ocr'>('document');

  // Toast notifications & Confirm Dialog
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const addToast = (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => {
    setToasts(prev => [...prev, { id: Math.random().toString(), type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchESignRequests = async () => {
    try {
      const res = await apiClient.get('/documents/esign');
      setEsignRequests(res.data || []);
    } catch (err) {
      console.error('Error fetching esign requests:', err);
    }
  };

  const fetchTrashFiles = async () => {
    setTrashLoading(true);
    try {
      const res = await apiClient.get('/documents/trash');
      setTrashFiles(res.data || []);
    } catch (err) {
      console.error('Error fetching trash files:', err);
    } finally {
      setTrashLoading(false);
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
      addToast('success', 'E-Sign Dispatched', 'E-Sign request dispatched successfully!');
    } catch (err) {
      console.error('Error requesting signature:', err);
    } finally {
      setLoadingSign(false);
    }
  };

  const handleExecuteSignature = async (reqId: string) => {
    if (!signatureText.trim()) {
      addToast('warning', 'Validation Error', 'Please type your name as authentication.');
      return;
    }
    setLoadingSign(true);
    try {
      await apiClient.post(`/documents/esign/${reqId}/sign`, {
        signatureText
      });
      setSignatureText('');
      await fetchESignRequests();
      addToast('success', 'Document Signed', 'Document signed successfully!');
      setShowSignModal(false);
      setActiveFile(null);
    } catch (err) {
      console.error('Error signing document:', err);
    } finally {
      setLoadingSign(false);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File size exceeds the 50MB workspace limit.');
      addToast('error', 'Limit Exceeded', 'File exceeds the 50MB storage limit.');
      return;
    }
    
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/webp'
    ];
    if (!allowedMimeTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only PDF, DOCX, XLSX, CSV, TXT, PNG, and JPEG files are supported.');
      addToast('warning', 'Invalid Format', 'Supported formats: PDF, DOCX, XLSX, CSV, TXT, PNG, JPEG.');
      return;
    }

    setUploadName(file.name);
    setUploadSize(file.size);
    setUploadError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setUploadBase64(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName || !uploadBase64) return;
    setUploadError(null);
    try {
      await uploadFile(uploadName, uploadSize, uploadCategory, 'application/octet-stream', uploadBase64, currentFolderId);
      setUploadName('');
      setUploadBase64('');
      setUploadSize(0);
    } catch (err: any) {
      console.error('Error uploading file:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to upload document.';
      setUploadError(errMsg);
    }
  };

  // Soft delete restoration
  const handleRestoreFile = async (fileId: string) => {
    try {
      await apiClient.post(`/documents/file/${fileId}/restore`);
      addToast('success', 'Document Restored', 'Document successfully restored to active vault!');
      if (context && context.syncState) {
        await context.syncState();
      }
      await fetchTrashFiles();
    } catch (err: any) {
      console.error('Error restoring file:', err);
      addToast('error', 'Restoration Failed', err.response?.data?.error || 'Failed to restore document.');
    }
  };

  // Compliance settings updates
  const handleOpenCompliance = (file: FileItem) => {
    setActiveFile(file);
    setRetentionDate(file.retention_until ? file.retention_until.split('T')[0] : '');
    setLegalHold(!!file.is_legal_hold);
    setShowComplianceModal(true);
  };

  const handleSaveCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFile) return;
    setComplianceSaving(true);
    try {
      await apiClient.post(`/documents/file/${activeFile.id}/retention`, {
        retentionUntil: retentionDate || null,
        isLegalHold: legalHold
      });
      addToast('success', 'Compliance Updated', 'Compliance metrics updated successfully.');
      if (context && context.syncState) {
        await context.syncState();
      }
      setShowComplianceModal(false);
      setActiveFile(null);
    } catch (err: any) {
      console.error('Error saving compliance policies:', err);
      addToast('error', 'Update Failed', err.response?.data?.error || 'Failed to update compliance settings.');
    } finally {
      setComplianceSaving(false);
    }
  };

  // Inline Preview Details
  const handleOpenPreview = async (file: FileItem) => {
    setPreviewFile(file);
    setPreviewLoading(true);
    setPreviewTab('document');
    setPreviewData(null);
    try {
      const res = await apiClient.get(`/documents/file/${file.id}/url`);
      setPreviewData(res.data);
    } catch (err) {
      console.error('Error fetching file preview information:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Full-Text OCR Search
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await apiClient.get(`/documents/search-content?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data || []);
    } catch (err) {
      console.error('Error searching OCR text:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      
      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setActiveTab('files')}
          style={{
            padding: '0.5rem 1.25rem',
            background: activeTab === 'files' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            color: activeTab === 'files' ? '#3b82f6' : '#94a3b8',
            border: activeTab === 'files' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <FolderPlus size={16} /> Active Vault Files
        </button>
        <button
          onClick={() => { setActiveTab('trash'); fetchTrashFiles(); }}
          style={{
            padding: '0.5rem 1.25rem',
            background: activeTab === 'trash' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
            color: activeTab === 'trash' ? '#ef4444' : '#94a3b8',
            border: activeTab === 'trash' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid transparent',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <Archive size={16} /> Trash & Retention ({trashFiles.length})
        </button>
        <button
          onClick={() => setActiveTab('ocr_search')}
          style={{
            padding: '0.5rem 1.25rem',
            background: activeTab === 'ocr_search' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            color: activeTab === 'ocr_search' ? '#10b981' : '#94a3b8',
            border: activeTab === 'ocr_search' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          <Search size={16} /> AI OCR Content Search
        </button>
      </div>

      {/* RENDER ACTIVE FILES TAB */}
      {activeTab === 'files' && (
        <>
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
            {folders.length === 0 && files.length === 0 ? (
              <EmptyState 
                icon={<FolderOpen size={44} />}
                title="Secure Vault is Empty"
                description="No folders or documents were found in this directory. Connect feeds or upload files below to populate your record ledger."
              />
            ) : (
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
                  <th>Compliance Rules</th>
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
                    <td style={{ padding: '0.75rem' }}>
                      <span onClick={() => handleOpenPreview(file)} style={{ cursor: 'pointer', color: '#60a5fa', textDecoration: 'underline' }}>
                        📄 {file.name}
                      </span>
                    </td>
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
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {file.is_legal_hold && (
                          <span style={{ fontSize: '0.7rem', background: '#ef4444', color: '#fff', padding: '0.15rem 0.35rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                            <Scale size={10} /> Hold
                          </span>
                        )}
                        {file.retention_until && (
                          <span style={{ fontSize: '0.7rem', background: '#eab308', color: '#000', padding: '0.15rem 0.35rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                            <Calendar size={10} /> Retain {file.retention_until.split('T')[0]}
                          </span>
                        )}
                        {!file.is_legal_hold && !file.retention_until && (
                          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>None</span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleOpenPreview(file)}
                          style={{ padding: '0.35rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#10b981', cursor: 'pointer' }}
                          title="Preview document"
                        >
                          <Eye size={14} />
                        </button>

                        <button 
                          onClick={() => handleOpenCompliance(file)}
                          style={{ padding: '0.35rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#f59e0b', cursor: 'pointer' }}
                          title="Compliance & Retention"
                        >
                          <Scale size={14} />
                        </button>

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
                          onClick={() => setDeleteConfirmId(file.id)}
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
            )}
          </div>

          {/* Secure Document Upload Dropzone */}
          <div style={{ marginTop: '1rem', padding: '1.5rem', background: '#1e293b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#fff', fontSize: '1.1rem' }}>Secure Document Vault Upload</h3>
            {uploadError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
                <AlertTriangle size={16} /> {uploadError}
              </div>
            )}
            
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: isDragging ? '2px dashed #10b981' : '2px dashed rgba(255,255,255,0.1)',
                background: isDragging ? 'rgba(16, 185, 129, 0.05)' : '#0f172a',
                padding: '2rem',
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '1rem'
              }}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
              />
              <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                <FolderOpen size={36} style={{ color: isDragging ? '#10b981' : '#64748b' }} />
                {uploadName ? (
                  <div>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{uploadName}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>({(uploadSize / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <div>
                    <strong style={{ color: '#fff' }}>Drag & drop files here</strong> or <span style={{ color: '#10b981' }}>browse records</span>
                    <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '0.25rem' }}>Max file size: 50MB. Supported: PDF, DOCX, XLSX, CSV, TXT, PNG, JPEG.</span>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {uploadName && (
                <button
                  type="button"
                  onClick={() => { setUploadName(''); setUploadBase64(''); setUploadSize(0); }}
                  style={{ padding: '0.5rem 1rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
              )}
              
              <select 
                value={uploadCategory} 
                onChange={e => setUploadCategory(e.target.value)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', fontSize: '0.85rem' }}
              >
                <option value="General">General</option>
                <option value="Taxation">Taxation</option>
                <option value="Audit">Audit</option>
                <option value="Filing Proof">Filing Proof</option>
              </select>

              <button 
                type="submit" 
                disabled={!uploadName}
                style={{ padding: '0.5rem 1.5rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', opacity: uploadName ? 1 : 0.6 }}
              >
                Upload to Vault
              </button>
            </form>
          </div>
        </>
      )}

      {/* RENDER TRASH TAB */}
      {activeTab === 'trash' && (
        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#fff' }}>Compliance Trash Bin (Soft-Deleted Files)</h3>
            <button 
              onClick={fetchTrashFiles}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.8rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              <RefreshCw size={12} className={trashLoading ? 'animate-spin' : ''} /> Refresh Trash
            </button>
          </div>

          {trashLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading compliance vault logs...</div>
          ) : trashFiles.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <CheckCircle size={32} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
              <p style={{ margin: 0 }}>The trash bin is currently empty. All documents conform to active compliance states.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', color: '#94a3b8' }}>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Compliance Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trashFiles.map(file => (
                  <tr key={file.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', color: '#cbd5e1' }}>
                    <td style={{ padding: '0.75rem' }}>📄 {file.name}</td>
                    <td>{file.category}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {file.is_legal_hold && (
                          <span style={{ fontSize: '0.7rem', background: '#ef4444', color: '#fff', padding: '0.15rem 0.35rem', borderRadius: '4px' }}>
                            Legal Hold Active
                          </span>
                        )}
                        {file.retention_until && (
                          <span style={{ fontSize: '0.7rem', background: '#eab308', color: '#000', padding: '0.15rem 0.35rem', borderRadius: '4px' }}>
                            Retention Active ({file.retention_until.split('T')[0]})
                          </span>
                        )}
                        {!file.is_legal_hold && !file.retention_until && (
                          <span style={{ color: '#ef4444', fontSize: '0.80rem' }}>Soft-Deleted</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button
                        onClick={() => handleRestoreFile(file.id)}
                        style={{ padding: '0.35rem 0.75rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                      >
                        Restore File
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* RENDER OCR AI SEARCH TAB */}
      {activeTab === 'ocr_search' && (
        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#fff' }}>AI OCR Full-Text Content Search</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Queries the digitizing service inside EAC solutions, returning documents whose OCR indexes contain your exact query term.
          </p>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input 
              type="text" 
              placeholder="Search terms: 'invoices', 'receipts', 'irs', etc..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff' }}
            />
            <button 
              type="submit" 
              style={{ padding: '0.6rem 1.5rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Search size={16} /> Search Content
            </button>
          </form>

          {searchLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Analyzing digitizing system indexes...</div>
          ) : searchResults.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              No document indices match the term. Try searching for general terms or words in uploaded receipts.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ margin: 0, color: '#fff' }}>Matching Digitized Documents ({searchResults.length})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {searchResults.map(result => (
                  <div key={result.id} style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#cbd5e1' }}>📄 {result.name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>Category: {result.category} | Size: {(result.size_bytes / 1024).toFixed(1)} KB</div>
                      {result.ocr_text && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '4px', borderLeft: '3px solid #10b981' }}>
                          Snippet: {result.ocr_text.length > 150 ? result.ocr_text.slice(0, 150) + '...' : result.ocr_text}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleOpenPreview(result)}
                      style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                    >
                      Inspect Indexes
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMPLIANCE & RETENTION POLICY MODAL */}
      {showComplianceModal && activeFile && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', width: '450px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
            <button 
              onClick={() => { setShowComplianceModal(false); setActiveFile(null); }}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ color: '#fff', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Scale size={20} style={{ color: '#f59e0b' }} /> Document Retention Rules
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>Configuring policy constraints for: <strong>{activeFile.name}</strong></p>

            <form onSubmit={handleSaveCompliance} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Retention Period (Until Date)</label>
                <input 
                  type="date"
                  value={retentionDate}
                  onChange={e => setRetentionDate(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
                  Document cannot be purged or deleted permanently until this date has elapsed.
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.05)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                <input 
                  type="checkbox"
                  id="legalHold"
                  checked={legalHold}
                  onChange={e => setLegalHold(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <div>
                  <label htmlFor="legalHold" style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>Apply Legal Hold</label>
                  <span style={{ fontSize: '0.75rem', color: '#fca5a5', display: 'block' }}>
                    Mandatory restriction override. Suspends normal scheduled deletion logs.
                  </span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={complianceSaving}
                style={{ padding: '0.6rem', background: '#f59e0b', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', opacity: complianceSaving ? 0.7 : 1 }}
              >
                {complianceSaving ? 'Updating Compliance Ledger...' : 'Commit Compliance Settings'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT & IMAGE PREVIEW OVERLAY MODAL */}
      {previewFile && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', width: '800px', maxWidth: '90%', height: '80vh', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <button 
              onClick={() => { setPreviewFile(null); setPreviewData(null); }}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ color: '#fff', margin: '0 0 0.5rem 0' }}>Vault Intelligence Viewer</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>📄 {previewFile.name}</p>

            {/* Tab select inside preview */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <button
                onClick={() => setPreviewTab('document')}
                style={{
                  padding: '0.35rem 0.75rem',
                  background: previewTab === 'document' ? '#334155' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                Document Image / Preview
              </button>
              <button
                onClick={() => setPreviewTab('ocr')}
                style={{
                  padding: '0.35rem 0.75rem',
                  background: previewTab === 'ocr' ? '#334155' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                Digitized AI OCR Text
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', background: '#0f172a', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {previewLoading ? (
                <div style={{ color: '#94a3b8' }}>Acquiring storage authorization tokens...</div>
              ) : previewData ? (
                previewTab === 'document' ? (
                  // Document visual preview
                  previewData.mime_type?.startsWith('image/') || 
                  previewData.name?.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) ? (
                    <img 
                      src={previewData.url.startsWith('/') ? `http://localhost:5000${previewData.url}` : previewData.url} 
                      alt={previewData.name}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                      <FileText size={48} style={{ margin: '0 auto 1rem', display: 'block', color: '#3b82f6' }} />
                      <p style={{ margin: '0 0 1rem 0' }}>Inline preview is not supported for file format: <strong>{previewData.mime_type || 'Unknown'}</strong></p>
                      <a 
                        href={previewData.url.startsWith('/') ? `http://localhost:5000${previewData.url}` : previewData.url} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ display: 'inline-block', padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}
                      >
                        Download & Open File
                      </a>
                    </div>
                  )
                ) : (
                  // OCR text viewer
                  <div style={{ width: '100%', height: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '0.8rem', color: '#10b981', marginBottom: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                      ⚡ Extracted by EAC Solutions Document Intelligence (OCR) Engine
                    </div>
                    <pre style={{ flex: 1, overflow: 'auto', background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '6px', color: '#34d399', fontSize: '0.85rem', fontFamily: 'Courier New, monospace', whiteSpace: 'pre-wrap', margin: 0 }}>
                      {previewData.ocr_text || 'No machine-readable OCR text extracted for this document.'}
                    </pre>
                  </div>
                )
              ) : (
                <div style={{ color: '#ef4444' }}>Unable to retrieve preview key.</div>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* Delete File Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        title="Delete Vault Document"
        message="Are you sure you want to move this file to the compliance trash bin? Soft-deleted documents can be restored later or permanently purged by an administrator."
        confirmLabel="Move to Trash"
        onConfirm={async () => {
          if (deleteConfirmId) {
            try {
              await deleteFile(deleteConfirmId);
              addToast('success', 'Document Purged', 'Document has been soft-deleted and moved to trash.');
            } catch (err: any) {
              addToast('error', 'Purge Failed', err.response?.data?.error || 'Failed to delete file.');
            } finally {
              setDeleteConfirmId(null);
            }
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* Floating Toast Notification Area */}
      {toasts.length > 0 && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '0.5rem', pointerEvents: 'none' }}>
          {toasts.map(t => (
            <Toast key={t.id} id={t.id} type={t.type} title={t.title} message={t.message} onClose={removeToast} />
          ))}
        </div>
      )}
    </div>
  );
}
