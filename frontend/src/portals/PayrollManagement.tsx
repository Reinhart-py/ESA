import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client.ts';
import {
  Users, Calendar, Clock, DollarSign, CreditCard,
  PlusCircle, X, Check, Sparkles, TrendingUp, BarChart2,
  AlertCircle, ShieldCheck, Plus, Trash2, Briefcase
} from 'lucide-react';
import DataTable from '../components/ui/DataTable.tsx';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: 'active' | 'suspended' | 'terminated';
  role?: string;
  tax_id?: string;
  base_salary_cents: number;
  created_at: string;
  salary_structure?: {
    allowances_cents: number;
    deductions_cents: number;
  };
  benefits?: any[];
}

interface Timesheet {
  id: string;
  employee_id: string;
  date: string;
  hours_worked: number;
  created_at: string;
  employee?: Employee;
}

interface PayrollRun {
  id: string;
  period_start: string;
  period_end: string;
  status: 'draft' | 'approved' | 'paid';
  total_payout_cents: number;
  created_at: string;
  payslips?: any[];
}

interface Payslip {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  base_salary_cents: number;
  allowances_cents: number;
  deductions_cents: number;
  net_pay_cents: number;
  created_at: string;
  employee?: Employee;
  payroll_run?: PayrollRun;
}

interface PtoRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  employee?: Employee;
}

