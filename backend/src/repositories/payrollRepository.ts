import { supabase } from '../config/supabase.js';

export class PayrollRepository {
  // Employees
  static async getEmployeesByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('payroll_employees')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createEmployee(employee: {
    tenant_id: string;
    first_name: string;
    last_name: string;
    email: string;
    role?: string;
    tax_id?: string;
    base_salary_cents: number;
    status?: string;
  }) {
    const { data, error } = await supabase
      .from('payroll_employees')
      .insert(employee)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getEmployeeById(id: string, tenantId: string) {
    const { data, error } = await supabase
      .from('payroll_employees')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateEmployee(id: string, tenantId: string, updates: any) {
    const { data, error } = await supabase
      .from('payroll_employees')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteEmployee(id: string, tenantId: string) {
    const { error } = await supabase
      .from('payroll_employees')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;
    return true;
  }

  // Salary Structures
  static async getSalaryStructureByEmployee(employeeId: string) {
    const { data, error } = await supabase
      .from('payroll_salary_structures')
      .select('*')
      .eq('employee_id', employeeId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async saveSalaryStructure(structure: {
    employee_id: string;
    base_salary_cents: number;
    allowances_cents: number;
    deductions_cents: number;
  }) {
    // Delete existing structure first to upsert safely
    await supabase
      .from('payroll_salary_structures')
      .delete()
      .eq('employee_id', structure.employee_id);

    const { data, error } = await supabase
      .from('payroll_salary_structures')
      .insert(structure)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Timesheets
  static async createTimesheet(timesheet: {
    employee_id: string;
    date: string;
    hours_worked: number;
  }) {
    const { data, error } = await supabase
      .from('payroll_timesheets')
      .insert(timesheet)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getTimesheetsByEmployee(employeeId: string) {
    const { data, error } = await supabase
      .from('payroll_timesheets')
      .select('*')
      .eq('employee_id', employeeId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getTimesheetsByTenant(tenantId: string) {
    // We join through payroll_employees to filter by tenant_id
    const { data, error } = await supabase
      .from('payroll_timesheets')
      .select(`
        *,
        employee:payroll_employees(*)
      `)
      .order('date', { ascending: false });

    if (error) throw error;

    // Filter programmatically just in case
    return (data || []).filter((item: any) => item.employee?.tenant_id === tenantId);
  }

  // Payroll Runs
  static async getPayrollRunsByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('payroll_runs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createPayrollRun(run: {
    tenant_id: string;
    period_start: string;
    period_end: string;
    status?: string;
    total_payout_cents: number;
  }) {
    const { data, error } = await supabase
      .from('payroll_runs')
      .insert(run)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getPayrollRunById(id: string, tenantId: string) {
    const { data, error } = await supabase
      .from('payroll_runs')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    return data;
  }

  static async updatePayrollRun(id: string, tenantId: string, updates: any) {
    const { data, error } = await supabase
      .from('payroll_runs')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Payslips
  static async createPayslips(payslips: Array<{
    payroll_run_id: string;
    employee_id: string;
    base_salary_cents: number;
    allowances_cents: number;
    deductions_cents: number;
    net_pay_cents: number;
  }>) {
    const { data, error } = await supabase
      .from('payroll_payslips')
      .insert(payslips)
      .select();

    if (error) throw error;
    return data || [];
  }

  static async getPayslipsByRun(runId: string) {
    const { data, error } = await supabase
      .from('payroll_payslips')
      .select(`
        *,
        employee:payroll_employees(*)
      `)
      .eq('payroll_run_id', runId);

    if (error) throw error;
    return data || [];
  }

  static async getPayslipById(id: string) {
    const { data, error } = await supabase
      .from('payroll_payslips')
      .select(`
        *,
        employee:payroll_employees(*),
        payroll_run:payroll_runs(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getPayslipsByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('payroll_payslips')
      .select(`
        *,
        employee:payroll_employees(*),
        payroll_run:payroll_runs(*)
      `);

    if (error) throw error;

    return (data || []).filter((item: any) => item.employee?.tenant_id === tenantId);
  }

  // Benefits
  static async getBenefitsByEmployee(employeeId: string) {
    const { data, error } = await supabase
      .from('payroll_benefits')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createBenefit(benefit: {
    employee_id: string;
    type: string;
    cost_cents: number;
  }) {
    const { data, error } = await supabase
      .from('payroll_benefits')
      .insert(benefit)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteBenefit(id: string) {
    const { error } = await supabase
      .from('payroll_benefits')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // PTO Requests
  static async getPtoRequestsByTenant(tenantId: string) {
    const { data, error } = await supabase
      .from('payroll_pto_requests')
      .select(`
        *,
        employee:payroll_employees(*)
      `)
      .order('start_date', { ascending: false });

    if (error) throw error;

    return (data || []).filter((item: any) => item.employee?.tenant_id === tenantId);
  }

  static async createPtoRequest(request: {
    employee_id: string;
    start_date: string;
    end_date: string;
    status?: string;
  }) {
    const { data, error } = await supabase
      .from('payroll_pto_requests')
      .insert(request)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updatePtoRequestStatus(id: string, status: 'pending' | 'approved' | 'rejected') {
    const { data, error } = await supabase
      .from('payroll_pto_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
