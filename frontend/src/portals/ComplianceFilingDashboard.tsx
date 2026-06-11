import React, { useState, useEffect, useContext } from 'react';
import { apiClient } from '../api/client.ts';
import { AppContext } from '../context/AppContext.tsx';
import { 
  Calendar, CheckCircle, AlertTriangle, FileText, Upload, Clock, 
  Settings, Check, X, ShieldAlert, Award, FileUp, Loader2, ArrowRight,
  ShieldCheck, RefreshCw, AlertCircle, Globe, PlusCircle
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
  compliance_score_impact?: number;
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
  const context = useContext(AppContext);
  const currentUser = context?.currentUser;

  const [packs, setPacks] = useState<CompliancePack[]>([]);
  const [submissions, setSubmissions] = useState<FilingSubmission[]>([]);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Phase 9 States
  const [complianceScore, setComplianceScore] = useState<number | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [workspaceCountry, setWorkspaceCountry] = useState('US');
  const [updatingCountry, setUpdatingCountry] = useState(false);
  const [runningScheduler, setRunningScheduler] = useState(false);

  // Custom Obligation States
  const [showCreateObligationModal, setShowCreateObligationModal] = useState(false);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [obligationForm, setObligationForm] = useState({
    title: '',
    dueDate: new Date().toISOString().split('T')[0],
    type: 'GST',
    assignedSpecialistId: '',
    notes: '',
    complianceScoreImpact: 10
  });

  // UI state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedPackId, setSelectedPackId] = useState('');
  const [selectedSub, setSelectedSub] = useState<FilingSubmission | null>(null);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [evidenceComments, setEvidenceComments] = useState('');
  const [reviewerComments, setReviewerComments] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [packsRes, subsRes, obRes, filesRes, scoreRes, alertsRes, specialistsRes] = await Promise.all([
        apiClient.get('/compliance/packs'),
        apiClient.get('/compliance/submissions'),
        apiClient.get('/compliance/obligations').catch(() => ({ data: [] })),
        apiClient.get('/documents').catch(() => ({ data: [] })),
        apiClient.get('/compliance/score').catch(() => ({ data: { score: 100 } })),
        apiClient.get('/compliance/alerts').catch(() => ({ data: [] })),
        apiClient.get('/users').catch(() => ({ data: [] }))
      ]);

      setPacks(packsRes.data || []);
      setSubmissions(subsRes.data || []);
      setObligations(obRes.data || []);
      setFiles(filesRes.data?.files || []);
      setComplianceScore(scoreRes.data?.score ?? 100);
      setAlerts(alertsRes.data || []);
      setSpecialists(specialistsRes.data || []);

      // Pull current tenant country from global tenants list
      const tenantsRes = await apiClient.get('/tenants').catch(() => ({ data: [] }));
      const myTenant = tenantsRes.data.find((t: any) => t.id === currentUser?.tenant_id);
      if (myTenant) {
        setWorkspaceCountry(myTenant.country || 'US');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to sync compliance tracker data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateObligation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiClient.post('/compliance/obligation', {
        title: obligationForm.title,
        dueDate: obligationForm.dueDate,
        type: obligationForm.type,
        assignedSpecialistId: obligationForm.assignedSpecialistId || null,
        notes: obligationForm.notes,
        complianceScoreImpact: Number(obligationForm.complianceScoreImpact)
      });
      setSuccessMsg('Filing obligation scheduled successfully!');
      setShowCreateObligationModal(false);
      setObligationForm({
        title: '',
        dueDate: new Date().toISOString().split('T')[0],
        type: 'GST',
        assignedSpecialistId: '',
        notes: '',
        complianceScoreImpact: 10
      });
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to schedule filing obligation.');
    } finally {
      setSubmitting(false);
    }
  };


  useEffect(() => {
    loadData();
  }, [currentUser?.tenant_id]);

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

  const handleCountryChange = async (country: string) => {
    setUpdatingCountry(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiClient.post('/compliance/tenant-country', { country });
      setWorkspaceCountry(country);
      setSuccessMsg(`Workspace regulatory country successfully updated to: ${country}. Automated filings scheduled.`);
      await loadData();
      if (context && context.syncState) {
        await context.syncState();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update workspace country.');
    } finally {
      setUpdatingCountry(false);
    }
  };

  const handleRunScheduler = async () => {
    setRunningScheduler(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await apiClient.post('/compliance/scheduler/run');
      setSuccessMsg(`Automated scheduler execution completed. Obligations checked. Created ${res.data.summary.obligationsCreated} obligations and ${res.data.summary.alertsCreated} alerts.`);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to execute compliance scheduler sweep.');
    } finally {
      setRunningScheduler(false);
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
            Schedule country-specific calendars, auto-populate tax obligations, and evaluate live scores.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isAccountant && (
            <button 
              onClick={() => setShowCreateObligationModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: '#B58A2B', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              <PlusCircle size={16} />
              Schedule custom obligation
            </button>
          )}

          <button 
            onClick={handleRunScheduler}
            disabled={runningScheduler}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {runningScheduler ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Run Scheduler Sweep
          </button>
          
          <button 
            onClick={loadData} 
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
            Sync Tracker
          </button>
        </div>
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

      {/* Active Escalation Warnings Center */}
      {alerts.length > 0 && (
        <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={{ margin: 0, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
            <AlertTriangle size={18} style={{ color: '#ef4444' }} /> Urgent Compliance Warnings & Escalation Alerts
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
            {alerts.slice(0, 6).map((al, idx) => (
              <div key={idx} style={{ background: '#111827', padding: '0.75rem', borderRadius: '6px', borderLeft: al.alert_type === 'Late' ? '4px solid #ef4444' : '4px solid #f59e0b', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#cbd5e1', fontWeight: 'bold' }}>{al.compliance_obligations?.title || 'Filing Obligation'}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                    Type: {al.alert_type} | Due: {al.compliance_obligations?.due_date ? new Date(al.compliance_obligations.due_date).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.35rem', borderRadius: '4px', background: al.alert_type === 'Late' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: al.alert_type === 'Late' ? '#fca5a5' : '#fde047' }}>
                  {al.alert_type === 'Late' ? 'OVERDUE' : 'DUE SOON'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem' }}>
        
        {/* Compliance Timeline / Deadlines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>Filing Obligations & Timeline</h3>
              
              <div style={{ display: 'flex', gap: '0.25rem', background: '#0f172a', padding: '0.2rem', borderRadius: '6px' }}>
                <button 
                  onClick={() => setViewMode('grid')} 
                  style={{ padding: '0.35rem 0.75rem', background: viewMode === 'grid' ? '#1e293b' : 'transparent', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Calendar Grid
                </button>
                <button 
                  onClick={() => setViewMode('list')} 
                  style={{ padding: '0.35rem 0.75rem', background: viewMode === 'list' ? '#1e293b' : 'transparent', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Timeline List
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div>
                {/* Calendar Navigator */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: '#0f172a', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                  <button 
                    onClick={() => {
                      if (currentMonth === 0) {
                        setCurrentMonth(11);
                        setCurrentYear(prev => prev - 1);
                      } else {
                        setCurrentMonth(prev => prev - 1);
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: '#00a896', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}
                  >
                    &larr;
                  </button>
                  <strong style={{ color: '#fff', fontSize: '0.95rem' }}>
                    {[
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ][currentMonth]} {currentYear}
                  </strong>
                  <button 
                    onClick={() => {
                      if (currentMonth === 11) {
                        setCurrentMonth(0);
                        setCurrentYear(prev => prev + 1);
                      } else {
                        setCurrentMonth(prev => prev + 1);
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: '#00a896', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}
                  >
                    &rarr;
                  </button>
                </div>

                {/* Calendar Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '0.5rem' }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <span key={day} style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', paddingBottom: '0.25rem' }}>{day}</span>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                  {(() => {
                    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
                    const cellsList = [];
                    
                    // Pre-padding cells
                    for (let i = 0; i < firstDayIndex; i++) {
                      cellsList.push(<div key={`pad-${i}`} style={{ minHeight: '80px', borderRadius: '6px', background: 'transparent' }} />);
                    }

                    // Month cells
                    for (let d = 1; d <= daysInMonth; d++) {
                      const dayStr = String(d).padStart(2, '0');
                      const monthStr = String(currentMonth + 1).padStart(2, '0');
                      const targetDateStr = `${currentYear}-${monthStr}-${dayStr}`;

                      // Find matching obligations
                      const daySubs = submissions.filter(sub => {
                        const ob = sub.obligation || obligations.find(o => o.id === sub.obligation_id);
                        return ob && ob.due_date === targetDateStr;
                      });

                      cellsList.push(
                        <div 
                          key={`day-${d}`} 
                          style={{ 
                            minHeight: '85px', 
                            background: '#0f172a', 
                            borderRadius: '8px', 
                            border: '1px solid rgba(255,255,255,0.02)',
                            padding: '0.35rem', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'space-between',
                            alignItems: 'stretch'
                          }}
                        >
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', alignSelf: 'flex-start' }}>{d}</span>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem' }}>
                            {daySubs.map(sub => {
                              const ob = sub.obligation || obligations.find(o => o.id === sub.obligation_id);
                              if (!ob) return null;
                              const isObLate = ob.status === 'Late';

                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => setSelectedSub(sub)}
                                  title={`${ob.title} - ${sub.status}`}
                                  style={{
                                    width: '100%',
                                    border: 'none',
                                    borderRadius: '3px',
                                    fontSize: '0.65rem',
                                    padding: '0.15rem 0.3rem',
                                    textAlign: 'left',
                                    background: isObLate ? 'rgba(239, 68, 68, 0.15)' : sub.status === 'Approved' || sub.status === 'Filed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                    color: isObLate ? '#fca5a5' : sub.status === 'Approved' || sub.status === 'Filed' ? '#34d399' : '#fde047',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                >
                                  {ob.title.length > 12 ? ob.title.substring(0, 10) + '..' : ob.title}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return cellsList;
                  })()}
                </div>
              </div>
            ) : (
              <div>
                {submissions.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No obligations configured. Select country pack or trigger scheduler sweep.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {submissions.map(sub => {
                      const ob = sub.obligation || obligations.find(o => o.id === sub.obligation_id);
                      if (!ob) return null;

                      const isObLate = ob.status === 'Late';
                      
                      return (
                        <div 
                          key={sub.id} 
                          style={{ 
                            padding: '1rem', 
                            background: '#0f172a', 
                            borderRadius: '8px', 
                            border: isObLate ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.02)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{
                              background: isObLate ? 'rgba(239, 68, 68, 0.1)' : sub.status === 'Approved' || sub.status === 'Filed' ? 'rgba(16, 185, 129, 0.1)' : sub.status === 'Under Review' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                              color: isObLate ? '#ef4444' : sub.status === 'Approved' || sub.status === 'Filed' ? '#10b981' : sub.status === 'Under Review' ? '#3b82f6' : '#f59e0b',
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {isObLate ? <AlertCircle size={18} /> : <Calendar size={18} />}
                            </div>

                            <div>
                              <h4 style={{ margin: 0, color: '#fff', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {ob.title}
                                {isObLate && (
                                  <span style={{ fontSize: '0.65rem', background: '#ef4444', color: '#fff', padding: '0.15rem 0.35rem', borderRadius: '4px', fontWeight: 'bold' }}>
                                    OVERDUE
                                  </span>
                                )}
                              </h4>
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
                                isObLate ? 'rgba(239, 68, 68, 0.2)' :
                                sub.status === 'Approved' || sub.status === 'Filed' ? 'rgba(16, 185, 129, 0.2)' : 
                                sub.status === 'Under Review' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                              color: 
                                isObLate ? '#ef4444' :
                                sub.status === 'Approved' || sub.status === 'Filed' ? '#10b981' : 
                                sub.status === 'Under Review' ? '#3b82f6' : '#f59e0b'
                            }}>
                              {isObLate ? 'Late' : sub.status}
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
            )}
          </div>
        </div>

        {/* Configuration Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Live Score Tracker Dashboard (Phase 9) */}
          <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} style={{ color: '#10b981' }} /> Compliance Rating
            </h3>
            
            <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>WORKSPACE COMPLIANCE SCORE</span>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: complianceScore !== null ? (complianceScore >= 90 ? '#10b981' : complianceScore >= 70 ? '#f59e0b' : '#ef4444') : '#94a3b8'
              }}>
                {complianceScore !== null ? `${complianceScore}%` : 'Calculating...'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                {complianceScore !== null && complianceScore >= 90 ? 'Excellent Standing' : complianceScore !== null && complianceScore >= 70 ? 'Action Recommended' : 'Critical Escalation Active'}
              </div>
            </div>
          </div>

          {/* Active Jurisdiction Country Selector (Phase 9) */}
          <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={18} style={{ color: '#3b82f6' }} /> Regulatory Region
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Select Active Filing Jurisdiction</label>
              <select
                value={workspaceCountry}
                disabled={updatingCountry}
                onChange={e => handleCountryChange(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff' }}
              >
                <option value="US">🇺🇸 United States (CIT, Form 941)</option>
                <option value="UK">🇬🇧 United Kingdom (HMRC VAT, PAYE)</option>
                <option value="IN">🇮🇳 Republic of India (GST, TDS)</option>
              </select>
              {updatingCountry && <span style={{ fontSize: '0.7rem', color: '#3b82f6' }}>Restructuring calendar obligations...</span>}
            </div>
          </div>

          {/* Subscribe Regional Pack */}
          {!isAccountant && (
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={18} style={{ color: '#00a896' }} /> Bootstrap Legacy Packs
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
            {!isAccountant && (selectedSub.status === 'Draft' || selectedSub.status === 'Rejected') && (
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
            {selectedSub.status !== 'Draft' && selectedSub.status !== 'Under Review' && selectedSub.status !== 'Rejected' && (
              <p style={{ color: '#10b981', textAlign: 'center', fontWeight: 'bold', marginTop: '1rem' }}>
                ✓ This filing has already been audited & approved.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Create Obligation Modal */}
      {showCreateObligationModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '12px', width: '480px', position: 'relative', color: '#fff' }}>
            <button onClick={() => setShowCreateObligationModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#fff' }}>Schedule Custom Filing Obligation</h3>
            
            <form onSubmit={handleCreateObligation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Obligation Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Q3 VAT Declaration" 
                  required 
                  value={obligationForm.title} 
                  onChange={e => setObligationForm({ ...obligationForm, title: e.target.value })} 
                  style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Due Date</label>
                  <input 
                    type="date" 
                    required 
                    value={obligationForm.dueDate} 
                    onChange={e => setObligationForm({ ...obligationForm, dueDate: e.target.value })} 
                    style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Obligation Type</label>
                  <select
                    value={obligationForm.type}
                    onChange={e => setObligationForm({ ...obligationForm, type: e.target.value })}
                    style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff' }}
                  >
                    <option value="GST">GST</option>
                    <option value="VAT">VAT</option>
                    <option value="TDS">TDS</option>
                    <option value="Corporate Tax">Corporate Tax</option>
                    <option value="Payroll Tax">Payroll Tax</option>
                    <option value="Company Return">Company Return</option>
                    <option value="License Renewal">License Renewal</option>
                    <option value="Regulatory Filing">Regulatory Filing</option>
                    <option value="Audit">Audit</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Assign Specialist</label>
                  <select
                    value={obligationForm.assignedSpecialistId}
                    onChange={e => setObligationForm({ ...obligationForm, assignedSpecialistId: e.target.value })}
                    style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff' }}
                  >
                    <option value="">-- Choose Specialist --</option>
                    {specialists.map(sp => (
                      <option key={sp.id} value={sp.id}>{sp.full_name} ({sp.role})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Score Impact (0-100)</label>
                  <input 
                    type="number" 
                    required 
                    min={0}
                    max={100}
                    value={obligationForm.complianceScoreImpact} 
                    onChange={e => setObligationForm({ ...obligationForm, complianceScoreImpact: Number(e.target.value) })} 
                    style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Notes / Description</label>
                <textarea 
                  placeholder="Additional details about the filing requirements..."
                  value={obligationForm.notes} 
                  onChange={e => setObligationForm({ ...obligationForm, notes: e.target.value })} 
                  style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', minHeight: '60px' }} 
                />
              </div>

              <button type="submit" disabled={submitting} style={{ padding: '0.6rem', background: '#B58A2B', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                {submitting ? 'Scheduling...' : 'Schedule Custom Obligation'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
