import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client.ts';
import { 
  FileText, PlusCircle, Trash2, Receipt, DollarSign, 
  Percent, Clock, Sparkles, X, Plus, Calendar, AlertCircle
} from 'lucide-react';
import DataTable from '../components/ui/DataTable.tsx';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPriceCents: number;
  productId?: string;
  taxRateId?: string;
}

interface Invoice {
  id: string;
  amount_cents: number;
  currency: string;
  status: 'paid' | 'unpaid' | 'voided' | 'refunded';
  due_date: string;
  notes?: string;
  created_at: string;
  items?: any[];
}

interface Product {
  id: string;
  name: string;
  price_cents: number;
  sku?: string;
}

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  expires_at?: string;
}

interface TaxRate {
  id: string;
  name: string;
  rate_percent: number;
}

export default function BillingManagement() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'products' | 'coupons' | 'reports'>('invoices');
  const [tenants, setTenants] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [agingReport, setAgingReport] = useState<any>({ current: 0, d30: 0, d60: 0, d90: 0 });
  const [revenueReport, setRevenueReport] = useState<any>({ totalRevenueCents: 0, invoiceCount: 0, paidCount: 0 });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected invoice/details state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Modals state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);

  // Form states
  const [newInvoice, setNewInvoice] = useState({
    tenantId: '',
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    currency: 'USD',
    description: ''
  });
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { description: 'Consulting Services', quantity: 1, unitPriceCents: 15000 }
  ]);

  const [productForm, setProductForm] = useState({
    name: '',
    price_cents: 0,
    sku: ''
  });

  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_percent: 10,
    expires_at: ''
  });

  const fetchTenants = async () => {
    try {
      const res = await apiClient.get('/tenants');
      setTenants(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await apiClient.get('/billing/invoices');
      setInvoices(res.data || []);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to load invoices.');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await apiClient.get('/billing/products');
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await apiClient.get('/billing/coupons');
      setCoupons(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTaxRates = async () => {
    try {
      const res = await apiClient.get('/billing/tax-rates');
      setTaxRates(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async () => {
    try {
      const agingRes = await apiClient.get('/billing/reports/aging');
      setAgingReport(agingRes.data);
      const revRes = await apiClient.get('/billing/reports/revenue');
      setRevenueReport(revRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchTenants(),
      fetchInvoices(),
      fetchProducts(),
      fetchCoupons(),
      fetchTaxRates(),
      fetchReports()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Invoice creation submit handler
  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.tenantId) {
      setErrorMsg('Please select a client tenant.');
      return;
    }
    const totalCents = invoiceItems.reduce((sum, item) => sum + (item.quantity * item.unitPriceCents), 0);
    try {
      const res = await apiClient.post('/billing/invoices', {
        tenantId: newInvoice.tenantId,
        amountCents: totalCents,
        dueDate: newInvoice.dueDate,
        currency: newInvoice.currency,
        items: invoiceItems
      });
      setInvoices([res.data, ...invoices]);
      setShowInvoiceModal(false);
      setSuccessMsg('Invoice dispatched successfully.');
      setNewInvoice({ tenantId: '', dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], currency: 'USD', description: '' });
      setInvoiceItems([{ description: 'Consulting Services', quantity: 1, unitPriceCents: 15000 }]);
      fetchReports();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to dispatch invoice.');
    }
  };

  const handleAddLineItem = () => {
    setInvoiceItems([...invoiceItems, { description: '', quantity: 1, unitPriceCents: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (invoiceItems.length === 1) return;
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  // Void / Refund handlers
  const handleVoid = async (id: string) => {
    try {
      await apiClient.post(`/billing/invoices/${id}/void`);
      setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: 'voided' } : inv));
      setSuccessMsg('Invoice voided.');
      fetchReports();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to void invoice.');
    }
  };

  const handleRefund = async (id: string) => {
    try {
      await apiClient.post(`/billing/invoices/${id}/refund`);
      setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: 'refunded' } : inv));
      setSuccessMsg('Invoice refunded.');
      fetchReports();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to refund invoice.');
    }
  };

  // Products CRUD
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/billing/products', {
        name: productForm.name,
        price_cents: Number(productForm.price_cents),
        sku: productForm.sku
      });
      setProducts([...products, res.data]);
      setShowProductModal(false);
      setSuccessMsg('Product added to catalog.');
      setProductForm({ name: '', price_cents: 0, sku: '' });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to create product.');
    }
  };

  // Coupons CRUD
  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/billing/coupons', {
        code: couponForm.code,
        discount_percent: Number(couponForm.discount_percent),
        expires_at: couponForm.expires_at || undefined
      });
      setCoupons([...coupons, res.data]);
      setShowCouponModal(false);
      setSuccessMsg('Coupon created successfully.');
      setCouponForm({ code: '', discount_percent: 10, expires_at: '' });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to create coupon.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Metrics overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(181,138,43,0.1)', color: 'var(--primary-color)' }}>
            <Receipt size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-sec)', fontSize: '0.8rem' }}>Total Invoices</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{revenueReport.invoiceCount}</div>
          </div>
        </div>
        <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: 'green' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-sec)', fontSize: '0.8rem' }}>Settled Revenue</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              ${((revenueReport.totalRevenueCents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
        <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-sec)', fontSize: '0.8rem' }}>Current Receivables</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              ${((agingReport.current || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
        <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: 'red' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-sec)', fontSize: '0.8rem' }}>Overdue 30+ Days</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              ${(((agingReport.d30 || 0) + (agingReport.d60 || 0) + (agingReport.d90 || 0)) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: 'rgba(239,68,68,0.1)', borderLeft: '4px solid red', padding: '0.75rem', borderRadius: 6, color: 'red', fontSize: '0.85rem' }}>
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div style={{ background: 'rgba(16,185,129,0.1)', borderLeft: '4px solid green', padding: '0.75rem', borderRadius: 6, color: 'green', fontSize: '0.85rem' }}>
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', gap: '1.5rem', marginBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('invoices')}
          style={{ padding: '0.75rem 0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'invoices' ? '2px solid var(--primary-color)' : 'none', color: activeTab === 'invoices' ? 'var(--text-primary)' : 'var(--text-sec)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
        >
          Invoice Center
        </button>
        <button 
          onClick={() => setActiveTab('products')}
          style={{ padding: '0.75rem 0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'products' ? '2px solid var(--primary-color)' : 'none', color: activeTab === 'products' ? 'var(--text-primary)' : 'var(--text-sec)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
        >
          Product Catalog
        </button>
        <button 
          onClick={() => setActiveTab('coupons')}
          style={{ padding: '0.75rem 0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'coupons' ? '2px solid var(--primary-color)' : 'none', color: activeTab === 'coupons' ? 'var(--text-primary)' : 'var(--text-sec)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
        >
          Coupon & Discounts
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          style={{ padding: '0.75rem 0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'reports' ? '2px solid var(--primary-color)' : 'none', color: activeTab === 'reports' ? 'var(--text-primary)' : 'var(--text-sec)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
        >
          Revenue Reports
        </button>
      </div>

      {activeTab === 'invoices' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedInvoice ? '1fr 360px' : '1fr', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3>Historical Customer Billing Statements</h3>
              <button 
                onClick={() => setShowInvoiceModal(true)}
                style={{ padding: '0.4rem 0.8rem', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <PlusCircle size={16} /> Create Invoice
              </button>
            </div>
            <DataTable 
              columns={[
                {
                  key: 'id',
                  label: 'Invoice Ref',
                  sortable: true,
                  render: (row) => (
                    <span 
                      style={{ fontFamily: 'monospace', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold', color: 'var(--primary-color)' }}
                      onClick={() => setSelectedInvoice(row)}
                    >
                      📄 {row.id.substring(0, 8).toUpperCase()}
                    </span>
                  )
                },
                {
                  key: 'amount_cents',
                  label: 'Total Value',
                  sortable: true,
                  render: (row) => <strong>${(row.amount_cents / 100).toFixed(2)}</strong>
                },
                {
                  key: 'due_date',
                  label: 'Due Date',
                  sortable: true,
                  render: (row) => row.due_date
                },
                {
                  key: 'status',
                  label: 'Payment Status',
                  sortable: true,
                  render: (row: Invoice) => {
                    const colors = {
                      paid: { bg: 'rgba(16,185,129,0.15)', text: 'green' },
                      unpaid: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
                      voided: { bg: 'rgba(239,68,68,0.15)', text: 'red' },
                      refunded: { bg: 'rgba(100,116,139,0.15)', text: '#64748b' }
                    };
                    const badge = colors[row.status] || colors.unpaid;
                    return (
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: badge.bg, color: badge.text, fontWeight: 600 }}>
                        {row.status.toUpperCase()}
                      </span>
                    );
                  }
                },
                {
                  key: 'actions',
                  label: 'Actions',
                  sortable: false,
                  render: (row) => (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {row.status === 'unpaid' && (
                        <button 
                          onClick={() => handleVoid(row.id)}
                          style={{ padding: '0.2rem 0.4rem', background: '#cbd5e1', color: '#000', border: 'none', borderRadius: 4, fontSize: '0.7rem', cursor: 'pointer' }}
                        >
                          Void
                        </button>
                      )}
                      {row.status === 'paid' && (
                        <button 
                          onClick={() => handleRefund(row.id)}
                          style={{ padding: '0.2rem 0.4rem', background: 'rgba(239,68,68,0.1)', color: 'red', border: 'none', borderRadius: 4, fontSize: '0.7rem', cursor: 'pointer' }}
                        >
                          Refund
                        </button>
                      )}
                    </div>
                  )
                }
              ]}
              data={invoices}
              searchPlaceholder="Filter invoice references..."
              searchKey="due_date"
              pageSize={10}
            />
          </div>

          {selectedInvoice && (
            <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Invoice Details</h3>
                <button onClick={() => setSelectedInvoice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div><strong>Invoice Reference:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedInvoice.id}</span></div>
                <div><strong>Creation Date:</strong> {new Date(selectedInvoice.created_at).toLocaleDateString()}</div>
                <div><strong>Amount Due:</strong> ${((selectedInvoice.amount_cents || 0) / 100).toFixed(2)}</div>
                <div><strong>Due Date:</strong> {selectedInvoice.due_date}</div>
                <div><strong>Status:</strong> {selectedInvoice.status.toUpperCase()}</div>
              </div>

              <hr style={{ border: 0, borderTop: '1px solid var(--card-border)' }} />

              <h4>Line Items</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                  selectedInvoice.items.map((item, idx) => (
                    <div key={idx} style={{ background: 'var(--surface-color)', padding: '0.5rem', borderRadius: 6, fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <strong>{item.description}</strong>
                        <div>Qty: {item.quantity} · Rate: ${(item.unit_price_cents / 100).toFixed(2)}</div>
                      </div>
                      <div style={{ fontWeight: 'bold' }}>
                        ${((item.quantity * item.unit_price_cents) / 100).toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ background: 'var(--surface-color)', padding: '0.5rem', borderRadius: 6, fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong>Professional Services</strong>
                      <div>Qty: 1 · Rate: ${((selectedInvoice.amount_cents || 0) / 100).toFixed(2)}</div>
                    </div>
                    <div style={{ fontWeight: 'bold' }}>
                      ${((selectedInvoice.amount_cents || 0) / 100).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'products' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3>Corporate Service & Products Catalog</h3>
            <button 
              onClick={() => setShowProductModal(true)}
              style={{ padding: '0.4rem 0.8rem', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <PlusCircle size={16} /> Add Product
            </button>
          </div>
          <DataTable 
            columns={[
              {
                key: 'name',
                label: 'Product/Service Name',
                sortable: true,
                render: (row) => <strong>🎁 {row.name}</strong>
              },
              {
                key: 'sku',
                label: 'SKU / IdentifierCode',
                sortable: true,
                render: (row) => row.sku || 'N/A'
              },
              {
                key: 'price_cents',
                label: 'Standard Price',
                sortable: true,
                render: (row) => <strong>${(row.price_cents / 100).toFixed(2)}</strong>
              }
            ]}
            data={products}
            searchPlaceholder="Search products..."
            searchKey="name"
            pageSize={10}
          />
        </div>
      )}

      {activeTab === 'coupons' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3>Discounts & Coupons Codes Dashboard</h3>
            <button 
              onClick={() => setShowCouponModal(true)}
              style={{ padding: '0.4rem 0.8rem', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <PlusCircle size={16} /> Create Coupon
            </button>
          </div>
          <DataTable 
            columns={[
              {
                key: 'code',
                label: 'Coupon Code',
                sortable: true,
                render: (row) => <strong style={{ color: 'var(--primary-color)' }}>🏷️ {row.code}</strong>
              },
              {
                key: 'discount_percent',
                label: 'Discount Rate',
                sortable: true,
                render: (row) => <strong>{row.discount_percent}% OFF</strong>
              },
              {
                key: 'expires_at',
                label: 'Expiry Threshold',
                sortable: true,
                render: (row) => row.expires_at ? new Date(row.expires_at).toLocaleDateString() : 'Never Expires'
              }
            ]}
            data={coupons}
            searchPlaceholder="Search coupon codes..."
            searchKey="code"
            pageSize={10}
          />
        </div>
      )}

      {activeTab === 'reports' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="premium-card">
            <h3>Aging Accounts Receivable (Overdue Categories)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
                <span>Current (Not Due Yet)</span>
                <strong>${((agingReport.current || 0) / 100).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', color: '#f59e0b' }}>
                <span>1 - 30 Days Overdue</span>
                <strong>${((agingReport.d30 || 0) / 100).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', color: '#d97706' }}>
                <span>31 - 90 Days Overdue</span>
                <strong>${((agingReport.d60 || 0) / 100).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', color: 'red' }}>
                <span>91+ Days Overdue</span>
                <strong>${((agingReport.d90 || 0) / 100).toFixed(2)}</strong>
              </div>
            </div>
          </div>

          <div className="premium-card">
            <h3>Settled Realized Revenue Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
                <span>Invoice Volume</span>
                <strong>{revenueReport.invoiceCount} invoices</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
                <span>Settled Invoice Count</span>
                <strong>{revenueReport.paidCount} paid</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', color: 'green' }}>
                <span>Realized Cash Inflow</span>
                <strong>${((revenueReport.totalRevenueCents || 0) / 100).toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showInvoiceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2rem', borderRadius: '12px', width: '550px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowInvoiceModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}><X size={18} /></button>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Dispatch Client Billing Statement</h3>
            <form onSubmit={handleInvoiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <select
                value={newInvoice.tenantId}
                onChange={e => setNewInvoice({ ...newInvoice, tenantId: e.target.value })}
                required
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              >
                <option value="">-- Choose Client Tenant --</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <input 
                  type="date" 
                  required
                  value={newInvoice.dueDate}
                  onChange={e => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
                <select
                  value={newInvoice.currency}
                  onChange={e => setNewInvoice({ ...newInvoice, currency: e.target.value })}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <strong>Invoice Line Items</strong>
                <button type="button" onClick={handleAddLineItem} style={{ padding: '0.2rem 0.5rem', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 4, fontSize: '0.75rem', cursor: 'pointer' }}>
                  + Add Line
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {invoiceItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      placeholder="Item description" 
                      required
                      value={item.description}
                      onChange={e => {
                        const next = [...invoiceItems];
                        next[idx].description = e.target.value;
                        setInvoiceItems(next);
                      }}
                      style={{ padding: '0.4rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                    />
                    <input 
                      type="number" 
                      placeholder="Qty" 
                      required
                      value={item.quantity}
                      onChange={e => {
                        const next = [...invoiceItems];
                        next[idx].quantity = Number(e.target.value);
                        setInvoiceItems(next);
                      }}
                      style={{ padding: '0.4rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                    />
                    <input 
                      type="number" 
                      placeholder="Price Cents" 
                      required
                      value={item.unitPriceCents || ''}
                      onChange={e => {
                        const next = [...invoiceItems];
                        next[idx].unitPriceCents = Number(e.target.value);
                        setInvoiceItems(next);
                      }}
                      style={{ padding: '0.4rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                    />
                    <button type="button" onClick={() => handleRemoveLineItem(idx)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
              </div>

              <button type="submit" style={{ padding: '0.6rem', background: '#B58A2B', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Onboard & Dispatch Statement
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {showProductModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2rem', borderRadius: '12px', width: '450px', position: 'relative' }}>
            <button onClick={() => setShowProductModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}><X size={18} /></button>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Add Product/Service to Catalog</h3>
            <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" placeholder="Product Name" required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
              <input type="number" placeholder="Price Cents (e.g. 9900 for $99.00)" required value={productForm.price_cents || ''} onChange={e => setProductForm({ ...productForm, price_cents: Number(e.target.value) })} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
              <input type="text" placeholder="SKU / Reference Identifier" value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
              
              <button type="submit" style={{ padding: '0.6rem', background: '#B58A2B', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
                Add to Catalog
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      {showCouponModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2rem', borderRadius: '12px', width: '450px', position: 'relative' }}>
            <button onClick={() => setShowCouponModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}><X size={18} /></button>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Generate Coupon Code</h3>
            <form onSubmit={handleCouponSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" placeholder="Coupon Code (e.g. SAVE20)" required value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase().trim() })} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
              <input type="number" placeholder="Discount Percent (1 - 100)" required min={1} max={100} value={couponForm.discount_percent} onChange={e => setCouponForm({ ...couponForm, discount_percent: Number(e.target.value) })} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
              <input type="date" placeholder="Expiry Date" value={couponForm.expires_at} onChange={e => setCouponForm({ ...couponForm, expires_at: e.target.value })} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
              
              <button type="submit" style={{ padding: '0.6rem', background: '#B58A2B', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
                Activate Discount Coupon
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