export default function PayrollManagement() {
  const [activeTab, setActiveTab] = useState<'employees' | 'timesheets' | 'runs' | 'payslips' | 'pto' | 'reports'>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [ptoRequests, setPtoRequests] = useState<PtoRequest[]>([]);
  const [compensationStats, setCompensationStats] = useState<any>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalMonthlyPayrollCostCents: 0,
    averageSalaryCents: 0,
    rolesDistribution: {}
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selection states
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  // Modals state
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showTimesheetModal, setShowTimesheetModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [showPtoModal, setShowPtoModal] = useState(false);
  const [showBenefitModal, setShowBenefitModal] = useState(false);

  // Form states
  const [employeeForm, setEmployeeForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    tax_id: '',
    base_salary_cents: 0
  });

  const [timesheetForm, setTimesheetForm] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    hours_worked: 8
  });

  const [runForm, setRunForm] = useState({
    period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });

  const [ptoForm, setPtoForm] = useState({
    employee_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  });

  const [benefitForm, setBenefitForm] = useState({
    type: 'Health Insurance',
    cost_cents: 25000
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [empRes, timeRes, runRes, payRes, ptoRes, statsRes] = await Promise.all([
        apiClient.get('/payroll/employees'),
        apiClient.get('/payroll/timesheets'),
        apiClient.get('/payroll/runs'),
        apiClient.get('/payroll/payslips'),
        apiClient.get('/payroll/pto-requests'),
        apiClient.get('/payroll/reports/compensation')
      ]);

      setEmployees(empRes.data || []);
      setTimesheets(timeRes.data || []);
      setPayrollRuns(runRes.data || []);
      setPayslips(payRes.data || []);
      setPtoRequests(ptoRes.data || []);
      setCompensationStats(statsRes.data || {});
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to sync payroll database tables.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const clearNotifications = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Onboard Employee
  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearNotifications();
    try {
      const res = await apiClient.post('/payroll/employees', {
        ...employeeForm,
        base_salary_cents: Number(employeeForm.base_salary_cents)
      });
      setEmployees([res.data, ...employees]);
      setShowEmployeeModal(false);
      setSuccessMsg(`Successfully onboarded employee ${employeeForm.first_name} ${employeeForm.last_name}`);
      setEmployeeForm({ first_name: '', last_name: '', email: '', role: '', tax_id: '', base_salary_cents: 0 });
      // Refresh stats
      const statsRes = await apiClient.get('/payroll/reports/compensation');
      setCompensationStats(statsRes.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to onboard staff.');
    }
  };

  // View Employee detail
  const handleViewEmployee = async (emp: Employee) => {
    try {
      const res = await apiClient.get(`/payroll/employees/${emp.id}`);
      setSelectedEmployee(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to load employee file.');
    }
  };

  // Add Benefit
  const handleBenefitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    clearNotifications();
    try {
      const res = await apiClient.post('/payroll/benefits', {
        employee_id: selectedEmployee.id,
        type: benefitForm.type,
        cost_cents: Number(benefitForm.cost_cents)
      });
      setSelectedEmployee({
        ...selectedEmployee,
        benefits: [...(selectedEmployee.benefits || []), res.data]
      });
      setShowBenefitModal(false);
      setSuccessMsg('Benefits package successfully bound to employee record.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to add benefit.');
    }
  };

  // Delete Benefit
  const handleDeleteBenefit = async (benefitId: string) => {
    if (!selectedEmployee) return;
    clearNotifications();
    try {
      await apiClient.delete(`/payroll/benefits/${benefitId}`);
      setSelectedEmployee({
        ...selectedEmployee,
        benefits: (selectedEmployee.benefits || []).filter(b => b.id !== benefitId)
      });
      setSuccessMsg('Benefit revoked.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to revoke benefit.');
    }
  };

  // Log Timesheet Hours
  const handleTimesheetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearNotifications();
    try {
      const res = await apiClient.post('/payroll/timesheets', {
        employee_id: timesheetForm.employee_id,
        date: timesheetForm.date,
        hours_worked: Number(timesheetForm.hours_worked)
      });
      // Find employee info to attach locally
      const emp = employees.find(e => e.id === timesheetForm.employee_id);
      const newTime = { ...res.data, employee: emp };
      setTimesheets([newTime, ...timesheets]);
      setShowTimesheetModal(false);
      setSuccessMsg('Hours logged successfully.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to log hours.');
    }
  };

  // Run Payroll Processing
  const handleRunSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearNotifications();
    try {
      const res = await apiClient.post('/payroll/runs', runForm);
      setPayrollRuns([res.data, ...payrollRuns]);
      setShowRunModal(false);
      setSuccessMsg(`Draft payroll run generated for period: ${runForm.period_start} to ${runForm.period_end}`);
      
      // Refresh payslips list
      const payslipsRes = await apiClient.get('/payroll/payslips');
      setPayslips(payslipsRes.data || []);
      
      // Refresh stats
      const statsRes = await apiClient.get('/payroll/reports/compensation');
      setCompensationStats(statsRes.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to process payroll execution run.');
    }
  };

  // Approve Payroll Run
  const handleApproveRun = async (runId: string) => {
    clearNotifications();
    try {
      const res = await apiClient.post(`/payroll/runs/${runId}/approve`);
      setPayrollRuns(payrollRuns.map(run => run.id === runId ? { ...run, status: 'approved' } : run));
      if (selectedRun?.id === runId) {
        setSelectedRun({ ...selectedRun, status: 'approved' });
      }
      setSuccessMsg('Payroll run calculations approved successfully.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to approve payroll run.');
    }
  };

  // Pay / Disburse Payouts
  const handlePayRun = async (runId: string) => {
    clearNotifications();
    try {
      const res = await apiClient.post(`/runs/${runId}/pay`);
      setPayrollRuns(payrollRuns.map(run => run.id === runId ? { ...run, status: 'paid' } : run));
      if (selectedRun?.id === runId) {
        setSelectedRun({ ...selectedRun, status: 'paid' });
      }
      setSuccessMsg('ACH direct deposits initiated. Status: PAID');
    } catch (err: any) {
      // In server.ts the path is actually /api/payroll/runs/:id/pay
      try {
        await apiClient.post(`/payroll/runs/${runId}/pay`);
        setPayrollRuns(payrollRuns.map(run => run.id === runId ? { ...run, status: 'paid' } : run));
        if (selectedRun?.id === runId) {
          setSelectedRun({ ...selectedRun, status: 'paid' });
        }
        setSuccessMsg('ACH direct deposits initiated. Status: PAID');
      } catch (innerErr: any) {
        setErrorMsg(innerErr.response?.data?.error || 'Failed to disburse payments.');
      }
    }
  };

  // View Payroll Run details
  const handleViewRun = async (run: PayrollRun) => {
    try {
      const res = await apiClient.get(`/payroll/runs/${run.id}`);
      setSelectedRun(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to load run details.');
    }
  };

  // View Payslip details
  const handleViewPayslip = async (payslip: Payslip) => {
    try {
      const res = await apiClient.get(`/payroll/payslips/${payslip.id}`);
      setSelectedPayslip(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to retrieve payslip file.');
    }
  };

  // Submit Leave Request
  const handlePtoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearNotifications();
    try {
      const res = await apiClient.post('/payroll/pto-requests', ptoForm);
      const emp = employees.find(e => e.id === ptoForm.employee_id);
      setPtoRequests([{ ...res.data, employee: emp }, ...ptoRequests]);
      setShowPtoModal(false);
      setSuccessMsg('Leave request successfully logged in system.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit PTO request.');
    }
  };

  // Resolve PTO status
  const handlePtoResolve = async (id: string, status: 'approved' | 'rejected') => {
    clearNotifications();
    try {
      const res = await apiClient.put(`/payroll/pto-requests/${id}/approve`, { status });
      setPtoRequests(ptoRequests.map(r => r.id === id ? { ...r, status: res.data.status } : r));
      setSuccessMsg(`PTO Request successfully ${status}.`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to resolve PTO status.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      
      {/* Premium Dashboard Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-sec)', fontSize: '0.8rem' }}>Total Workforce</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{compensationStats.totalEmployees || 0}</div>
          </div>
        </div>
        
        <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: 'green' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-sec)', fontSize: '0.8rem' }}>Active Payroll Staff</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{compensationStats.activeEmployees || 0}</div>
          </div>
        </div>

        <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(181,138,43,0.1)', color: 'var(--primary-color)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-sec)', fontSize: '0.8rem' }}>Total Monthly Payroll</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              ${((compensationStats.totalMonthlyPayrollCostCents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ color: 'var(--text-sec)', fontSize: '0.8rem' }}>Average Base Salary</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              ${((compensationStats.averageSalaryCents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Alert Notifications */}
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

      {/* Tabs Layout */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', gap: '1.5rem', marginBottom: '0.5rem' }}>
        <button
          onClick={() => { setActiveTab('employees'); clearNotifications(); }}
          style={{ padding: '0.75rem 0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'employees' ? '2px solid var(--primary-color)' : 'none', color: activeTab === 'employees' ? 'var(--text-primary)' : 'var(--text-sec)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
        >
          Staff Registry
        </button>
        <button
          onClick={() => { setActiveTab('timesheets'); clearNotifications(); }}
          style={{ padding: '0.75rem 0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'timesheets' ? '2px solid var(--primary-color)' : 'none', color: activeTab === 'timesheets' ? 'var(--text-primary)' : 'var(--text-sec)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
        >
          Hours Logs
        </button>
        <button
          onClick={() => { setActiveTab('runs'); clearNotifications(); }}
          style={{ padding: '0.75rem 0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'runs' ? '2px solid var(--primary-color)' : 'none', color: activeTab === 'runs' ? 'var(--text-primary)' : 'var(--text-sec)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
        >
          Payroll Runs
        </button>
        <button
          onClick={() => { setActiveTab('payslips'); clearNotifications(); }}
          style={{ padding: '0.75rem 0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'payslips' ? '2px solid var(--primary-color)' : 'none', color: activeTab === 'payslips' ? 'var(--text-primary)' : 'var(--text-sec)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
        >
          Payslips Receipts
        </button>
        <button
          onClick={() => { setActiveTab('pto'); clearNotifications(); }}
          style={{ padding: '0.75rem 0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'pto' ? '2px solid var(--primary-color)' : 'none', color: activeTab === 'pto' ? 'var(--text-primary)' : 'var(--text-sec)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
        >
          Leaves/PTO Request
        </button>
        <button
          onClick={() => { setActiveTab('reports'); clearNotifications(); }}
          style={{ padding: '0.75rem 0.5rem', background: 'none', border: 'none', borderBottom: activeTab === 'reports' ? '2px solid var(--primary-color)' : 'none', color: activeTab === 'reports' ? 'var(--text-primary)' : 'var(--text-sec)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
        >
          Compensation Reports
        </button>
      </div>

      {/* Employees tab */}
      {activeTab === 'employees' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedEmployee ? '1fr 380px' : '1fr', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
              <h3>Workforce Member Profiles</h3>
              <button
                onClick={() => setShowEmployeeModal(true)}
                style={{ padding: '0.4rem 0.8rem', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <PlusCircle size={16} /> Onboard Employee
              </button>
            </div>
            
            <DataTable
              columns={[
                {
                  key: 'name',
                  label: 'Name',
                  sortable: true,
                  render: (row) => (
                    <span
                      style={{ cursor: 'pointer', fontWeight: 'bold', color: 'var(--primary-color)' }}
                      onClick={() => handleViewEmployee(row)}
                    >
                      👤 {row.first_name} {row.last_name}
                    </span>
                  )
                },
                {
                  key: 'email',
                  label: 'Email',
                  sortable: true,
                  render: (row) => row.email
                },
                {
                  key: 'role',
                  label: 'Position/Role',
                  sortable: true,
                  render: (row) => row.role || 'Unassigned'
                },
                {
                  key: 'base_salary_cents',
                  label: 'Monthly Base Salary',
                  sortable: true,
                  render: (row) => <strong>${(row.base_salary_cents / 100).toLocaleString()}</strong>
                },
                {
                  key: 'status',
                  label: 'Account Status',
                  sortable: true,
                  render: (row) => {
                    const colors = {
                      active: { bg: 'rgba(16,185,129,0.15)', text: 'green' },
                      suspended: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
                      terminated: { bg: 'rgba(239,68,68,0.15)', text: 'red' }
                    };
                    const badge = colors[row.status] || colors.active;
                    return (
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: badge.bg, color: badge.text, fontWeight: 600 }}>
                        {row.status.toUpperCase()}
                      </span>
                    );
                  }
                }
              ]}
              data={employees}
              searchPlaceholder="Filter employees name..."
              searchKey="first_name"
              pageSize={10}
            />
          </div>

          {selectedEmployee && (
            <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Employee Profile</h3>
                <button onClick={() => setSelectedEmployee(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div><strong>Full Name:</strong> {selectedEmployee.first_name} {selectedEmployee.last_name}</div>
                <div><strong>Email:</strong> {selectedEmployee.email}</div>
                <div><strong>Role/Title:</strong> {selectedEmployee.role || 'N/A'}</div>
                <div><strong>Tax Code ID:</strong> {selectedEmployee.tax_id || 'N/A'}</div>
                <div><strong>Base Monthly Salary:</strong> ${(selectedEmployee.base_salary_cents / 100).toLocaleString()}</div>
                <div><strong>Enrollment Date:</strong> {new Date(selectedEmployee.created_at).toLocaleDateString()}</div>
                <div><strong>Status:</strong> {selectedEmployee.status.toUpperCase()}</div>
              </div>

              <hr style={{ border: 0, borderTop: '1px solid var(--card-border)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>Benefits & Deductions</h4>
                <button
                  onClick={() => setShowBenefitModal(true)}
                  style={{ padding: '0.2rem 0.4rem', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 4, fontSize: '0.7rem', cursor: 'pointer' }}
                >
                  + Bind Package
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                {selectedEmployee.benefits && selectedEmployee.benefits.length > 0 ? (
                  selectedEmployee.benefits.map((benefit, idx) => (
                    <div key={idx} style={{ background: 'var(--surface-color)', padding: '0.5rem', borderRadius: 6, fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{benefit.type}</strong>
                        <div>Cost: ${(benefit.cost_cents / 100).toFixed(2)}/mo</div>
                      </div>
                      <button
                        onClick={() => handleDeleteBenefit(benefit.id)}
                        style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-sec)', fontSize: '0.75rem', textAlign: 'center', padding: '1rem' }}>
                    No benefit packages bound.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timesheets tab */}
      {activeTab === 'timesheets' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
            <h3>Employee Hours Logging timesheets</h3>
            <button
              onClick={() => setShowTimesheetModal(true)}
              style={{ padding: '0.4rem 0.8rem', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Clock size={16} /> Log Hours
            </button>
          </div>

          <DataTable
            columns={[
              {
                key: 'employee',
                label: 'Employee',
                sortable: true,
                render: (row) => row.employee ? `${row.employee.first_name} ${row.employee.last_name}` : 'Unknown'
              },
              {
                key: 'date',
                label: 'Date',
                sortable: true,
                render: (row) => row.date
              },
              {
                key: 'hours_worked',
                label: 'Hours Worked',
                sortable: true,
                render: (row) => <strong>{Number(row.hours_worked).toFixed(1)} hrs</strong>
              },
              {
                key: 'created_at',
                label: 'Logged At',
                sortable: true,
                render: (row) => new Date(row.created_at).toLocaleString()
              }
            ]}
            data={timesheets}
            searchPlaceholder="Search timesheet records by employee..."
            searchKey="employee_id"
            pageSize={10}
          />
        </div>
      )}

      {/* Payroll runs tab */}
      {activeTab === 'runs' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedRun ? '1fr 380px' : '1fr', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
              <h3>Execute Monthly Payroll Cycles</h3>
              <button
                onClick={() => setShowRunModal(true)}
                style={{ padding: '0.4rem 0.8rem', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <PlusCircle size={16} /> Process Payroll Run
              </button>
            </div>

            <DataTable
              columns={[
                {
                  key: 'id',
                  label: 'Run ID Reference',
                  sortable: true,
                  render: (row) => (
                    <span
                      style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--primary-color)', cursor: 'pointer' }}
                      onClick={() => handleViewRun(row)}
                    >
                      ⚙️ {row.id.substring(0, 8).toUpperCase()}
                    </span>
                  )
                },
                {
                  key: 'period',
                  label: 'Billing Cycle Period',
                  sortable: false,
                  render: (row) => `${row.period_start} to ${row.period_end}`
                },
                {
                  key: 'total_payout_cents',
                  label: 'Gross Net Payout',
                  sortable: true,
                  render: (row) => <strong>${(row.total_payout_cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                },
                {
                  key: 'status',
                  label: 'Execution Status',
                  sortable: true,
                  render: (row) => {
                    const colors = {
                      draft: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
                      approved: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
                      paid: { bg: 'rgba(16,185,129,0.15)', text: 'green' }
                    };
                    const badge = colors[row.status] || colors.draft;
                    return (
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: badge.bg, color: badge.text, fontWeight: 600 }}>
                        {row.status.toUpperCase()}
                      </span>
                    );
                  }
                },
                {
                  key: 'actions',
                  label: 'Commands',
                  sortable: false,
                  render: (row) => (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {row.status === 'draft' && (
                        <button
                          onClick={() => handleApproveRun(row.id)}
                          style={{ padding: '0.2rem 0.4rem', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 4, fontSize: '0.7rem', cursor: 'pointer' }}
                        >
                          Approve
                        </button>
                      )}
                      {row.status === 'approved' && (
                        <button
                          onClick={() => handlePayRun(row.id)}
                          style={{ padding: '0.2rem 0.4rem', background: 'green', color: '#fff', border: 'none', borderRadius: 4, fontSize: '0.7rem', cursor: 'pointer' }}
                        >
                          Disburse
                        </button>
                      )}
                    </div>
                  )
                }
              ]}
              data={payrollRuns}
              searchPlaceholder="Filter runs..."
              searchKey="period_start"
              pageSize={10}
            />
          </div>

          {selectedRun && (
            <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Payroll Run Details</h3>
                <button onClick={() => setSelectedRun(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div><strong>Payroll Run UUID:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedRun.id}</span></div>
                <div><strong>Cycle Starts:</strong> {selectedRun.period_start}</div>
                <div><strong>Cycle Ends:</strong> {selectedRun.period_end}</div>
                <div><strong>Status:</strong> {selectedRun.status.toUpperCase()}</div>
                <div><strong>Disbursement Payout:</strong> ${((selectedRun.total_payout_cents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>

              <hr style={{ border: 0, borderTop: '1px solid var(--card-border)' }} />

              <h4 style={{ margin: 0 }}>Staff Receipts (Payslips)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                {selectedRun.payslips && selectedRun.payslips.length > 0 ? (
                  selectedRun.payslips.map((slip, idx) => (
                    <div key={idx} style={{ background: 'var(--surface-color)', padding: '0.5rem', borderRadius: 6, fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <strong>{slip.employee ? `${slip.employee.first_name} ${slip.employee.last_name}` : 'Staff Member'}</strong>
                        <div>Base: ${(slip.base_salary_cents / 100).toFixed(0)} · Net: ${(slip.net_pay_cents / 100).toFixed(0)}</div>
                      </div>
                      <div style={{ fontWeight: 'bold', color: 'green' }}>
                        ${(slip.net_pay_cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-sec)', fontSize: '0.75rem', textAlign: 'center', padding: '1rem' }}>
                    No payslips found for this cycle.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payslips Receipts tab */}
      {activeTab === 'payslips' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedPayslip ? '1fr 380px' : '1fr', gap: '1.5rem' }}>
          <div>
            <h3>Generated Staff Payroll Payslips Receipts</h3>
            <DataTable
              columns={[
                {
                  key: 'id',
                  label: 'Payslip Ref',
                  sortable: true,
                  render: (row) => (
                    <span
                      style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--primary-color)', cursor: 'pointer' }}
                      onClick={() => handleViewPayslip(row)}
                    >
                      📄 slip-{row.id.substring(0, 6).toUpperCase()}
                    </span>
                  )
                },
                {
                  key: 'employee',
                  label: 'Employee Name',
                  sortable: true,
                  render: (row) => row.employee ? `${row.employee.first_name} ${row.employee.last_name}` : 'Unknown'
                },
                {
                  key: 'net_pay_cents',
                  label: 'Net Payout',
                  sortable: true,
                  render: (row) => <strong>${(row.net_pay_cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                },
                {
                  key: 'created_at',
                  label: 'Issued Date',
                  sortable: true,
                  render: (row) => new Date(row.created_at).toLocaleDateString()
                }
              ]}
              data={payslips}
              searchPlaceholder="Search payslips..."
              searchKey="employee_id"
              pageSize={10}
            />
          </div>

          {selectedPayslip && (
            <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid var(--primary-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>Payslip Receipt</h3>
                <button onClick={() => setSelectedPayslip(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              <div style={{ background: 'rgba(181, 138, 43, 0.05)', padding: '1rem', borderRadius: 8, fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  Enterprise Operating System
                </div>
                <div><strong>Employee:</strong> {selectedPayslip.employee?.first_name} {selectedPayslip.employee?.last_name}</div>
                <div><strong>Tax ID:</strong> {selectedPayslip.employee?.tax_id || 'N/A'}</div>
                <div><strong>Position:</strong> {selectedPayslip.employee?.role || 'N/A'}</div>
                <div><strong>Billing Cycle Ref:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedPayslip.payroll_run_id.substring(0, 8).toUpperCase()}</span></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Base Monthly Salary:</span>
                  <strong>${(selectedPayslip.base_salary_cents / 100).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'green' }}>
                  <span>Total Allowances:</span>
                  <strong>+${(selectedPayslip.allowances_cents / 100).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'red' }}>
                  <span>Total Deductions/Withholdings:</span>
                  <strong>-${(selectedPayslip.deductions_cents / 100).toFixed(2)}</strong>
                </div>
                
                <hr style={{ border: 0, borderTop: '1px dotted var(--card-border)' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 'bold', color: 'green' }}>
                  <span>Net Disbursed Pay:</span>
                  <span>${(selectedPayslip.net_pay_cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                style={{ padding: '0.5rem', border: '1px solid var(--primary-color)', background: 'none', color: 'var(--primary-color)', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
              >
                Print Payslip Receipt
              </button>
            </div>
          )}
        </div>
      )}

      {/* PTO tab */}
      {activeTab === 'pto' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
            <h3>Workforce Paid Time Off (PTO) Leaves Calendar</h3>
            <button
              onClick={() => setShowPtoModal(true)}
              style={{ padding: '0.4rem 0.8rem', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Calendar size={16} /> Request Leave
            </button>
          </div>

          <DataTable
            columns={[
              {
                key: 'employee',
                label: 'Employee Name',
                sortable: true,
                render: (row) => row.employee ? `${row.employee.first_name} ${row.employee.last_name}` : 'Unknown'
              },
              {
                key: 'dates',
                label: 'Leave Interval Range',
                sortable: false,
                render: (row) => `${row.start_date} to ${row.end_date}`
              },
              {
                key: 'status',
                label: 'Filing Status',
                sortable: true,
                render: (row) => {
                  const colors = {
                    pending: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
                    approved: { bg: 'rgba(16,185,129,0.15)', text: 'green' },
                    rejected: { bg: 'rgba(239,68,68,0.15)', text: 'red' }
                  };
                  const badge = colors[row.status] || colors.pending;
                  return (
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: badge.bg, color: badge.text, fontWeight: 600 }}>
                      {row.status.toUpperCase()}
                    </span>
                  );
                }
              },
              {
                key: 'actions',
                label: 'Admin Resolvers',
                sortable: false,
                render: (row) => (
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {row.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handlePtoResolve(row.id, 'approved')}
                          style={{ padding: '0.2rem 0.4rem', background: 'rgba(16,185,129,0.15)', color: 'green', border: 'none', borderRadius: 4, fontSize: '0.7rem', cursor: 'pointer' }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handlePtoResolve(row.id, 'rejected')}
                          style={{ padding: '0.2rem 0.4rem', background: 'rgba(239,68,68,0.15)', color: 'red', border: 'none', borderRadius: 4, fontSize: '0.7rem', cursor: 'pointer' }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                )
              }
            ]}
            data={ptoRequests}
            searchPlaceholder="Search leaves..."
            searchKey="employee_id"
            pageSize={10}
          />
        </div>
      )}

      {/* Reports tab */}
      {activeTab === 'reports' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
          <div className="premium-card">
            <h3>Monthly Compensation Structure Cost</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
                <span>Workforce Base Salary Cost</span>
                <strong>${((compensationStats.totalMonthlyPayrollCostCents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
                <span>Average Compensation Salary</span>
                <strong>${((compensationStats.averageSalaryCents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
                <span>Active Salaried Employees</span>
                <strong>{compensationStats.activeEmployees || 0} active</strong>
              </div>
            </div>
          </div>

          <div className="premium-card">
            <h3>Enterprise Role Distributions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {compensationStats.rolesDistribution && Object.keys(compensationStats.rolesDistribution).length > 0 ? (
                Object.entries(compensationStats.rolesDistribution).map(([roleName, count]: [string, any]) => (
                  <div key={roleName} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>{roleName}</span>
                      <strong>{count} ({Math.round((count / (compensationStats.totalEmployees || 1)) * 100)}%)</strong>
                    </div>
                    <div style={{ background: 'var(--surface-color)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ background: 'var(--primary-color)', height: '100%', width: `${(count / (compensationStats.totalEmployees || 1)) * 100}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-sec)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>
                  No role data available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Onboard Employee Modal */}
      {showEmployeeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2rem', borderRadius: '12px', width: '480px', position: 'relative' }}>
            <button onClick={() => setShowEmployeeModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}><X size={18} /></button>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Onboard New Staff Member</h3>
            <form onSubmit={handleEmployeeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="First Name"
                  required
                  value={employeeForm.first_name}
                  onChange={e => setEmployeeForm({ ...employeeForm, first_name: e.target.value })}
                  style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  required
                  value={employeeForm.last_name}
                  onChange={e => setEmployeeForm({ ...employeeForm, last_name: e.target.value })}
                  style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <input
                type="email"
                placeholder="Email Address"
                required
                value={employeeForm.email}
                onChange={e => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Role/Title"
                  required
                  value={employeeForm.role}
                  onChange={e => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                  style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                />
                <input
                  type="text"
                  placeholder="Tax ID Number"
                  required
                  value={employeeForm.tax_id}
                  onChange={e => setEmployeeForm({ ...employeeForm, tax_id: e.target.value })}
                  style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <input
                type="number"
                placeholder="Monthly Base Salary (in Cents, e.g. 500000 for $5,000.00)"
                required
                min={0}
                value={employeeForm.base_salary_cents || ''}
                onChange={e => setEmployeeForm({ ...employeeForm, base_salary_cents: Number(e.target.value) })}
                style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
              />

              <button type="submit" style={{ padding: '0.6rem', background: '#B58A2B', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
                Complete Onboarding
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Log Timesheet Modal */}
      {showTimesheetModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2rem', borderRadius: '12px', width: '450px', position: 'relative' }}>
            <button onClick={() => setShowTimesheetModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}><X size={18} /></button>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Log Employee Labor Hours</h3>
            <form onSubmit={handleTimesheetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <select
                required
                value={timesheetForm.employee_id}
                onChange={e => setTimesheetForm({ ...timesheetForm, employee_id: e.target.value })}
                style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
              >
                <option value="">-- Choose Employee --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.role})</option>
                ))}
              </select>

              <input
                type="date"
                required
                value={timesheetForm.date}
                onChange={e => setTimesheetForm({ ...timesheetForm, date: e.target.value })}
                style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
              />

              <input
                type="number"
                placeholder="Hours Worked"
                required
                min={0}
                max={24}
                step={0.5}
                value={timesheetForm.hours_worked}
                onChange={e => setTimesheetForm({ ...timesheetForm, hours_worked: Number(e.target.value) })}
                style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
              />

              <button type="submit" style={{ padding: '0.6rem', background: '#B58A2B', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
                Log Hours Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Execute Payroll Run Modal */}
      {showRunModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2rem', borderRadius: '12px', width: '450px', position: 'relative' }}>
            <button onClick={() => setShowRunModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}><X size={18} /></button>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Execute Monthly Payroll Run</h3>
            <form onSubmit={handleRunSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-sec)' }}>Cycle Period Start Date</label>
                <input
                  type="date"
                  required
                  value={runForm.period_start}
                  onChange={e => setRunForm({ ...runForm, period_start: e.target.value })}
                  style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-sec)' }}>Cycle Period End Date</label>
                <input
                  type="date"
                  required
                  value={runForm.period_end}
                  onChange={e => setRunForm({ ...runForm, period_end: e.target.value })}
                  style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <button type="submit" style={{ padding: '0.6rem', background: '#B58A2B', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
                Generate Payroll Calculations
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PTO leave modal */}
      {showPtoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2rem', borderRadius: '12px', width: '450px', position: 'relative' }}>
            <button onClick={() => setShowPtoModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}><X size={18} /></button>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Request PTO Leave Period</h3>
            <form onSubmit={handlePtoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <select
                required
                value={ptoForm.employee_id}
                onChange={e => setPtoForm({ ...ptoForm, employee_id: e.target.value })}
                style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
              >
                <option value="">-- Choose Employee --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                ))}
              </select>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-sec)' }}>Leave Start Date</label>
                <input
                  type="date"
                  required
                  value={ptoForm.start_date}
                  onChange={e => setPtoForm({ ...ptoForm, start_date: e.target.value })}
                  style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-sec)' }}>Leave End Date</label>
                <input
                  type="date"
                  required
                  value={ptoForm.end_date}
                  onChange={e => setPtoForm({ ...ptoForm, end_date: e.target.value })}
                  style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <button type="submit" style={{ padding: '0.6rem', background: '#B58A2B', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
                Log Leave Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bind Benefit Modal */}
      {showBenefitModal && selectedEmployee && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', padding: '2rem', borderRadius: '12px', width: '450px', position: 'relative' }}>
            <button onClick={() => setShowBenefitModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-sec)' }}><X size={18} /></button>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Assign Benefits Package</h3>
            <form onSubmit={handleBenefitSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-sec)' }}>Benefits Type</label>
                <select
                  required
                  value={benefitForm.type}
                  onChange={e => setBenefitForm({ ...benefitForm, type: e.target.value })}
                  style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                >
                  <option value="Health Insurance">Health Insurance</option>
                  <option value="401k Matching">401k Retirement Plan</option>
                  <option value="Dental Coverage">Dental Coverage</option>
                  <option value="Life Insurance">Life Insurance</option>
                  <option value="Gym Membership">Gym Reimbursement</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-sec)' }}>Monthly Cost (in Cents)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={benefitForm.cost_cents || ''}
                  onChange={e => setBenefitForm({ ...benefitForm, cost_cents: Number(e.target.value) })}
                  style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--card-border)', background: 'var(--surface-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <button type="submit" style={{ padding: '0.6rem', background: '#B58A2B', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
                Bind Benefit Package
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
