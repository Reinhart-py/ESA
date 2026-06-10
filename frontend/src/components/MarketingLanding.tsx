import React, { useState, useContext, useEffect, useRef } from 'react';
import { 
  Shield, Lock, Mail, User, Check, Sparkles, 
  ArrowRight, X, ChevronDown, ChevronUp,
  MessageSquare, Users, FileText, Phone, Award,
  Terminal, Code, Server, BookOpen, Layers, Eye,
  HelpCircle, Settings, LogOut, Sun, Moon, Send, ArrowLeft
} from 'lucide-react';
import Toast from './ui/Toast.tsx';
import { AppContext } from '../context/AppContext.tsx';

// Modular Page imports
import MarketingNav from '../marketing/MarketingNav.tsx';
import MarketingFooter from '../marketing/MarketingFooter.tsx';
import Hero from '../marketing/Hero.tsx';
import Features from '../marketing/Features.tsx';
import Pricing from '../marketing/Pricing.tsx';
import Faqs from '../marketing/Faqs.tsx';

interface MarketingLandingProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  fullName: string;
  setFullName: (val: string) => void;
  businessName: string;
  setBusinessName: (val: string) => void;
  businessType: string;
  setBusinessType: (val: string) => void;
  isRegister: boolean;
  setIsRegister: (val: boolean) => void;
  error: string;
  loading: boolean;
  handleLogin: (e: React.FormEvent) => Promise<void>;
  handleRegister: (e: React.FormEvent) => Promise<void>;
  inviteToken: string;
  inviteValidated: boolean;
  inviteData: any;
  handleAcceptInviteSubmit: (e: React.FormEvent) => Promise<void>;
}

