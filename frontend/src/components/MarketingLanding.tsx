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
  const themeMode = context?.themeMode || 'light';
  const toggleTheme = context?.toggleTheme || (() => {});

  // Modals & Panels State
  const [showAuthModal, setShowAuthModal] = useState(inviteToken && inviteValidated);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
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
      let responseText = "That's a great question! Typically, our specialists handle this end-to-end within 48 hours. Let's schedule a free call to get this customized for your tenant.";
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

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
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
          <div style={{ padding: '1rem', background: '#F3F4F6', borderRadius: '8px', borderLeft: '4px solid #10B981', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Shield size={24} color="#10B981" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Continuous monitoring ensures 99.99% system uptime and secure operations.</span>
          </div>
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
          <p>Register an account to receive your client developer keys and register webhook endpoints for real-time status alerts.</p>
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
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>3</div>
            <div>
              <h4 style={{ fontWeight: 'bold', margin: 0 }}>Get Balanced Statements</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#4B5563' }}>On the 10th of every month, your balanced financial statements are delivered straight to your portal, completely audit-ready.</p>
            </div>
          </div>
        </div>
      )
    },
    'reviews': {
      title: "Customer Reviews & Case Studies",
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.25rem', color: '#F59E0B', marginBottom: '0.5rem' }}>
              <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
            </div>
            <h4 style={{ fontWeight: 'bold', margin: 0 }}>"Life saver for tax season!"</h4>
            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#4B5563' }}>We switched from standard QuickBooks and immediately saved $4,200 in deductions we were previously missing. Outstanding service.</p>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>- Marcus T., CEO of Helix Tech</span>
          </div>
          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.25rem', color: '#F59E0B', marginBottom: '0.5rem' }}>
              <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
            </div>
            <h4 style={{ fontWeight: 'bold', margin: 0 }}>"Exceptional personal advisor support"</h4>
            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#4B5563' }}>Having Jessica a single click away gives us massive confidence in our weekly ledger decisions. Highly recommend.</p>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>- Clara Jenkins, Proprietor</span>
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
      {/* Top Navbar */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: themeMode === 'light' ? 'rgba(255, 255, 255, 0.92)' : 'rgba(11, 15, 25, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${themeMode === 'light' ? '#F3F4F6' : 'rgba(52, 211, 153, 0.15)'}`,
        padding: '1.25rem 2rem',
        transition: 'background-color 0.3s, border-color 0.3s'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'var(--primary-color)',
              width: 36,
              height: 36,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={20} color="#fff" />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--primary-color)' }}>EAC Solutions</span>
          </div>

          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', fontWeight: 600 }}>
            <a href="#features" style={{ color: 'var(--text-sec)', textDecoration: 'none', transition: 'color 0.2s' }} className="hover-target">Features</a>
            <a href="#pricing" style={{ color: 'var(--text-sec)', textDecoration: 'none', transition: 'color 0.2s' }} className="hover-target">Pricing</a>
            <a href="#faqs" style={{ color: 'var(--text-sec)', textDecoration: 'none', transition: 'color 0.2s' }} className="hover-target">FAQs</a>
            <button 
              onClick={() => setActiveModalTopic('how-it-works')} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', color: 'var(--text-sec)', transition: 'color 0.2s' }}
              className="hover-target"
            >
              How It Works
            </button>
            <button 
              onClick={() => setActiveModalTopic('reviews')} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', color: 'var(--text-sec)', transition: 'color 0.2s' }}
              className="hover-target"
            >
              Reviews
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-color)',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
            >
              {themeMode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <button 
              onClick={() => handleOpenAuth(false)}
              style={{
                padding: '0.5rem 1.25rem',
                background: 'transparent',
                color: 'var(--text-sec)',
                border: '1px solid var(--card-border)',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              Log In
            </button>
            <button 
              onClick={() => handleOpenAuth(true)}
              style={{
                padding: '0.5rem 1.25rem',
                background: 'var(--accent-color)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'background-color 0.2s'
              }}
            >
              Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        background: themeMode === 'light' ? 'var(--primary-color)' : 'var(--bg-color)',
        color: '#FFFFFF',
        padding: '6rem 2rem 7rem 2rem',
        borderBottom: themeMode === 'dark' ? '1px solid var(--card-border)' : 'none',
        position: 'relative'
      }}>
        {/* Subtle grid pattern background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '850px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1.2rem',
              background: 'var(--color-success-bg)',
              border: '1px solid var(--color-success)',
              borderRadius: 99,
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--color-success)',
              marginBottom: '1.5rem'
            }}>
              <Sparkles size={14} /> Humanized Precision in Accounting
            </div>
            <h1 style={{
              fontSize: '3.75rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              margin: '0 0 1.5rem 0',
              fontFamily: 'Manrope, sans-serif'
            }}>
              Confidence in your numbers without doing the math.
            </h1>
            <p style={{
              fontSize: '1.25rem',
              color: themeMode === 'light' ? '#CBD5E1' : 'var(--text-muted)',
              lineHeight: 1.6,
              marginBottom: '2.5rem',
              maxWidth: '700px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              Get a dedicated bookkeeper in your corner who really knows your business, backed by software that keeps everything organized and visible. You get clarity when you need it and stay focused on running your business.
            </p>
            <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', alignItems: 'center' }}>
              <button 
                onClick={() => {
                  const element = document.getElementById('consultation-form');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  padding: '0.9rem 2.5rem',
                  background: 'var(--accent-color)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  boxShadow: '0 10px 20px rgba(181, 138, 43, 0.2)',
                  transition: 'transform 0.2s, background-color 0.2s'
                }}
              >
                Schedule Consultation
              </button>
              <button 
                onClick={() => handleOpenAuth(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textUnderlineOffset: '6px'
                }}
              >
                Start Free Trial
              </button>
            </div>
          </div>

          {/* Interactive Floating Chat Bubble Demo */}
          <div style={{ marginTop: '5rem', width: '100%', maxWidth: '1000px', position: 'relative' }}>
            <div style={{
              background: 'var(--card-bg)',
              borderRadius: 16,
              padding: '1.5rem',
              boxShadow: 'var(--shadow-card)',
              border: '1px solid var(--card-border)',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--color-success)' }} />
                  <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>Live Portal Demo Overview</span>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-sec)' }}>Status: Ready for Onboarding</span>
              </div>
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-color)', borderRadius: 12, border: '1px dashed var(--card-border)' }}>
                <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
                  <Award size={48} color="var(--accent-color)" style={{ margin: '0 auto 1rem auto' }} />
                  <h4 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Experience Managed Precision</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-sec)', marginBottom: '1.5rem' }}>See real dashboard mockups and check write-off calculators by clicking the interactives below.</p>
                  <button 
                    onClick={() => setSelectedFeature('reporting')}
                    style={{ background: 'var(--primary-color)', color: '#FFF', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Open Feature Previews
                  </button>
                </div>
              </div>
            </div>

            {/* Clickable float chat simulation */}
            <div 
              onClick={() => setIsChatOpen(true)}
              style={{
                position: 'absolute',
                top: '-2.5rem',
                right: '2rem',
                background: 'var(--card-bg)',
                padding: '1rem',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                maxWidth: '300px',
                cursor: 'pointer',
                textAlign: 'left',
                borderLeft: '4px solid var(--accent-color)',
                animation: 'bounce 2s infinite',
                color: 'var(--text-primary)'
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>JM</div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>DEDICATED STEWARD</p>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>"Hey! Jessica here. Your books are ready to reconcile. Tap to chat!"</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Trust */}
      <section style={{ padding: '6rem 2rem', background: themeMode === 'light' ? '#FFFFFF' : '#0B0F19', borderBottom: `1px solid ${themeMode === 'light' ? '#F3F4F6' : 'rgba(52, 211, 153, 0.15)'}` }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, textAlign: 'center', color: themeMode === 'light' ? '#062D60' : '#34D399', marginBottom: '4rem', fontFamily: 'Manrope, sans-serif' }}>
            Trusted by 35,000+ business owners across America
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
            <div style={{ border: `1px solid ${themeMode === 'light' ? '#E5E7EB' : 'rgba(52, 211, 153, 0.15)'}`, padding: '2.5rem', borderRadius: 12, background: themeMode === 'light' ? 'transparent' : '#111827' }}>
              <p style={{ fontStyle: 'italic', color: themeMode === 'light' ? '#4B5563' : '#9CA3AF', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                "EAC Solutions helps keep my business finances crystal clear. No more guessing, no more fumbling around in Excel sheets."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F3F4F6', color: '#111827', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>JM</div>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: themeMode === 'light' ? '#111827' : '#FFFFFF' }}>JUSTIN METROS</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Proprietor, Radiator</p>
                </div>
              </div>
            </div>

            <div style={{ border: `1px solid ${themeMode === 'light' ? '#E5E7EB' : 'rgba(52, 211, 153, 0.15)'}`, padding: '2.5rem', borderRadius: 12, background: themeMode === 'light' ? 'transparent' : '#111827' }}>
              <p style={{ fontStyle: 'italic', color: themeMode === 'light' ? '#4B5563' : '#9CA3AF', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                "Now that EAC Solutions has a tax solution service, they're a 'one stop shop' for small businesses to manage their books and taxes."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F3F4F6', color: '#111827', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>AL</div>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: themeMode === 'light' ? '#111827' : '#FFFFFF' }}>ALBERT LAMONT</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>CEO, Sweatcast</p>
                </div>
              </div>
            </div>

            <div style={{ border: `1px solid ${themeMode === 'light' ? '#E5E7EB' : 'rgba(52, 211, 153, 0.15)'}`, padding: '2.5rem', borderRadius: 12, background: themeMode === 'light' ? 'transparent' : '#111827' }}>
              <p style={{ fontStyle: 'italic', color: themeMode === 'light' ? '#4B5563' : '#9CA3AF', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                "As a small business owner, I feel better knowing that professionals are handling my books so I can spend more time growing my business."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F3F4F6', color: '#111827', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>LS</div>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: themeMode === 'light' ? '#111827' : '#FFFFFF' }}>LAURA SIMMS</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Career Change Expert</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Sections */}
      <section id="features" style={{ padding: '6rem 2rem', background: themeMode === 'light' ? '#F9FAFB' : '#111827' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '7rem' }}>
          
          {/* Feature 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#E0F2FE', color: '#0369A1', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} />
              </div>
              <h3 style={{ fontSize: '2rem', fontWeight: 800, color: themeMode === 'light' ? '#062D60' : '#34D399', fontFamily: 'Manrope, sans-serif' }}>One-on-one expert support</h3>
              <p style={{ color: themeMode === 'light' ? '#4B5563' : '#9CA3AF', lineHeight: 1.6 }}>
                EAC Solutions gives you a dedicated team so you have a direct line to your own experts on desktop or mobile—professional support is just a few swipes, taps, or clicks away.
              </p>
              <button 
                onClick={() => setSelectedFeature('support')}
                style={{ alignSelf: 'flex-start', background: '#062D60', color: '#FFF', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                Launch Live Chat Simulator <ArrowRight size={16} />
              </button>
            </div>
            <div style={{ background: themeMode === 'light' ? '#FFFFFF' : '#0B0F19', border: `1px solid ${themeMode === 'light' ? '#E5E7EB' : 'rgba(52, 211, 153, 0.15)'}`, padding: '2rem', borderRadius: 16, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 'bold' }}>JM</div>
                <div>
                  <h5 style={{ margin: 0, fontWeight: 700, color: themeMode === 'light' ? '#111827' : '#FFFFFF' }}>Jessica Miller</h5>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B7280' }}>Stewardship Accountant</p>
                </div>
              </div>
              <p style={{ fontSize: '0.9rem', color: themeMode === 'light' ? '#4B5563' : '#9CA3AF', margin: 0 }}>
                "Hi! Reconciled your accounts for Q3. We saved you $1,400 in tax deductions from your office expenses!"
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
            <div style={{ order: 1 }}>
              <div style={{ background: themeMode === 'light' ? '#FFFFFF' : '#0B0F19', border: `1px solid ${themeMode === 'light' ? '#E5E7EB' : 'rgba(52, 211, 153, 0.15)'}`, padding: '2rem', borderRadius: 16, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <div style={{ height: 120, display: 'flex', flexDirection: 'column', justifyItems: 'space-between', gap: '1.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Quarterly VAT</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10B981' }}>100% Ready</span>
                    </div>
                    <div style={{ height: 8, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: '100%', height: '100%', background: '#10B981' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Income Reconciled</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F59E0B' }}>80% Review</span>
                    </div>
                    <div style={{ height: 8, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: '80%', height: '100%', background: '#F59E0B' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#D1FAE5', color: '#065F46', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={24} />
              </div>
              <h3 style={{ fontSize: '2rem', fontWeight: 800, color: themeMode === 'light' ? '#062D60' : '#34D399', fontFamily: 'Manrope, sans-serif' }}>Powerful financial reporting</h3>
              <p style={{ color: themeMode === 'light' ? '#4B5563' : '#9CA3AF', lineHeight: 1.6 }}>
                The EAC Solutions platform gives you monthly financial statements and expense overviews to keep you in control of your money. At-a-glance visual reports help you see the big picture and give you actionable insights to help grow your business.
              </p>
              <button 
                onClick={() => setSelectedFeature('reporting')}
                style={{ alignSelf: 'flex-start', background: '#062D60', color: '#FFF', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                View Sample Reports <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Feature 3 (Real-Time Insights) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#E0F2FE', color: '#0284C7', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={24} />
              </div>
              <h3 style={{ fontSize: '2rem', fontWeight: 800, color: themeMode === 'light' ? '#062D60' : '#34D399', fontFamily: 'Manrope, sans-serif' }}>Real-time insights at your fingertips</h3>
              <p style={{ color: themeMode === 'light' ? '#4B5563' : '#9CA3AF', lineHeight: 1.6 }}>
                Easily see your updated financial data every time you log in. With real-time insights, you can make on-the-fly decisions about where to spend and where to save, helping your business stay on budget.
              </p>
              <button 
                onClick={() => setSelectedFeature('insights')}
                style={{ alignSelf: 'flex-start', background: '#062D60', color: '#FFF', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                Try Transaction Categorizer <ArrowRight size={16} />
              </button>
            </div>
            <div style={{ background: themeMode === 'light' ? '#FFFFFF' : '#0B0F19', border: `1px solid ${themeMode === 'light' ? '#E5E7EB' : 'rgba(52, 211, 153, 0.15)'}`, padding: '2rem', borderRadius: 16, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: themeMode === 'light' ? '#062D60' : '#FFF' }}>Live Dashboard Feed</span>
                <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '0.2rem 0.6rem', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700 }}>Active Connection</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {demoTransactions.slice(0, 2).map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: themeMode === 'light' ? '#F9FAFB' : 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem' }}>{item.merchant}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B7280' }}>{item.date}</p>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#EF4444' }}>${item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature 4 (Tax Season stress free) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
            <div style={{ order: 1 }}>
              <div style={{ background: themeMode === 'light' ? '#FFFFFF' : '#0B0F19', border: `1px solid ${themeMode === 'light' ? '#E5E7EB' : 'rgba(52, 211, 153, 0.15)'}`, padding: '2rem', borderRadius: 16, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {checklistItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, 
                        border: `2px solid ${item.checked ? '#10B981' : '#D1D5DB'}`,
                        background: item.checked ? '#10B981' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF'
                      }}>
                        {item.checked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: '0.85rem', color: themeMode === 'light' ? '#4B5563' : '#9CA3AF', textDecoration: item.checked ? 'line-through' : 'none' }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#FEE2E2', color: '#991B1B', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={24} />
              </div>
              <h3 style={{ fontSize: '2rem', fontWeight: 800, color: themeMode === 'light' ? '#062D60' : '#34D399', fontFamily: 'Manrope, sans-serif' }}>Tax season, minus the stress</h3>
              <p style={{ color: themeMode === 'light' ? '#4B5563' : '#9CA3AF', lineHeight: 1.6 }}>
                A year-end package with everything you need to file comes standard with EAC Solutions. Upgrade your plan, and cross even more off your to-do list. With our Bookkeeping &amp; Tax plan, you get expert tax prep, filing, and year-round tax advisory support.
              </p>
              <button 
                onClick={() => setSelectedFeature('tax')}
                style={{ alignSelf: 'flex-start', background: '#062D60', color: '#FFF', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                Open Compliance Checklist <ArrowRight size={16} />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Logo Grid */}
      <section style={{ paddingTop: '5rem', paddingBottom: '5rem', background: themeMode === 'light' ? '#FFFFFF' : '#0B0F19', borderTop: `1px solid ${themeMode === 'light' ? '#E5E7EB' : 'rgba(52, 211, 153, 0.15)'}`, borderBottom: `1px solid ${themeMode === 'light' ? '#E5E7EB' : 'rgba(52, 211, 153, 0.15)'}`, padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: themeMode === 'light' ? '#4B5563' : '#9CA3AF', marginBottom: '3rem' }}>We partner with the world's best platforms</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '3rem', opacity: 0.6 }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>gusto</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Relay</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>bluevine</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>shopify</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Square</span>
          </div>
        </div>
      </section>

      {/* Blog/Resources Section */}
      <section style={{ padding: '6rem 2rem', background: themeMode === 'light' ? '#FFFFFF' : '#0B0F19' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
            <p style={{
              display: 'inline-block',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#10B981',
              border: `1px solid ${themeMode === 'light' ? '#D1D5DB' : 'rgba(52, 211, 153, 0.3)'}`,
              padding: '0.3rem 1rem',
              borderRadius: 99,
              marginBottom: '1rem'
            }}>From the EAC Solutions Blog</p>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: themeMode === 'light' ? '#062D60' : '#34D399', fontFamily: 'Manrope, sans-serif' }}>
              Explore our core financial resources
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {/* Post 1 */}
            <div 
              onClick={() => setSelectedArticle('tax-deductions')}
              style={{
                background: themeMode === 'light' ? '#F0F9FF' : '#1E2937',
                borderRadius: 16,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                border: `1px solid ${themeMode === 'light' ? 'transparent' : 'rgba(52, 211, 153, 0.15)'}`,
                boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                transition: 'transform 0.2s'
              }}
              className="card-hover-effect"
            >
              <div style={{ padding: '2rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284C7' }}>Tax Deductions</span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: themeMode === 'light' ? '#062D60' : '#FFF', marginTop: '0.5rem', marginBottom: '1rem' }}>
                  17 Big Tax Deductions (Write Offs) for Small Business
                </h4>
                <p style={{ fontSize: '0.9rem', color: themeMode === 'light' ? '#4B5563' : '#9CA3AF', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                  You've heard of "spend money to make money," but what about "spend money to save money"? Learn how to legally deduct key home office or software charges.
                </p>
                <span style={{ fontWeight: 700, color: '#0284C7', fontSize: '0.85rem' }}>Read Article →</span>
              </div>
            </div>

            {/* Post 2 */}
            <div 
              onClick={() => setSelectedArticle('quickbooks-alternatives')}
              style={{
                background: themeMode === 'light' ? '#FFFBEB' : '#1E2937',
                borderRadius: 16,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                border: `1px solid ${themeMode === 'light' ? 'transparent' : 'rgba(52, 211, 153, 0.15)'}`,
                boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                transition: 'transform 0.2s'
              }}
              className="card-hover-effect"
            >
              <div style={{ padding: '2rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706' }}>Product Guides</span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: themeMode === 'light' ? '#062D60' : '#FFF', marginTop: '0.5rem', marginBottom: '1rem' }}>
                  11 Alternatives to QuickBooks in 2026
                </h4>
                <p style={{ fontSize: '0.9rem', color: themeMode === 'light' ? '#4B5563' : '#9CA3AF', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                  Looking for a bookkeeping system that is fully hands-off? Discover why automation combined with real-world steward accounts beats manual software typing.
                </p>
                <span style={{ fontWeight: 700, color: '#D97706', fontSize: '0.85rem' }}>Read Article →</span>
              </div>
            </div>

            {/* Post 3 */}
            <div 
              onClick={() => setSelectedArticle('financial-statements')}
              style={{
                background: themeMode === 'light' ? '#ECFDF5' : '#1E2937',
                borderRadius: 16,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                border: `1px solid ${themeMode === 'light' ? 'transparent' : 'rgba(52, 211, 153, 0.15)'}`,
                boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                transition: 'transform 0.2s'
              }}
              className="card-hover-effect"
            >
              <div style={{ padding: '2rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>Education</span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: themeMode === 'light' ? '#062D60' : '#FFF', marginTop: '0.5rem', marginBottom: '1rem' }}>
                  How to Read (and Analyze) Financial Statements
                </h4>
                <p style={{ fontSize: '0.9rem', color: themeMode === 'light' ? '#4B5563' : '#9CA3AF', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                  Knowing how to balance your Profit and Loss statement lets you make scaling adjustments on the fly. Let's break down cash flow sheets.
                </p>
                <span style={{ fontWeight: 700, color: '#059669', fontSize: '0.85rem' }}>Read Article →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '6rem 2rem', background: themeMode === 'light' ? '#FFFFFF' : '#0B0F19', borderTop: `1px solid ${themeMode === 'light' ? '#F3F4F6' : 'rgba(52, 211, 153, 0.15)'}` }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: themeMode === 'light' ? '#062D60' : '#34D399', fontFamily: 'Manrope, sans-serif' }}>Simple, transparent pricing</h2>
            <p style={{ color: themeMode === 'light' ? '#4B5563' : '#9CA3AF', marginTop: '0.5rem' }}>Choose a plan that scales with your business.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', justifyItems: 'center' }}>
            
            {/* Plan 1 */}
            <div style={{ 
              border: `1px solid ${themeMode === 'light' ? '#E5E7EB' : 'rgba(52, 211, 153, 0.15)'}`, 
              borderRadius: 16, 
              padding: '3rem 2rem', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              background: themeMode === 'light' ? '#FFFFFF' : '#111827',
              maxWidth: '400px',
              width: '100%'
            }}>
              <div>
                <h4 style={{ fontWeight: 800, fontSize: '1.25rem', color: themeMode === 'light' ? '#062D60' : '#34D399', margin: '0 0 1rem 0' }}>Stewardship Bookkeeping</h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', margin: '1rem 0' }}>
                  <span style={{ fontSize: '2.75rem', fontWeight: 800, color: themeMode === 'light' ? '#111827' : '#FFFFFF' }}>$149</span>
                  <span style={{ color: '#6B7280' }}>/mo</span>
                </div>
                <p style={{ color: themeMode === 'light' ? '#4B5563' : '#9CA3AF', fontSize: '0.9rem', marginBottom: '2rem' }}>Ideal for startups needing clean financial statements.</p>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: themeMode === 'light' ? '#4B5563' : '#9CA3AF' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#10B981" /> Reconciled statements</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#10B981" /> Dedicated specialist</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#10B981" /> 24/7 client portal access</li>
                </ul>
              </div>
              <button onClick={() => handleOpenAuth(true)} style={{ width: '100%', padding: '0.85rem', background: '#062D60', color: '#fff', border: 'none', borderRadius: 8, marginTop: '2rem', fontWeight: 700, cursor: 'pointer' }}>
                Get Started
              </button>
            </div>

            {/* Plan 2 */}
            <div style={{ 
              border: `2px solid #10B981`, 
              borderRadius: 16, 
              padding: '3rem 2rem', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between', 
              position: 'relative', 
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.05)',
              background: themeMode === 'light' ? '#FFFFFF' : '#111827',
              maxWidth: '400px',
              width: '100%'
            }}>
              <div style={{ position: 'absolute', top: -14, right: 24, background: '#10B981', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 1rem', borderRadius: 99 }}>POPULAR</div>
              <div>
                <h4 style={{ fontWeight: 800, fontSize: '1.25rem', color: themeMode === 'light' ? '#062D60' : '#34D399', margin: '0 0 1rem 0' }}>Bookkeeping &amp; Tax</h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', margin: '1rem 0' }}>
                  <span style={{ fontSize: '2.75rem', fontWeight: 800, color: themeMode === 'light' ? '#111827' : '#FFFFFF' }}>$299</span>
                  <span style={{ color: '#6B7280' }}>/mo</span>
                </div>
                <p style={{ color: themeMode === 'light' ? '#4B5563' : '#9CA3AF', fontSize: '0.9rem', marginBottom: '2rem' }}>Comprehensive support including tax planning &amp; filing.</p>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: themeMode === 'light' ? '#4B5563' : '#9CA3AF' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#10B981" /> Everything in Bookkeeping</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#10B981" /> Year-end tax preparation</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#10B981" /> Corporate &amp; Individual returns</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="#10B981" /> Regional compliance registry</li>
                </ul>
              </div>
              <button onClick={() => handleOpenAuth(true)} style={{ width: '100%', padding: '0.85rem', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, marginTop: '2rem', fontWeight: 700, cursor: 'pointer' }}>
                Get Started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" style={{ padding: '6rem 2rem', background: themeMode === 'light' ? '#F9FAFB' : '#111827', borderTop: `1px solid ${themeMode === 'light' ? '#E5E7EB' : 'rgba(52, 211, 153, 0.15)'}` }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: themeMode === 'light' ? '#062D60' : '#34D399', textAlign: 'center', marginBottom: '4rem', fontFamily: 'Manrope, sans-serif' }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              {
                q: "Does EAC Solutions do all my bookkeeping tasks for me?",
                a: "Yes! You get a dedicated team of bookkeeping professionals who reconcile your accounts, categorize your transactions, and prepare your financial statements every month."
              },
              {
                q: "What happens if I take a long time to respond to my team's requests?",
                a: "No worries. We'll proceed with categorizing standard transactions and mark any ambiguous items for your review so you can check them whenever you have a free moment."
              },
              {
                q: "Is it mandatory to connect my business accounts?",
                a: "Connecting accounts securely allows us to automate feed transfers and compile statements faster. However, you can also upload files or CSV statements manually if preferred."
              },
              {
                q: "Why do you need document uploads if my accounts are connected?",
                a: "Some transactions require actual receipts or invoices to verify tax deduction eligibility and satisfy IRS/HMRC compliance requirements."
              }
            ].map((faq, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: themeMode === 'light' ? '#FFFFFF' : '#0B0F19', 
                  border: `1px solid ${themeMode === 'light' ? '#E5E7EB' : 'rgba(52, 211, 153, 0.15)'}`, 
                  borderRadius: 12, 
                  padding: '1.5rem', 
                  cursor: 'pointer' 
                }} 
                onClick={() => toggleFaq(idx)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: themeMode === 'light' ? '#062D60' : '#FFF' }}>{faq.q}</span>
                  {expandedFaq === idx ? <ChevronUp size={20} color="#10B981" /> : <ChevronDown size={20} color="#6B7280" />}
                </div>
                {expandedFaq === idx && (
                  <p style={{ marginTop: '1rem', color: themeMode === 'light' ? '#4B5563' : '#9CA3AF', lineHeight: 1.6, fontSize: '0.95rem', borderTop: `1px solid ${themeMode === 'light' ? '#F3F4F6' : 'rgba(255,255,255,0.05)'}`, paddingTop: '1rem', margin: '1rem 0 0 0' }}>
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Generation consultation booking form */}
      <section id="consultation-form" style={{ padding: '6rem 2rem', background: themeMode === 'light' ? '#FFFFFF' : '#0B0F19' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: themeMode === 'light' ? '#062D60' : '#34D399', marginBottom: '1.5rem', fontFamily: 'Manrope, sans-serif' }}>
              Join thousands of founders who trust us with their books
            </h2>
            <p style={{ color: themeMode === 'light' ? '#4B5563' : '#9CA3AF', lineHeight: 1.6, marginBottom: '2rem' }}>
              Book a free consultation call. We will examine your current bookkeeping structure, identify missing tax deductions, and show you exactly how EAC Solutions keeps you compliant.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Check size={20} color="#10B981" />
                <span>Dedicated professional team assigned</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Check size={20} color="#10B981" />
                <span>Seamless integration with banking &amp; payment platforms</span>
              </div>
            </div>
          </div>

          <div style={{ background: themeMode === 'light' ? '#F9FAFB' : '#111827', border: `1px solid ${themeMode === 'light' ? '#E5E7EB' : 'rgba(52, 211, 153, 0.15)'}`, padding: '2.5rem', borderRadius: 16 }}>
            {formSubmitted ? (
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0' }}>
                <div style={{ background: '#D1FAE5', color: '#10B981', width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={28} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: themeMode === 'light' ? '#062D60' : '#34D399', margin: 0 }}>Assessment Requested!</h3>
                <p style={{ fontSize: '0.9rem', color: themeMode === 'light' ? '#4B5563' : '#9CA3AF', lineHeight: 1.5, margin: 0 }}>
                  We've received your request for <strong>{formData.companyName || 'your business'}</strong> and sent details to <strong>{formData.email}</strong>.
                </p>
                <button 
                  onClick={() => { setFormSubmitted(false); setFormData({ firstName: '', lastName: '', companyName: '', email: '', phone: '', revenue: 'Average Monthly Revenue*' }); }}
                  style={{
                    marginTop: '1rem',
                    padding: '0.6rem 1.5rem',
                    background: '#062D60',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Book Another Call
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: themeMode === 'light' ? '#062D60' : '#FFF', marginBottom: '1.5rem', textAlign: 'center' }}>Request Free Financial Assessment</h3>
                <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <input 
                      type="text" 
                      placeholder="First Name" 
                      required 
                      value={formData.firstName}
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: 8, background: themeMode === 'light' ? '#FFF' : '#0B0F19', color: 'inherit' }} 
                    />
                    <input 
                      type="text" 
                      placeholder="Last Name" 
                      required 
                      value={formData.lastName}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: 8, background: themeMode === 'light' ? '#FFF' : '#0B0F19', color: 'inherit' }} 
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Company Name" 
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: 8, background: themeMode === 'light' ? '#FFF' : '#0B0F19', color: 'inherit' }} 
                  />
                  <input 
                    type="email" 
                    placeholder="Business Email" 
                    required 
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: 8, background: themeMode === 'light' ? '#FFF' : '#0B0F19', color: 'inherit' }} 
                  />
                  <input 
                    type="tel" 
                    placeholder="Phone Number" 
                    required 
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: 8, background: themeMode === 'light' ? '#FFF' : '#0B0F19', color: 'inherit' }} 
                  />
                  <select 
                    value={formData.revenue}
                    onChange={e => setFormData({ ...formData, revenue: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: 8, background: themeMode === 'light' ? '#FFF' : '#0B0F19', color: 'inherit' }}
                  >
                    <option disabled>Average Monthly Revenue*</option>
                    <option>$0 - $1,000</option>
                    <option>$1,000 - $10,000</option>
                    <option>$10,000+</option>
                  </select>
                  <button 
                    type="submit" 
                    disabled={formLoading}
                    style={{ 
                      padding: '0.85rem', 
                      background: '#10B981', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 8, 
                      fontWeight: 700, 
                      cursor: 'pointer',
                      opacity: formLoading ? 0.8 : 1
                    }}
                  >
                    {formLoading ? 'Scheduling...' : 'Submit & Schedule'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main Footer Directory */}
      <footer style={{
        background: themeMode === 'light' ? '#062D60' : '#0B0F19',
        color: '#FFFFFF',
        padding: '6rem 2rem 4rem 2rem',
        borderTop: `1px solid ${themeMode === 'light' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(52, 211, 153, 0.15)'}`
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4rem', marginBottom: '4rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  background: '#FFFFFF',
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Shield size={16} color="#062D60" />
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.025em' }}>EAC Solutions</span>
              </div>
              <p style={{ color: '#93C5FD', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Online bookkeeping and compliance management powered by real stewardship.
              </p>
            </div>

            <div>
              <h5 style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', color: '#34D399', marginBottom: '1.25rem' }}>COMPANY</h5>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: '#93C5FD' }}>
                <li><button onClick={() => setActiveModalTopic('reviews')} style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', textAlign: 'left' }}>About Us</button></li>
                <li><button onClick={() => setActiveModalTopic('reviews')} style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', textAlign: 'left' }}>Press & Careers</button></li>
                <li><button onClick={() => setActiveModalTopic('security')} style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', textAlign: 'left' }}>Privacy Policy</button></li>
                <li><button onClick={() => setActiveModalTopic('security')} style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', textAlign: 'left' }}>Terms &amp; Conditions</button></li>
              </ul>
            </div>

            <div>
              <h5 style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', color: '#34D399', marginBottom: '1.25rem' }}>PRODUCT</h5>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: '#93C5FD' }}>
                <li><button onClick={() => setActiveModalTopic('how-it-works')} style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', textAlign: 'left' }}>How it Works</button></li>
                <li><button onClick={() => setActiveModalTopic('security')} style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', textAlign: 'left' }}>Security Infrastructure</button></li>
                <li><button onClick={() => setActiveModalTopic('api-keys')} style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', textAlign: 'left' }}>API Keys &amp; Webhooks</button></li>
                <li><button onClick={() => setActiveModalTopic('reviews')} style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', textAlign: 'left' }}>Customer Reviews</button></li>
              </ul>
            </div>

            <div>
              <h5 style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', color: '#34D399', marginBottom: '1.25rem' }}>RESOURCES</h5>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: '#93C5FD' }}>
                <li><button onClick={() => setSelectedArticle('tax-deductions')} style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', textAlign: 'left' }}>Tax Deductions Guide</button></li>
                <li><button onClick={() => setSelectedArticle('financial-statements')} style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', textAlign: 'left' }}>General Ledger Guide</button></li>
                <li><button onClick={() => { setToast({ id: Math.random().toString(), type: 'info', title: 'System Status', message: 'All EAC Solutions ledger integrations and databases are fully operational.' }); }} style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', textAlign: 'left' }}>System Status</button></li>
                <li><button onClick={() => setIsChatOpen(true)} style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', textAlign: 'left' }}>Contact Helpdesk</button></li>
              </ul>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.8rem',
            color: '#93C5FD'
          }}>
            <span>© 2026 EAC Solutions Inc. All rights reserved.</span>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => setToast({ id: 'tw', type: 'info', title: 'Twitter Feed', message: 'Follow us @EACSolutions for ledger compliance alerts!' })}>Twitter</span>
              <span style={{ cursor: 'pointer' }} onClick={() => setToast({ id: 'li', type: 'info', title: 'LinkedIn Profile', message: 'EAC Solutions corporate announcements are streamed on LinkedIn.' })}>LinkedIn</span>
              <span style={{ cursor: 'pointer' }} onClick={() => setToast({ id: 'gh', type: 'info', title: 'GitHub Repo', message: 'Open-source SDKs are located at github.com/eac-solutions.' })}>GitHub</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '450px',
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '2.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            color: '#111827'
          }}>
            {/* Close Button */}
            {(!inviteToken || !inviteValidated) && (
              <button 
                onClick={() => setShowAuthModal(false)}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            )}

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: '#062D60',
                marginBottom: '1rem'
              }}>
                <Shield size={32} color="#fff" />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 0.5rem 0', color: '#062D60', fontFamily: 'Manrope, sans-serif' }}>
                {inviteToken && inviteValidated ? 'Complete Setup' : isRegister ? 'Create Account' : 'Sign In'}
              </h2>
              <p style={{ color: '#4B5563', fontSize: '0.875rem', margin: 0 }}>
                {inviteToken && inviteValidated ? 'Join your enterprise workspace' : 'EAC Solutions Enterprise Console'}
              </p>
            </div>

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: '#EF4444',
                fontSize: '0.875rem',
                marginBottom: '1.5rem'
              }}>
                {error}
              </div>
            )}

            {inviteToken && inviteValidated ? (
              <form onSubmit={handleAcceptInviteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '0.5rem', background: 'rgba(16,185,129,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #10B981' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#10B981', fontWeight: 700 }}>
                    Invited as: <strong>{inviteData?.role}</strong>
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '8px', color: '#111827', outline: 'none' }}
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    style={{ width: '100%', padding: '0.75rem 1rem', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '8px', color: '#6B7280', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Create Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '8px', color: '#111827', outline: 'none' }}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#10B981',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '0.5rem',
                    transition: 'opacity 0.2s'
                  }}
                >
                  {loading ? 'Setting up profile...' : 'Accept Invite & Join Workspace'}
                </button>
              </form>
            ) : (
              <>
                <form onSubmit={isRegister ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {isRegister && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Full Name</label>
                        <div style={{ position: 'relative' }}>
                          <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '8px', color: '#111827', outline: 'none' }}
                            placeholder="John Doe"
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Business Name</label>
                        <input
                          type="text"
                          required
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          style={{ width: '100%', padding: '0.75rem 1rem', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '8px', color: '#111827', outline: 'none' }}
                          placeholder="Acme Corp"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Business Type</label>
                        <input
                          type="text"
                          required
                          value={businessType}
                          onChange={(e) => setBusinessType(e.target.value)}
                          style={{ width: '100%', padding: '0.75rem 1rem', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '8px', color: '#111827', outline: 'none' }}
                          placeholder="SaaS / Logistics / Retail"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '8px', color: '#111827', outline: 'none' }}
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '8px', color: '#111827', outline: 'none' }}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '0.75rem 1rem',
                      background: '#10B981',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginTop: '0.5rem',
                      transition: 'opacity 0.2s'
                    }}
                  >
                    {loading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In'}
                  </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
                  <button
                    onClick={() => setIsRegister(!isRegister)}
                    style={{ background: 'none', border: 'none', color: '#062d60', cursor: 'pointer', fontWeight: 700 }}
                  >
                    {isRegister ? 'Already have an account? Sign In' : 'New enterprise tenant? Register here'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Slide-out Drawer for Blog Articles */}
      {selectedArticle && blogArticles[selectedArticle] && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '600px',
          height: '100%',
          background: themeMode === 'light' ? '#FFFFFF' : '#111827',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
          zIndex: 1000,
          padding: '2.5rem',
          overflowY: 'auto',
          color: themeMode === 'light' ? '#111827' : '#F9FAFB',
          borderLeft: `1px solid ${themeMode === 'light' ? '#E5E7EB' : 'rgba(52, 211, 153, 0.15)'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#10B981' }}>{blogArticles[selectedArticle].category}</span>
            <button 
              onClick={() => setSelectedArticle(null)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem', color: themeMode === 'light' ? '#062D60' : '#FFF' }}>
            {blogArticles[selectedArticle].title}
          </h2>
          <span style={{ display: 'block', fontSize: '0.85rem', color: '#6B7280', marginBottom: '2rem' }}>{blogArticles[selectedArticle].readTime}</span>
          {blogArticles[selectedArticle].body}
          <div style={{ marginTop: '3rem', borderTop: '1px solid #E5E7EB', paddingTop: '2rem' }}>
            <h4 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Want this automated for your business?</h4>
            <p style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '1.5rem' }}>Start a free trial today to receive actual reconciled monthly ledgers.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => { setSelectedArticle(null); handleOpenAuth(true); }} style={{ padding: '0.6rem 1.2rem', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                Start Free Trial
              </button>
              <button onClick={() => setSelectedArticle(null)} style={{ padding: '0.6rem 1.2rem', background: 'transparent', color: 'inherit', border: '1px solid #D1D5DB', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Feature Previews Drawer */}
      {selectedFeature && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '650px',
          height: '100%',
          background: themeMode === 'light' ? '#FFFFFF' : '#111827',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
          zIndex: 1000,
          padding: '2.5rem',
          overflowY: 'auto',
          color: themeMode === 'light' ? '#111827' : '#F9FAFB',
          borderLeft: `1px solid ${themeMode === 'light' ? '#E5E7EB' : 'rgba(52, 211, 153, 0.15)'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#10B981' }}>EAC Solutions Features Sandbox</span>
            <button 
              onClick={() => setSelectedFeature(null)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
          </div>

          {selectedFeature === 'support' && (
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: themeMode === 'light' ? '#062D60' : '#FFF' }}>Dedicated Stewardship Support</h2>
              <p style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '2rem' }}>Interactive chat simulator. Test asking Jessica bookkeeping questions.</p>
              
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', height: '350px', display: 'flex', flexDirection: 'column', background: themeMode === 'light' ? '#FFF' : '#0B0F19' }}>
                <div style={{ padding: '1rem', background: '#062D60', color: '#FFF', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
                  <span style={{ fontWeight: 700 }}>Jessica Miller, CPA</span>
                </div>
                <div style={{ flexGrow: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {chatMessages.map((msg, i) => (
                    <div key={i} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                      <div style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 12,
                        background: msg.sender === 'user' ? '#10B981' : (themeMode === 'light' ? '#F3F4F6' : '#1F2937'),
                        color: msg.sender === 'user' ? '#FFF' : 'inherit',
                        fontSize: '0.875rem'
                      }}>
                        {msg.text}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block', textAlign: msg.sender === 'user' ? 'right' : 'left', marginTop: '0.2rem' }}>{msg.time}</span>
                    </div>
                  ))}
                  {isJessTyping && (
                    <span style={{ fontSize: '0.8rem', color: '#6B7280', fontStyle: 'italic' }}>Jessica is typing...</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                <button 
                  onClick={() => handleSendMessage(undefined, "How do I claim home office write-offs?")}
                  style={{ background: 'transparent', border: '1px solid #D1D5DB', padding: '0.4rem 0.8rem', borderRadius: 20, fontSize: '0.8rem', cursor: 'pointer', color: 'inherit' }}
                >
                  "How do I claim home office write-offs?"
                </button>
                <button 
                  onClick={() => handleSendMessage(undefined, "What are your package prices?")}
                  style={{ background: 'transparent', border: '1px solid #D1D5DB', padding: '0.4rem 0.8rem', borderRadius: 20, fontSize: '0.8rem', cursor: 'pointer', color: 'inherit' }}
                >
                  "What are your package prices?"
                </button>
              </div>
            </div>
          )}

          {selectedFeature === 'reporting' && (
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: themeMode === 'light' ? '#062D60' : '#FFF' }}>Interactive Profit &amp; Loss</h2>
              <p style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '2rem' }}>Toggle monthly segments to test portal calculation filters.</p>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {(['Q1', 'Q2', 'Q3'] as const).map(period => (
                  <button 
                    key={period}
                    onClick={() => setSelectedPnLPeriod(period)}
                    style={{
                      padding: '0.5rem 1.25rem',
                      background: selectedPnLPeriod === period ? '#10B981' : 'transparent',
                      color: selectedPnLPeriod === period ? '#FFF' : 'inherit',
                      border: '1px solid #D1D5DB',
                      borderRadius: 8,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {period} Statements
                  </button>
                ))}
              </div>

              <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: '1.5rem', background: themeMode === 'light' ? '#FFF' : '#0B0F19' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #F3F4F6', paddingBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700 }}>Line Item</span>
                  <span style={{ fontWeight: 700 }}>Amount ({selectedPnLPeriod})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Gross Sales Revenue</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>{selectedPnLPeriod === 'Q3' ? '$28,450.00' : selectedPnLPeriod === 'Q2' ? '$21,900.00' : '$18,300.00'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Cost of Goods Sold (COGS)</span>
                    <span style={{ color: '#EF4444' }}>{selectedPnLPeriod === 'Q3' ? '-$4,120.00' : selectedPnLPeriod === 'Q2' ? '-$3,200.00' : '-$2,800.00'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #F3F4F6', paddingTop: '0.5rem' }}>
                    <span>Gross Profit Margin</span>
                    <span>{selectedPnLPeriod === 'Q3' ? '$24,330.00' : selectedPnLPeriod === 'Q2' ? '$18,700.00' : '$15,500.00'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedFeature === 'insights' && (
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: themeMode === 'light' ? '#062D60' : '#FFF' }}>Real-time Feed Reconciliation</h2>
              <p style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '2rem' }}>Reconcile pending items to test live state management.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {demoTransactions.map(tx => (
                  <div key={tx.id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: '1.25rem', background: themeMode === 'light' ? '#FFF' : '#0B0F19' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700 }}>{tx.merchant}</span>
                      <span style={{ fontWeight: 700 }}>${tx.amount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Category Suggestion: <strong>{tx.category}</strong></span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {tx.status === 'Pending Review' ? (
                          <>
                            <button 
                              onClick={() => {
                                setDemoTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, status: 'Reconciled' } : t));
                                setToast({ id: tx.id.toString(), type: 'success', title: 'Transaction Reconciled', message: `Mapped ${tx.merchant} to ${tx.category} successfully.` });
                              }}
                              style={{ background: '#10B981', color: '#FFF', border: 'none', padding: '0.3rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => {
                                setDemoTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, status: 'Personal' } : t));
                                setToast({ id: tx.id.toString(), type: 'info', title: 'Marked Personal', message: 'Excluded from business deductions.' });
                              }}
                              style={{ background: 'transparent', border: '1px solid #D1D5DB', padding: '0.3rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', color: 'inherit' }}
                            >
                              Personal
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: tx.status === 'Reconciled' ? '#10B981' : '#6B7280' }}>
                            {tx.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedFeature === 'tax' && (
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: themeMode === 'light' ? '#062D60' : '#FFF' }}>Compliance Checklist Sandbox</h2>
              <p style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '2rem' }}>Check items to see the progress indicators change.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: themeMode === 'light' ? '#FFF' : '#0B0F19', padding: '1.5rem', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 700 }}>Task Completion</span>
                  <span style={{ fontWeight: 700, color: '#10B981' }}>
                    {Math.round((checklistItems.filter(i => i.checked).length / checklistItems.length) * 100)}% Complete
                  </span>
                </div>
                <div style={{ height: 8, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden', marginBottom: '1.5rem' }}>
                  <div style={{ 
                    height: '100%', 
                    background: '#10B981', 
                    width: `${(checklistItems.filter(i => i.checked).length / checklistItems.length) * 100}%`,
                    transition: 'width 0.3s'
                  }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {checklistItems.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => setChecklistItems(prev => prev.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i))}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: 6, 
                        border: `2px solid ${item.checked ? '#10B981' : '#D1D5DB'}`,
                        background: item.checked ? '#10B981' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF'
                      }}>
                        {item.checked && <Check size={14} strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: '0.9rem', color: item.checked ? '#6B7280' : 'inherit', textDecoration: item.checked ? 'line-through' : 'none' }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button 
            onClick={() => setSelectedFeature(null)}
            style={{ width: '100%', padding: '0.85rem', background: '#062D60', color: '#FFF', border: 'none', borderRadius: 8, marginTop: '2.5rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Close Feature Sandbox
          </button>
        </div>
      )}

      {/* Floating Topic Modals (Navbar / Footer link details) */}
      {activeModalTopic && topicDetails[activeModalTopic] && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(2, 6, 23, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '600px',
            background: themeMode === 'light' ? '#FFFFFF' : '#111827',
            border: `1px solid ${themeMode === 'light' ? '#E5E7EB' : 'rgba(52, 211, 153, 0.15)'}`,
            borderRadius: '16px',
            padding: '2.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative',
            color: themeMode === 'light' ? '#111827' : '#F9FAFB'
          }}>
            <button 
              onClick={() => setActiveModalTopic(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: themeMode === 'light' ? '#062D60' : '#34D399' }}>
              {topicDetails[activeModalTopic].title}
            </h3>
            
            {topicDetails[activeModalTopic].content}

            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => { setActiveModalTopic(null); handleOpenAuth(true); }}
                style={{ padding: '0.6rem 1.5rem', background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
              >
                Try Free Trial
              </button>
              <button 
                onClick={() => setActiveModalTopic(null)}
                style={{ padding: '0.6rem 1.5rem', background: 'transparent', color: 'inherit', border: '1px solid #D1D5DB', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Assistant Widget (Bottom Right) */}
      {isChatOpen ? (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '380px',
          height: '500px',
          background: themeMode === 'light' ? '#FFFFFF' : '#111827',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          borderRadius: '16px',
          border: `1px solid ${themeMode === 'light' ? '#E5E7EB' : 'rgba(52, 211, 153, 0.25)'}`,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 99999,
          overflow: 'hidden',
          color: themeMode === 'light' ? '#111827' : '#F9FAFB'
        }}>
          {/* Chat Header */}
          <div style={{ padding: '1rem 1.25rem', background: '#062D60', color: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
              <div>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', display: 'block' }}>Jessica Miller</span>
                <span style={{ fontSize: '0.7rem', color: '#93C5FD', display: 'block' }}>Client Onboarding Steward</span>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Chat Messages */}
          <div style={{ flexGrow: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: themeMode === 'light' ? '#F9FAFB' : '#0B0F19' }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: msg.sender === 'user' ? '#10B981' : (themeMode === 'light' ? '#FFFFFF' : '#1F2937'),
                  color: msg.sender === 'user' ? '#FFF' : 'inherit',
                  fontSize: '0.875rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  {msg.text}
                </div>
                <span style={{ fontSize: '0.65rem', color: '#6B7280', display: 'block', textAlign: msg.sender === 'user' ? 'right' : 'left', marginTop: '0.2rem' }}>{msg.time}</span>
              </div>
            ))}
            {isJessTyping && (
              <div style={{ alignSelf: 'flex-start', background: themeMode === 'light' ? '#FFFFFF' : '#1F2937', padding: '0.5rem 1rem', borderRadius: 12, fontSize: '0.8rem', fontStyle: 'italic', color: '#6B7280' }}>
                Jessica is typing...
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendMessage} style={{ padding: '0.75rem 1rem', borderTop: `1px solid ${themeMode === 'light' ? '#F3F4F6' : 'rgba(255,255,255,0.05)'}`, display: 'flex', gap: '0.5rem', background: themeMode === 'light' ? '#FFF' : '#111827' }}>
            <input 
              type="text" 
              placeholder="Ask Jessica about taxes, pricing..." 
              value={userMsgInput}
              onChange={e => setUserMsgInput(e.target.value)}
              style={{ flexGrow: 1, border: `1px solid ${themeMode === 'light' ? '#D1D5DB' : 'rgba(52, 211, 153, 0.2)'}`, borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.85rem', background: themeMode === 'light' ? '#FFF' : '#0B0F19', color: 'inherit', outline: 'none' }}
            />
            <button type="submit" style={{ background: '#10B981', border: 'none', color: '#FFF', width: '36px', height: '36px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setIsChatOpen(true)}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: '#10B981',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
            cursor: 'pointer',
            zIndex: 9999
          }}
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Toast Notification Container */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '2rem', left: '2rem', zIndex: 99999 }}>
          <Toast 
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
}
