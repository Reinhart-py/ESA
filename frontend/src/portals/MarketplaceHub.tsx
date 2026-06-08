import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client.ts';
import { 
  Briefcase, Users, FileText, CheckCircle, Shield, 
  DollarSign, Tag, Clock, ArrowRight, Loader2, Star 
} from 'lucide-react';

interface Professional {
  id: string;
  bio: string;
  hourly_rate_cents: number;
  specializations: string[];
  availability_status: string;
  rating_average: number;
  users: {
    full_name: string;
    email: string;
  };
}

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_cents: number;
  status: string;
  created_at: string;
}

interface Quote {
  id: string;
  request_id: string;
  professional_id: string;
  amount_cents: number;
  proposal: string;
  status: string;
  professional: {
    full_name: string;
    email: string;
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
  professional: {
    full_name: string;
  };
  request: {
    title: string;
  };
}

export default function MarketplaceHub() {
  const [tab, setTab] = useState<'directory' | 'requests' | 'contracts'>('directory');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);

  // New Request Form State
  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqCategory, setReqCategory] = useState('Audit');
  const [reqBudget, setReqBudget] = useState('');

  // Selected request and its quotes
  const [selectedReq, setSelectedReq] = useState<ServiceRequest | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  // Contract Signature State
  const [signingContractId, setSigningContractId] = useState<string | null>(null);
  const [signatureText, setSignatureText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [prosRes, reqsRes, contractsRes] = await Promise.all([
        apiClient.get('/marketplace/professionals'),
        apiClient.get('/marketplace/requests'),
        apiClient.get('/marketplace/contracts')
      ]);
      setProfessionals(prosRes.data || []);
      setRequests(reqsRes.data || []);
      setContracts(contractsRes.data || []);
    } catch (err) {
      console.error('Error fetching marketplace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim() || !reqDesc.trim()) return;
    try {
      await apiClient.post('/marketplace/requests', {
        title: reqTitle,
        description: reqDesc,
        category: reqCategory,
        budgetCents: parseFloat(reqBudget || '0') * 100
      });
      setReqTitle('');
      setReqDesc('');
      setReqBudget('');
      loadData();
    } catch (err) {
      console.error('Error posting service request:', err);
    }
  };

  const handleSelectRequest = async (req: ServiceRequest) => {
    setSelectedReq(req);
    setLoadingQuotes(true);
    try {
      const res = await apiClient.get(`/marketplace/requests/${req.id}/quotes`);
      setQuotes(res.data || []);
    } catch (err) {
      console.error('Error loading request quotes:', err);
    } finally {
      setLoadingQuotes(false);
    }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    if (!confirm('Are you sure you want to accept this quotation? This will automatically initialize the digital contract binding.')) return;
    try {
      await apiClient.post(`/marketplace/quotes/${quoteId}/accept`);
      setSelectedReq(null);
      setTab('contracts');
    } catch (err) {
      console.error('Error accepting quote:', err);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Top Navbar tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
        <button 
          onClick={() => setTab('directory')}
          style={{ padding: '0.5rem 1.25rem', background: tab === 'directory' ? '#00A896' : 'transparent', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Users size={16} /> Accountant Directory
        </button>
        <button 
          onClick={() => setTab('requests')}
          style={{ padding: '0.5rem 1.25rem', background: tab === 'requests' ? '#00A896' : 'transparent', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Briefcase size={16} /> Service Requests
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
          <Loader2 size={24} className="animate-spin" style={{ marginRight: '0.5rem' }} /> Loading marketplace...
        </div>
      )}

      {!loading && tab === 'directory' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {professionals.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No verified professionals available in the network directory currently.</p>
          ) : (
            professionals.map(pro => (
              <div key={pro.id} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#fff' }}>{pro.users?.full_name}</h3>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{pro.users?.email}</span>
                  </div>
                  <div style={{ background: 'rgba(0,168,150,0.1)', color: '#00d2c4', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Star size={12} fill="#00d2c4" /> {pro.rating_average.toFixed(1)}
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>{pro.bio}</p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {pro.specializations.map((spec, i) => (
                    <span key={i} style={{ background: '#0f172a', color: '#94a3b8', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{spec}</span>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8' }}>Hourly rate:</span>
                  <strong style={{ color: '#fff' }}>${(pro.hourly_rate_cents / 100).toFixed(2)} / hr</strong>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && tab === 'requests' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
          {/* Requests List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, color: '#fff' }}>Active Service Requests</h3>
            
            {requests.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>No service requests posted yet. Create one on the right panel.</p>
            ) : (
              requests.map(req => (
                <div key={req.id} style={{ background: '#1e293b', border: selectedReq?.id === req.id ? '2px solid #00A896' : '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '1rem', cursor: 'pointer' }} onClick={() => handleSelectRequest(req)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, color: '#fff' }}>{req.title}</h4>
                    <span style={{ fontSize: '0.75rem', background: '#334155', color: '#cbd5e1', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{req.category}</span>
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>{req.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b', marginTop: '0.75rem' }}>
                    <span>Budget: ${(req.budget_cents / 100).toLocaleString()}</span>
                    <span>Status: {req.status}</span>
                  </div>
                </div>
              ))
            )}

            {/* Selected Request Bids/Quotes */}
            {selectedReq && (
              <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', marginTop: '1.5rem' }}>
                <h4 style={{ margin: 0, color: '#fff' }}>Quotations for "{selectedReq.title}"</h4>
                
                {loadingQuotes ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '1rem' }}>Loading quote responses...</p>
                ) : quotes.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '1rem' }}>No quotation bids submitted yet by professionals.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                    {quotes.map(q => (
                      <div key={q.id} style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>{q.professional?.full_name}</strong>
                          <span style={{ color: '#00d2c4', fontWeight: 'bold' }}>${(q.amount_cents / 100).toLocaleString()}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>{q.proposal}</p>
                        <button 
                          onClick={() => handleAcceptQuote(q.id)}
                          style={{ alignSelf: 'flex-end', padding: '0.35rem 0.75rem', background: '#00A896', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                        >
                          Accept Quotation
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Post New Request Panel */}
          <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', height: 'fit-content' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#fff' }}>Post Service Request</h3>
            <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Project Title</label>
                <input 
                  type="text" 
                  value={reqTitle}
                  onChange={e => setReqTitle(e.target.value)}
                  placeholder="e.g. Q4 Audit Readiness Review"
                  required
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Category</label>
                <select 
                  value={reqCategory}
                  onChange={e => setReqCategory(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
                >
                  <option value="Audit">Audit</option>
                  <option value="GST">GST Setup</option>
                  <option value="VAT">VAT filing</option>
                  <option value="Corporate Tax">Corporate Tax</option>
                  <option value="Payroll Tax">Payroll Tax</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Budget ($ USD)</label>
                <input 
                  type="number" 
                  value={reqBudget}
                  onChange={e => setReqBudget(e.target.value)}
                  placeholder="e.g. 1500"
                  required
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Description</label>
                <textarea 
                  value={reqDesc}
                  onChange={e => setReqDesc(e.target.value)}
                  placeholder="Provide scope details, compliance timelines..."
                  required
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff', minHeight: '80px' }}
                />
              </div>

              <button type="submit" style={{ padding: '0.5rem', background: '#00A896', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                Post Request
              </button>
            </form>
          </div>
        </div>
      )}

      {!loading && tab === 'contracts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, color: '#fff' }}>Active Engagement Contracts</h3>
          
          {contracts.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No active service engagement agreements found.</p>
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
                  <div>Assigned Professional: <strong>{c.professional?.full_name}</strong></div>
                  <div>Amount: <strong>${(c.amount_cents / 100).toLocaleString()}</strong></div>
                </div>

                {c.status === 'pending' && !c.client_signature && (
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