export default function MarketingLanding({
  email, setEmail,
  password, setPassword,
  fullName, setFullName,
  businessName, setBusinessName,
  businessType, setBusinessType,
  isRegister, setIsRegister,
  error,
  loading,
  handleLogin,
  handleRegister,
  inviteToken,
  inviteValidated,
  inviteData,
  handleAcceptInviteSubmit
}: MarketingLandingProps) {
  const context = useContext(AppContext);
  const themeMode = (context?.themeMode || 'light') as 'light' | 'dark';
  const toggleTheme = context?.toggleTheme || (() => {});

  // Modals & Panels State
  const [showAuthModal, setShowAuthModal] = useState(inviteToken && inviteValidated);
  const [toast, setToast] = useState<{ id: string; type: 'success' | 'info' | 'error' | 'warning'; title: string; message: string } | null>(null);
  
  // Interactive Chat State ("Chat with Jess")
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'jess'; text: string; time: string }>>([
    { sender: 'jess', text: "Hi! I'm Jess, your dedicated bookkeeping consultant. How can I help you clean up your books or maximize your tax write-offs today?", time: 'Just now' }
  ]);
  const [userMsgInput, setUserMsgInput] = useState('');
  const [isJessTyping, setIsJessTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Interactive Resource Hub (Blog Articles Drawer)
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  
  // Interactive Feature Demo Drawers
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  
  // Topic Detail Modals (Navbar / Footer clicks)
  const [activeModalTopic, setActiveModalTopic] = useState<string | null>(null);

  // Lead Assessment Form State
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', companyName: '', email: '', phone: '', revenue: 'Average Monthly Revenue*' });

  // Feature Demo State Variables
  const [selectedPnLPeriod, setSelectedPnLPeriod] = useState<'Q1' | 'Q2' | 'Q3'>('Q3');
  const [demoTransactions, setDemoTransactions] = useState([
    { id: 1, merchant: 'Amazon Web Services', amount: -429.50, category: 'Software/SaaS', date: 'June 08, 2026', status: 'Pending Review' },
    { id: 2, merchant: 'Blue Bottle Coffee', amount: -28.40, category: 'Meals & Entertainment', date: 'June 07, 2026', status: 'Pending Review' },
    { id: 3, merchant: 'Stripe Payout', amount: 8450.00, category: 'Revenue', date: 'June 06, 2026', status: 'Pending Review' }
  ]);
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, label: 'Form W-9/W-2 filings compiled', checked: true },
    { id: 2, label: 'Business bank statements connected', checked: true },
    { id: 3, label: 'Year-end ledger reconciliation review', checked: false },
    { id: 4, label: 'Corporate tax return 1120-S preparation', checked: false }
  ]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isJessTyping, isChatOpen]);

  const handleSendMessage = (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const textToSend = textOverride || userMsgInput;
    if (!textToSend.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { sender: 'user', text: textToSend, time: timestamp }]);
    if (!textOverride) setUserMsgInput('');
    setIsJessTyping(true);

    setTimeout(() => {
      let responseText = "That's a great question! Typically, our specialists handle this end-to-end within 48 hours. Let's schedule a free call to get this customized for your organization.";
      const query = textToSend.toLowerCase();

      if (query.includes('price') || query.includes('cost') || query.includes('pricing')) {
        responseText = "Our plans start at just $149/mo for Stewardship Bookkeeping, and $299/mo for complete Bookkeeping + Tax preparation. We support direct bank feeds and dedicated accountant support for all tiers!";
      } else if (query.includes('tax') || query.includes('write-off') || query.includes('deduct')) {
        responseText = "We help identify up to 17 major tax write-offs including home office, software, utility percentages, and corporate travel. Jess can scan your Q2 statements immediately upon setup!";
      } else if (query.includes('quickbooks') || query.includes('alternative')) {
        responseText = "Unlike QuickBooks where you have to do all the work yourself, EAC Solutions is fully managed. You get a real dedicated bookkeeper to reconcile everything for you.";
      } else if (query.includes('help') || query.includes('support') || query.includes('contact')) {
        responseText = "You can speak with me here or call our specialist helpline directly. If you setup a guest account, you'll be assigned a dedicated steward immediately.";
      }

      setChatMessages(prev => [...prev, { sender: 'jess', text: responseText, time: 'Just now' }]);
      setIsJessTyping(false);
    }, 1200);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.revenue === 'Average Monthly Revenue*') {
      setToast({
        id: Math.random().toString(),
        type: 'warning',
        title: 'Form Incomplete',
        message: 'Please select your business average monthly revenue range.'
      });
      return;
    }
    setFormLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setFormLoading(false);
    setFormSubmitted(true);
    setToast({
      id: Math.random().toString(),
      type: 'success',
      title: 'Consultation Scheduled!',
      message: `Thanks ${formData.firstName}! We scheduled your assessment and sent details to ${formData.email}.`
    });
  };

  const handleOpenAuth = (registerMode: boolean) => {
    setIsRegister(registerMode);
    setShowAuthModal(true);
  };

  const handleCopyKey = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleToggleChecklist = (id: number) => {
    setChecklistItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleAcceptTransaction = (id: number) => {
    setDemoTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'Reconciled' } : t));
  };

  // Mock Blog Articles
  const blogArticles: Record<string, { title: string; category: string; readTime: string; body: React.ReactNode }> = {
    'tax-deductions': {
      title: "17 Big Tax Deductions (Write Offs) for Small Business",
      category: "Tax Deductions Guide",
      readTime: "6 min read",
      body: (
        <div style={{ lineHeight: 1.7, fontSize: '0.95rem' }}>
          <p style={{ marginBottom: '1rem' }}>When running a business, every dollar counts. Claiming correct tax write-offs is the easiest way to boost your bottom line legally. Here are the core categories we help automate:</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                <th style={{ padding: '0.5rem 0', fontWeight: 'bold' }}>Deduction Category</th>
                <th style={{ padding: '0.5rem 0', fontWeight: 'bold' }}>Average Write-Off</th>
                <th style={{ padding: '0.5rem 0', fontWeight: 'bold' }}>IRS Rule Compliance</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '0.75rem 0' }}>Home Office Expense</td>
                <td style={{ padding: '0.75rem 0' }}>$1,500 - $3,000</td>
                <td style={{ padding: '0.75rem 0', color: '#10B981' }}>Simplified or actual method allowed</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '0.75rem 0' }}>Software & Subscriptions</td>
                <td style={{ padding: '0.75rem 0' }}>100% of expense</td>
                <td style={{ padding: '0.75rem 0', color: '#10B981' }}>Must be directly business related</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '0.75rem 0' }}>Business Meals</td>
                <td style={{ padding: '0.75rem 0' }}>50% allowance</td>
                <td style={{ padding: '0.75rem 0', color: '#10B981' }}>Requires client/consultant notes</td>
              </tr>
            </tbody>
          </table>
          <p style={{ marginBottom: '1rem' }}>EAC Solutions automatically categorizes credit card statements to map to these tax lines dynamically. Your dedicated bookkeeper signs off on the accuracy before filing.</p>
        </div>
      )
    },
    'quickbooks-alternatives': {
      title: "11 Alternatives to QuickBooks in 2026",
      category: "Product Guides",
      readTime: "8 min read",
      body: (
        <div style={{ lineHeight: 1.7, fontSize: '0.95rem' }}>
          <p style={{ marginBottom: '1rem' }}>QuickBooks remains the industry titan, but it has key pain points: steep learning curves, expensive tier upgrades, and most importantly, <strong>you still have to do all the work yourself</strong>.</p>
          <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Why EAC Solutions is Different:</h4>
          <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <li><strong>No Manual Entry:</strong> We connect bank feeds, and our human specialists reconcile accounts for you.</li>
            <li><strong>Integrated Tax Filing:</strong> Seamlessly transition from monthly statements to year-end IRS filing.</li>
            <li><strong>Expert Support:</strong> Ask questions directly in the dashboard and get prompt advisory responses.</li>
          </ul>
          <p>If you're looking for simple software, choose Xero or Wave. If you want a complete hands-off finance operation, choose EAC Solutions.</p>
        </div>
      )
    },
    'financial-statements': {
      title: "How to Read (and Analyze) Financial Statements",
      category: "Education",
      readTime: "10 min read",
      body: (
        <div style={{ lineHeight: 1.7, fontSize: '0.95rem' }}>
          <p style={{ marginBottom: '1rem' }}>Understanding financial statements is crucial for scaling your company. There are three primary statements every founder must master:</p>
          <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <li><strong>Profit & Loss (P&L):</strong> Shows revenue, expenses, and net margin over a specific month or quarter.</li>
            <li><strong>Balance Sheet:</strong> Visualizes assets (cash, equipment), liabilities (loans, debts), and owner equity.</li>
            <li><strong>Cash Flow Statement:</strong> Shows the actual physical cash entering and leaving your bank accounts.</li>
          </ol>
          <p>With EAC Solutions, these statements are prepared, balanced, and delivered to your portal by the 10th of every month. No guesswork, just actionable business intelligence.</p>
        </div>
      )
    }
  };

  // Mock Topic Details for Navbar & Footer
  const topicDetails: Record<string, { title: string; content: React.ReactNode }> = {
    'security': {
      title: "Security & Encryption Infrastructure",
      content: (
        <div>
          <p style={{ marginBottom: '1rem' }}>At EAC Solutions, we maintain bank-grade security protocols to protect your sensitive financial data. Our infrastructure incorporates:</p>
          <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <li><strong>SOC 2 Type II:</strong> Our server infrastructure hosts satisfy rigorous SOC2 standards for data safety.</li>
            <li><strong>AES-256 Encryption:</strong> All files and ledger details are encrypted at rest and in transit (TLS 1.3).</li>
            <li><strong>Strict Rate Limiting:</strong> Protects our APIs from automated dictionary and DDoS queries.</li>
            <li><strong>Token Authorization:</strong> Zero password sharing. We connect to bank feeds securely via Plaid read-only integrations.</li>
          </ul>
        </div>
      )
    },
    'api-keys': {
      title: "API Keys & Webhooks Integration",
      content: (
        <div>
          <p style={{ marginBottom: '1rem' }}>Programmatically pull your financial statements, tax obligation calendar, or trigger audit log streams directly into your internal company portals.</p>
          <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Sample API Request:</p>
          <pre style={{ background: '#1E2937', color: '#F3F4F6', padding: '1rem', borderRadius: '8px', overflowX: 'auto', fontSize: '0.85rem', fontFamily: 'monospace', marginBottom: '1.5rem' }}>
{`curl -X GET "https://api.eac-solutions.com/v1/compliance/obligations" \\
  -H "Authorization: Bearer eac_live_79aefc3..." \\
  -H "Content-Type: application/json"`}
          </pre>
        </div>
      )
    },
    'how-it-works': {
      title: "How EAC Solutions Works",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>1</div>
            <div>
              <h4 style={{ fontWeight: 'bold', margin: 0 }}>Connect Your Accounts</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#4B5563' }}>Securely link your business bank accounts and payment processors in just 2 minutes via Plaid.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>2</div>
            <div>
              <h4 style={{ fontWeight: 'bold', margin: 0 }}>Dedicated Specialists Take Over</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#4B5563' }}>Your assigned bookkeeping team categorizes transactions, resolves ambiguities, and balances the ledger daily.</p>
            </div>
          </div>
        </div>
      )
    },
    'reviews': {
      title: "Customer Reviews",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h4 style={{ fontWeight: 'bold', margin: 0 }}>"Life saver for tax season!"</h4>
            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#4B5563' }}>We switched from standard QuickBooks and immediately saved $4,200 in deductions we were previously missing. Outstanding service.</p>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>- Marcus T., CEO of Helix Tech</span>
          </div>
        </div>
      )
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: themeMode === 'light' ? '#FFFFFF' : '#0B0F19', 
      color: themeMode === 'light' ? '#111827' : '#F9FAFB',
      fontFamily: 'Inter, system-ui, sans-serif',
      overflowX: 'hidden',
      transition: 'background-color 0.3s, color 0.3s'
    }}>
      {toast && <Toast id={toast.id} type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />}

      {/* Modular Navigation */}
      <MarketingNav
        themeMode={themeMode}
        toggleTheme={toggleTheme}
        onOpenAuth={handleOpenAuth}
        onOpenTopic={setActiveModalTopic}
      />

      {/* Modular Hero */}
      <Hero
        themeMode={themeMode}
        onOpenAuth={handleOpenAuth}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenFeature={setSelectedFeature}
      />

      {/* Trust Badges Summary */}
      <section style={{ padding: '4rem 2rem', borderBottom: `1px solid var(--card-border)` }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          <div className="premium-card">
            <h4>Marcus T., CEO Helix Tech</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-sec)' }}>"We switched from standard QuickBooks and saved $4,200 in deductions. Outstanding service."</p>
          </div>
          <div className="premium-card">
            <h4>Clara Jenkins, Founder</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-sec)' }}>"Having Jessica a single click away gives us massive confidence in our weekly decisions."</p>
          </div>
        </div>
      </section>

      {/* Modular Features */}
      <Features
        themeMode={themeMode}
        demoTransactions={demoTransactions}
        checklistItems={checklistItems}
        onOpenFeature={setSelectedFeature}
      />

      {/* Modular Pricing */}
      <Pricing
        themeMode={themeMode}
        onOpenAuth={handleOpenAuth}
      />

      {/* Modular FAQs */}
      <Faqs themeMode={themeMode} />

      {/* Interactive Blog Resource Hub */}
      <section style={{ padding: '6rem 2rem', background: 'var(--surface-color)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, textAlign: 'center', marginBottom: '3rem' }}>Resources & Bookkeeping Insights</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div className="premium-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedArticle('tax-deductions')}>
              <span style={{ fontSize: '0.75rem', color: '#B58A2B', fontWeight: 'bold' }}>TAX WRITE-OFFS</span>
              <h3 style={{ fontSize: '1.2rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>17 Big Tax Deductions for Small Business</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-sec)' }}>Read guide &rarr;</p>
            </div>
            <div className="premium-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedArticle('quickbooks-alternatives')}>
              <span style={{ fontSize: '0.75rem', color: '#B58A2B', fontWeight: 'bold' }}>PRODUCT COMPARISON</span>
              <h3 style={{ fontSize: '1.2rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>11 Alternatives to QuickBooks in 2026</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-sec)' }}>Read comparison &rarr;</p>
            </div>
            <div className="premium-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedArticle('financial-statements')}>
              <span style={{ fontSize: '0.75rem', color: '#B58A2B', fontWeight: 'bold' }}>EDUCATION</span>
              <h3 style={{ fontSize: '1.2rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>How to Read & Analyze Financial Statements</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-sec)' }}>Read article &rarr;</p>
            </div>
          </div>
        </div>
      </section>

      {/* Consultation scheduler Lead form */}
      <section id="consultation-form" style={{ padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--surface-color)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Book a Free Assessment Consultation</h2>
          <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem', marginBottom: '2rem' }}>Speak with a bookkeeping expert to clean up historical records or plan IRS filings.</p>
          
          {formSubmitted ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <h3 style={{ color: 'green', marginBottom: '0.5rem' }}>Consultation Request Received!</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-sec)' }}>We sent invitation details to {formData.email}.</p>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input type="text" required placeholder="First Name" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} style={{ flex: 1, padding: '0.6rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-primary)' }} />
                <input type="text" required placeholder="Last Name" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} style={{ flex: 1, padding: '0.6rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-primary)' }} />
              </div>
              <input type="text" required placeholder="Company Name" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} style={{ padding: '0.6rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-primary)' }} />
              <input type="email" required placeholder="Email Address" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ padding: '0.6rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-primary)' }} />
              <input type="tel" required placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ padding: '0.6rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-primary)' }} />
              <button type="submit" disabled={formLoading} style={{ padding: '0.75rem', background: '#B58A2B', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
                {formLoading ? 'Booking Time Slot...' : 'Schedule Call Assessment'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Modular Footer */}
      <MarketingFooter
        themeMode={themeMode}
        onOpenTopic={setActiveModalTopic}
      />

      {/* DRAWER 1: Chat Assistant ("Chat with Jess") */}
      {isChatOpen && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', width: '380px', height: '500px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', zIndex: 1000, overflow: 'hidden' }}>
          <div style={{ padding: '1rem', background: 'var(--primary-color)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'green' }} />
              <strong style={{ fontSize: '0.9rem' }}>Chat with Jess</strong>
            </div>
            <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={18} /></button>
          </div>
          
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--surface-color)' }}>
            {chatMessages.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', background: msg.sender === 'user' ? 'var(--primary-color)' : '#E5E7EB', color: msg.sender === 'user' ? '#fff' : '#000', padding: '0.5rem 0.75rem', borderRadius: 8, fontSize: '0.85rem', maxWidth: '80%' }}>
                {msg.text}
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          <form onSubmit={handleSendMessage} style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--card-border)' }}>
            <input type="text" placeholder="Type query (e.g. pricing, write-offs)..." value={userMsgInput} onChange={e => setUserMsgInput(e.target.value)} style={{ flex: 1, padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
            <button type="submit" style={{ padding: '0.5rem 1rem', background: '#B58A2B', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Send</button>
          </form>
        </div>
      )}

      {/* DRAWER 2: Interactive Sandbox Features Details */}
      {selectedFeature && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '450px', background: 'var(--card-bg)', borderLeft: '1px solid var(--card-border)', zIndex: 1000, boxShadow: 'var(--shadow-card)', padding: '2rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ margin: 0 }}>Interactive Sandbox Tool</h3>
            <button onClick={() => setSelectedFeature(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}><X size={20} /></button>
          </div>

          {selectedFeature === 'support' && (
            <div>
              <h4>Steward Advisor Simulator</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-sec)', marginBottom: '1.5rem' }}>Send mock queries directly to our steward AI to test response accuracy.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button onClick={() => handleSendMessage(undefined, 'What tax write-offs do you support?')} style={{ padding: '0.5rem', background: 'var(--surface-color)', border: '1px solid var(--card-border)', borderRadius: 6, cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem' }}>&rarr; "What tax write-offs do you support?"</button>
                <button onClick={() => handleSendMessage(undefined, 'How do you compare to QuickBooks?')} style={{ padding: '0.5rem', background: 'var(--surface-color)', border: '1px solid var(--card-border)', borderRadius: 6, cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem' }}>&rarr; "How do you compare to QuickBooks?"</button>
              </div>
            </div>
          )}

          {selectedFeature === 'reporting' && (
            <div>
              <h4>Reconciled Statement margins</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-sec)' }}>Click quarters to see mock Gross Profit margins update.</p>
              <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
                {['Q1', 'Q2', 'Q3'].map(q => (
                  <button key={q} onClick={() => setSelectedPnLPeriod(q as any)} style={{ padding: '0.4rem 0.8rem', background: selectedPnLPeriod === q ? '#B58A2B' : 'var(--surface-color)', color: selectedPnLPeriod === q ? '#fff' : 'var(--text-primary)', border: 'none', borderRadius: 4, cursor: 'pointer' }}>{q}</button>
                ))}
              </div>
              <div style={{ background: 'var(--surface-color)', padding: '1rem', borderRadius: 8, fontSize: '0.9rem' }}>
                <div>Gross Profit Margin: <strong>{selectedPnLPeriod === 'Q3' ? '68%' : (selectedPnLPeriod === 'Q2' ? '62%' : '58%')}</strong></div>
                <div>Net Margin: <strong>{selectedPnLPeriod === 'Q3' ? '32%' : '26%'}</strong></div>
              </div>
            </div>
          )}

          {selectedFeature === 'insights' && (
            <div>
              <h4>Ledger transaction audit categorizer</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-sec)', marginBottom: '1rem' }}>Reconcile pending Amazon and Stripe feeds by clicking accept.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {demoTransactions.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)', padding: '0.5rem', borderRadius: 6 }}>
                    <span style={{ fontSize: '0.8rem' }}>{t.merchant} ({t.status})</span>
                    {t.status === 'Pending Review' && (
                      <button onClick={() => handleAcceptTransaction(t.id)} style={{ padding: '0.2rem 0.5rem', background: 'green', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>Accept</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedFeature === 'tax' && (
            <div>
              <h4>Corporate Filing Checklist</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-sec)', marginBottom: '1rem' }}>Check steps to verify tax season readiness.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {checklistItems.map(item => (
                  <div key={item.id} onClick={() => handleToggleChecklist(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.4rem', background: 'var(--surface-color)', borderRadius: 6 }}>
                    <span style={{ color: item.checked ? 'green' : '#ccc' }}>{item.checked ? '✓' : 'o'}</span>
                    <span style={{ fontSize: '0.85rem' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DRAWER 3: Blog Article Details Modal */}
      {selectedArticle && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setSelectedArticle(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}><X size={20} /></button>
            <span style={{ fontSize: '0.75rem', color: '#B58A2B', fontWeight: 'bold' }}>{blogArticles[selectedArticle].category.toUpperCase()} · {blogArticles[selectedArticle].readTime}</span>
            <h2 style={{ fontSize: '1.8rem', margin: '0.5rem 0 1.5rem 0' }}>{blogArticles[selectedArticle].title}</h2>
            {blogArticles[selectedArticle].body}
          </div>
        </div>
      )}

      {/* DRAWER 4: General Topic Overlays */}
      {activeModalTopic && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '550px', position: 'relative' }}>
            <button onClick={() => setActiveModalTopic(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}><X size={20} /></button>
            <h2 style={{ fontSize: '1.5rem', margin: '0 0 1.5rem 0' }}>{topicDetails[activeModalTopic]?.title || 'Topic Specifications'}</h2>
            {topicDetails[activeModalTopic]?.content}
          </div>
        </div>
      )}

      {/* DRAWER 5: Auth Signin/Register Modal */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2rem', borderRadius: '12px', width: '400px', position: 'relative' }}>
            <button onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}><X size={20} /></button>
            
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.4rem' }}>{inviteToken ? 'Accept Invitation Workspace' : (isRegister ? 'Register EAC Account' : 'Sign In To Portal')}</h3>
            
            <form onSubmit={inviteToken ? handleAcceptInviteSubmit : (isRegister ? handleRegister : handleLogin)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {isRegister && !inviteToken && (
                <>
                  <input type="text" required placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
                  <input type="text" required placeholder="Company Name" value={businessName} onChange={e => setBusinessName(e.target.value)} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
                  <input type="text" required placeholder="Business Type (e.g. LLC)" value={businessType} onChange={e => setBusinessType(e.target.value)} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
                </>
              )}

              {inviteToken && (
                <input type="text" required placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
              )}

              <input type="email" required placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
              <input type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />

              {error && <span style={{ color: 'red', fontSize: '0.8rem' }}>{error}</span>}

              <button type="submit" disabled={loading} style={{ padding: '0.6rem', background: '#B58A2B', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
                {loading ? 'Processing Workspace...' : (inviteToken ? 'Accept & Access' : (isRegister ? 'Register & Trial' : 'Sign In'))}
              </button>
            </form>

            {!inviteToken && (
              <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-sec)' }}>{isRegister ? 'Already registered?' : 'No active workspace?'}</span>{' '}
                <button onClick={() => setIsRegister(!isRegister)} style={{ background: 'none', border: 'none', color: '#B58A2B', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>{isRegister ? 'Log In' : 'Register Free Trial'}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
