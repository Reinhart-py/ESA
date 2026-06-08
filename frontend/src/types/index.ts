export interface Tenant {
  id: string;
  name: string;
  business_type: string;
  revenue_bracket?: string;
  compliance_score: number;
  storage_used_bytes: number;
  created_at: string;
}

export interface User {
  id: string;
  tenant_id: string | null;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'accountant' | 'senior_accountant' | 'tax_specialist' | 'compliance_officer' | 'payroll_specialist' | 'client_owner' | 'client_staff' | 'support_agent' | 'auditor';
  phone?: string;
  avatar_url?: string;
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
}

export interface Folder {
  id: string;
  tenant_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

export interface FileDocument {
  id: string;
  tenant_id: string;
  folder_id: string | null;
  name: string;
  size_bytes: number;
  category: string;
  uploaded_by: string | null;
  status: 'Reviewing' | 'Approved' | 'Rejected';
  version: number;
  storage_provider: 'google_drive' | 'cloudflare_r2' | 'aws_s3';
  storage_key: string;
  storage_bucket?: string;
  mime_type?: string;
  tags: string[];
  is_deleted: boolean;
  created_at: string;
}

export interface ComplianceObligation {
  id: string;
  tenant_id: string;
  title: string;
  due_date: string;
  status: 'On Track' | 'Late' | 'Needs Review' | 'Filed';
  type: 'GST' | 'VAT' | 'TDS' | 'Corporate Tax' | 'Payroll Tax' | 'Company Return' | 'License Renewal' | 'Regulatory Filing' | 'Audit';
  assigned_specialist_id: string | null;
  notes?: string;
  compliance_score_impact: number;
  created_at: string;
}

export interface Task {
  id: string;
  tenant_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Todo' | 'In Progress' | 'In Review' | 'Done' | 'Blocked';
  assigned_to?: string;
  created_by?: string;
  parent_task_id?: string;
  recurring_pattern?: string;
  created_at: string;
}

export interface MessageThread {
  id: string;
  tenant_id: string;
  subject?: string;
  created_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id?: string;
  content: string;
  attachment_file_ids: string[];
  created_at: string;
}

export interface SupportTicket {
  id: string;
  tenant_id: string;
  subject: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assigned_agent_id?: string;
  created_by?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id?: string;
  user_id?: string;
  user_identity: string;
  action: string;
  category: string;
  details: any;
  ip_address?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan_id?: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  stripe_subscription_id?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  amount_cents: number;
  currency: string;
  status: 'paid' | 'unpaid' | 'voided';
  due_date: string;
  pdf_url?: string;
  stripe_invoice_id?: string;
  created_at: string;
}
