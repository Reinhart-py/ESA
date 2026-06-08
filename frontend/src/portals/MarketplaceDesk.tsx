import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client.ts';
import { 
  Users, Briefcase, FileText, CheckCircle, Shield, 
  DollarSign, Tag, Clock, ArrowRight, Loader2, Award 
} from 'lucide-react';

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_cents: number;
  status: string;
  created_at: string;
  tenants: {
    name: string;
  };
}

interface Contract {
  id: string;
  request_id: string;
  professional_id: string;
  amount_cents: number;
  terms: string;
  status: string;
  client_signature: string;
  professional_signature: string;
  tenants: {
    name: string;
  };
  request: {
    title: string;
  };
}

export default function MarketplaceDesk() {
  const [tab, setTab] = useState<'feed' | 'onboarding' | 'contracts'>('feed');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);

  // Profile Onboarding Form State
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);

  // Quote form state
  const [selectedReq, setSelectedReq] = useState<ServiceRequest | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteProposal, setQuoteProposal] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // Contract signature state
  const [signingContractId, setSigningContractId] = useState<string | null>(null);
  const [signatureText, setSignatureText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqsRes, contractsRes] = await Promise.all([
        apiClient.get('/marketplace/requests'),
        apiClient.get('/marketplace/contracts')
      ]);
      setRequests(reqsRes.data || []);
      setContracts(contractsRes.data || []);
    } catch (err) {
      console.error('Error fetching marketplace desk data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data } = await apiClient.get('/users');
      // If we need user details, fetch from backend
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    loadData();
    fetchProfile();
  }, [tab]);

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await apiClient.post('/onboarding/professional', {
        bio,
        hourlyRateCents: parseFloat(hourlyRate || '0') * 100,
        specializations
      });
      alert('Professional profile registered successfully! You are now verified.');
      setTab('feed');
    } catch (err) {
      console.error('Error submitting professional profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !quoteAmount || !quoteProposal.trim()) return;
    setSubmittingQuote(true);
    try {
      await apiClient.post(`/marketplace/requests/${selectedReq.id}/quotes`, {
        amountCents: parseFloat(quoteAmount) * 100,
        proposal: quoteProposal
      });
      setSelectedReq(null);
      setQuoteAmount('');
      setQuoteProposal('');
      alert('Quotation bid submitted successfully.');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit quote.');
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleSignContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signingContractId || !signatureText.trim()) return;
    try {
      await apiClient.post(`/marketplace/contracts/${signingContractId}/sign`, {
        signatureText
      });
      setSigningContractId(null);
      setSignatureText('');
      loadData();
    } catch (err) {
      console.error('Error signing contract:', err);
    }
  };

  const toggleSpecialization = (spec: string) => {
    if (specializations.includes(spec)) {
      setSpecializations(specializations.filter(s => s !== spec));
    } else {
      setSpecializations([...specializations, spec]);
    }
  };

  const specOptions = ['Tax Preparation', 'Audit Readiness', 'GST Compliance', 'VAT Filing', 'Bookkeeping', 'Financial Planning'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Top Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
        <button 
          onClick={() => setTab('feed')}
          style={{ padding: '0.5rem 1.25rem', background: tab === 'feed' ? '#00A896' : 'transparent', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Briefcase size={16} /> Client Request Feed
        </button>
        <button 
          onClick={() => setTab('onboarding')}
          style={{ padding: '0.5rem 1.25rem', background: tab === 'onboarding' ? '#00A896' : 'transparent', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Award size={16} /> Professional Profile
        </button>
        <button 
          onClick={() => setTab('contracts')}
          style={{ padding: '0.5rem 1.25rem', background: tab === 'contracts' ? '#00A896' : 'transparent', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FileText size={16} /> Active Engagements
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#94a3b8' }}>
          <Loader2 size={24} className="animate-spin" style={{ marginRight: '0.5rem' }} /> Loading desk...
        </div>
      )}

      {!loading && tab === 'feed' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
          {/* Requests Feed list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, color: '#fff' }}>Open Client Requests</h3>
            
            {requests.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No open service requests listed in the directory currently.</p>
            ) : (
              requests.map(req => (
                <div key={req.id} style={{ background: '#1e293b', border: selectedReq?.id === req.id ? '2px solid #00A896' : '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '1rem', cursor: 'pointer' }} onClick={() => setSelectedReq(req)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, color: '#fff' }}>{req.title}</h4>
                    <span style={{ fontSize: '0.75rem', background: '#334155', color: '#cbd5e1', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{req.category}</span>
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#cbd5e1' }}>{req.description}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.75rem' }}>
                    <span>Client Company: <strong>{req.tenants?.name}</strong></span>
                    <span>Budget Offer: <strong>${(req.budget_cents / 100).toLocaleString()}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quotation Submission Panel */}
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', height: 'fit-content' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#fff' }}>Bid Quotation</h3>
            {selectedReq ? (
              <form onSubmit={handleQuoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', background: '#0f172a', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <div style={{ color: '#94a3b8' }}>Requesting:</div>
                  <strong style={{ color: '#fff' }}>{selectedReq.title}</strong>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Bid Amount ($ USD)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 1200" 
                    value={quoteAmount}
                    onChange={e => setQuoteAmount(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>proposal Details</label>
                  <textarea 
                    placeholder="Describe your qualifications, timelines, approach..." 
                    value={quoteProposal}
                    onChange={e => setQuoteProposal(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff', minHeight: '100px' }}
                  />
                </div>

                <button type="submit" disabled={submittingQuote} style={{ padding: '0.5rem', background: '#00A896', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                  {submittingQuote ? 'Submitting Bid...' : 'Submit Quotation'}
                </button>
              </form>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Select a client request on the left feed to submit a quote bid.</p>
            )}
          </div>
        </div>
      )}

      {!loading && tab === 'onboarding' && (
        <div style={{ maxWidth: '600px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '2rem' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#fff' }}>Accountant Onboarding & Verification Profile</h3>
          
          <form onSubmit={handleOnboardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Professional Bio / Overview</label>
              <textarea 
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="State your tax experience, certifications (CPA/CA), audit history..."
                required
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff', minHeight: '120px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Hourly Billing Rate ($ USD / hr)</label>
              <input 
                type="number" 
                value={hourlyRate}
                onChange={e => setHourlyRate(e.target.value)}
                placeholder="e.g. 150"
                required
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Specialization Tags</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {specOptions.map(spec => (
                  <button 
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialization(spec)}
                    style={{ padding: '0.5rem', background: specializations.includes(spec) ? '#00A896' : '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'left' }}
                  >
                    {specializations.includes(spec) ? '✓ ' : '+ '} {spec}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={profileLoading} style={{ padding: '0.75rem', background: '#00A896', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, marginTop: '1rem' }}>
              {profileLoading ? 'Registering profile...' : 'Save & Request Verification Approval'}
            </button>
          </form>
        </div>
      )}

      {!loading && tab === 'contracts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, color: '#fff' }}>Active Client Agreements</h3>
          
          {contracts.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No active client engagement contracts found.</p>
          ) : (
            contracts.map(c => (
              <div key={c.id} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, color: '#fff' }}>{c.request?.title}</h4>
                  <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: c.status === 'signed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: c.status === 'signed' ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
                    {c.status.toUpperCase()}
                  </span>
                </div>

                <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', color: '#cbd5e1', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {c.terms}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <div>Client Organization: <strong>{c.tenants?.name}</strong></div>
                  <div>Contract Amount: <strong>${(c.amount_cents / 100).toLocaleString()}</strong></div>
                </div>

                {c.status === 'pending' && !c.professional_signature && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '1rem' }}>
                    <form onSubmit={handleSignContract} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>E-Signature (Type Full Name)</label>
                        <input 
                          type="text" 
                          placeholder="Your Name" 
                          value={signatureText}
                          onChange={e => {
                            setSigningContractId(c.id);
                            setSignatureText(e.target.value);
                          }}
                          required
                          style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
                        />
                      </div>
                      <button type="submit" style={{ padding: '0.4rem 1.2rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                        Sign Agreement
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
