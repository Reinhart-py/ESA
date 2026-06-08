import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client.ts';
import { 
  Calendar, CheckCircle, AlertTriangle, FileText, Upload, Clock, 
  Settings, Check, X, ShieldAlert, Award, FileUp, Loader2, ArrowRight
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
}

interface CompliancePack {
  id: string;
  name: string;
  country_code: string;
  authority: string;
  description: string;
  rules: any[];
}

interface Obligation {
  id: string;
  title: string;
  due_date: string;
  status: 'On Track' | 'Late' | 'Needs Review' | 'Filed';
  type: string;
  notes: string;
}

interface FilingSubmission {
  id: string;
  obligation_id: string;
  status: 'Draft' | 'Under Review' | 'Approved' | 'Rejected' | 'Filed';
  evidence_file_id: string | null;
  comments: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  obligation?: Obligation;
  evidence?: FileItem;
}

export default function ComplianceFilingDashboard({ isAccountant = false }: { isAccountant?: boolean }) {
  const [packs, setPacks] = useState<CompliancePack[]>([]);
  const [submissions, setSubmissions] = useState<FilingSubmission[]>([]);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // UI state
  const [selectedPackId, setSelectedPackId] = useState('');
  const [selectedSub, setSelectedSub] = useState<FilingSubmission | null>(null);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [evidenceComments, setEvidenceComments] = useState('');
  const [reviewerComments, setReviewerComments] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [packsRes, subsRes, obRes, filesRes] = await Promise.all([
        apiClient.get('/compliance/packs'),
        apiClient.get('/compliance/submissions'),
        apiClient.get('/compliance/obligations').catch(() => ({ data: [] })),
        apiClient.get('/documents').catch(() => ({ data: [] }))
      ]);

      setPacks(packsRes.data || []);
      setSubmissions(subsRes.data || []);
      setObligations(obRes.data || []);
      
      // Pull only files from document list
      setFiles(filesRes.data?.files || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to sync compliance tracker data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubscribePack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackId) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiClient.post('/compliance/packs/subscribe', { packId: selectedPackId });
      setSuccessMsg('Successfully configured regional tax calendar pack!');
      setSelectedPackId('');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to subscribe to compliance pack.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !selectedFileId) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiClient.post(`/compliance/submissions/${selectedSub.id}/submit`, {
        evidenceFileId: selectedFileId,
        comments: evidenceComments
      });
      setSuccessMsg('Filing evidence submitted successfully for review.');
      setSelectedSub(null);
      setSelectedFileId('');
      setEvidenceComments('');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit evidence.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAuditReview = async (subId: string, action: 'approve' | 'reject') => {
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiClient.post(`/compliance/submissions/${subId}/review`, {
        action,
        comments: reviewerComments
      });
      setSuccessMsg(`Filing submission ${action === 'approve' ? 'Approved' : 'Rejected'} successfully.`);
      setReviewerComments('');
      setSelectedSub(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to record audit decision.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
            <Award size={24} style={{ color: '#00a896' }} /> Regional Compliance Desk
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
            Schedule country-specific calendars, upload tax filings proof, and verify compliance audits.
          </p>
        </div>
        <button 
          onClick={loadData} 
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer' }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
          Refresh Calendar
        </button>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldAlert size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem' }}>
        
        {/* Compliance Timeline / Deadlines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#fff', fontSize: '1.1rem' }}>Active Filing Obligations ({submissions.length})</h3>
            
            {submissions.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No obligations configured. Use the settings panel on the right to select a regional compliance pack.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {submissions.map(sub => {
                  const ob = sub.obligation || obligations.find(o => o.id === sub.obligation_id);
                  if (!ob) return null;
                  
                  return (
                    <div 
                      key={sub.id} 
                      style={{ 
                        padding: '1rem', 
                        background: '#0f172a', 
                        borderRadius: '8px', 
                        border: '1px solid rgba(255,255,255,0.02)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{
                          background: sub.status === 'Approved' || sub.status === 'Filed' ? 'rgba(16, 185, 129, 0.1)' : sub.status === 'Under Review' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: sub.status === 'Approved' || sub.status === 'Filed' ? '#10b981' : sub.status === 'Under Review' ? '#3b82f6' : '#f59e0b',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Calendar size={18} />
                        </div>

                        <div>
                          <h4 style={{ margin: 0, color: '#fff', fontSize: '0.95rem' }}>{ob.title}</h4>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Deadline: <strong>{new Date(ob.due_date).toLocaleDateString()}</strong> | Authority: {ob.type}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          padding: '0.3rem 0.6rem', 
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          background: 
                            sub.status === 'Approved' || sub.status === 'Filed' ? 'rgba(16, 185, 129, 0.2)' : 
                            sub.status === 'Under Review' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: 
                            sub.status === 'Approved' || sub.status === 'Filed' ? '#10b981' : 
                            sub.status === 'Under Review' ? '#3b82f6' : '#f59e0b'
                        }}>
                          {sub.status}
                        </span>

                        <button
                          onClick={() => setSelectedSub(sub)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            background: '#1e3e62',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Configuration Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Subscribe Regional Pack */}
          {!isAccountant && (
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={18} style={{ color: '#00a896' }} /> Setup Regional Tax Pack
              </h3>
              
              <form onSubmit={handleSubscribePack} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Available Calendar Pack</label>
                <select
                  value={selectedPackId}
                  onChange={e => setSelectedPackId(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff' }}
                >
                  <option value="">Choose Pack...</option>
                  {packs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.country_code} - {p.name} ({p.authority})
                    </option>
                  ))}
                </select>

                <button 
                  type="submit" 
                  disabled={submitting || !selectedPackId}
                  style={{ width: '100%', padding: '0.6rem', background: '#00a896', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', opacity: selectedPackId ? 1 : 0.6 }}
                >
                  {submitting ? 'Scheduling...' : 'Bootstrap Deadlines'}
                </button>
              </form>
            </div>
          )}

          {/* Active Status Metrics */}
          <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#fff', fontSize: '1.1rem' }}>Compliance Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {submissions.filter(s => s.status === 'Approved' || s.status === 'Filed').length}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>FILED</div>
              </div>
              <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ color: '#f59e0b', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {submissions.filter(s => s.status === 'Under Review').length}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>UNDER REVIEW</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details / Submission Overlay Modal */}
      {selectedSub && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', width: '500px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
            
            <button 
              onClick={() => setSelectedSub(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff' }}>Filing Obligation Detail</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 1.5rem 0' }}>
              Verify required documents, submit proof files, or review audit decisions.
            </p>

            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
              <div>Obligation: <strong style={{ color: '#fff' }}>{selectedSub.obligation?.title}</strong></div>
              <div>Workflow State: <strong style={{ color: '#f59e0b' }}>{selectedSub.status}</strong></div>
              {selectedSub.comments && <div>Notes: <span>{selectedSub.comments}</span></div>}
            </div>

            {/* Evidence Uploader Panel for Clients */}
            {!isAccountant && selectedSub.status === 'Draft' && (
              <form onSubmit={handleSubmitEvidence} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0, color: '#fff' }}>Submit Evidence Doc</h4>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Select Vault File</label>
                  <select
                    value={selectedFileId}
                    onChange={e => setSelectedFileId(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff' }}
                  >
                    <option value="">Choose document...</option>
                    {files.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Filing Comments</label>
                  <textarea
                    placeholder="e.g. Attached Q3 VAT computation sheet."
                    value={evidenceComments}
                    onChange={e => setEvidenceComments(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', minHeight: '60px' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !selectedFileId}
                  style={{ width: '100%', padding: '0.7rem', background: '#00a896', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {submitting ? 'Submitting...' : 'Upload Evidence'}
                </button>
              </form>
            )}

            {/* Review Decision Form for Accountants */}
            {isAccountant && selectedSub.status === 'Under Review' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <h4 style={{ margin: 0, color: '#fff' }}>Auditor Verification Action</h4>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Audit / Review Comments</label>
                  <textarea
                    placeholder="Provide details on compliance correctness."
                    value={reviewerComments}
                    onChange={e => setReviewerComments(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', minHeight: '60px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => handleAuditReview(selectedSub.id, 'approve')}
                    disabled={submitting}
                    style={{ flex: 1, padding: '0.7rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Approve Filing
                  </button>
                  <button
                    onClick={() => handleAuditReview(selectedSub.id, 'reject')}
                    disabled={submitting}
                    style={{ flex: 1, padding: '0.7rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Reject Submission
                  </button>
                </div>
              </div>
            )}

            {/* General state message */}
            {selectedSub.status !== 'Draft' && selectedSub.status !== 'Under Review' && (
              <p style={{ color: '#10b981', textAlign: 'center', fontWeight: 'bold', marginTop: '1rem' }}>
                ✓ This filing has already been audited & approved.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
