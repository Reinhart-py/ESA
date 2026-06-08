-- Database Schema for EAC Solutions Platform (Supabase PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Billing Plans
CREATE TABLE billing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    price_cents INT NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    features JSONB DEFAULT '{}'::jsonb,
    storage_limit_bytes BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tenants (Businesses)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    revenue_bracket VARCHAR(100),
    compliance_score INT DEFAULT 100,
    storage_used_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Users (Supabase Auth reference)
CREATE TABLE users (
    id UUID PRIMARY KEY, -- Maps to auth.users.id
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'super_admin', 'admin', 'accountant', 'senior_accountant', 
        'tax_specialist', 'compliance_officer', 'payroll_specialist', 
        'client_owner', 'client_staff', 'support_agent', 'auditor'
    )),
    phone VARCHAR(50),
    avatar_url TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES billing_plans(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    amount_cents INT NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL CHECK (status IN ('paid', 'unpaid', 'voided')),
    due_date DATE NOT NULL,
    pdf_url TEXT,
    stripe_invoice_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Document Folders
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Document Files
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Reviewing' CHECK (status IN ('Reviewing', 'Approved', 'Rejected')),
    version INT DEFAULT 1,
    storage_provider VARCHAR(50) DEFAULT 'google_drive' CHECK (storage_provider IN ('google_drive', 'cloudflare_r2', 'aws_s3')),
    storage_key TEXT NOT NULL, -- File ID in Google Drive or Object Key in R2/S3
    storage_bucket VARCHAR(255),
    mime_type VARCHAR(255),
    tags TEXT[] DEFAULT '{}',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. File Versions
CREATE TABLE file_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    version INT NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_key TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Compliance Obligations
CREATE TABLE compliance_obligations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'On Track' CHECK (status IN ('On Track', 'Late', 'Needs Review', 'Filed')),
    type VARCHAR(100) NOT NULL CHECK (type IN ('GST', 'VAT', 'TDS', 'Corporate Tax', 'Payroll Tax', 'Company Return', 'License Renewal', 'Regulatory Filing', 'Audit')),
    assigned_specialist_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    compliance_score_impact INT DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Compliance Audits
CREATE TABLE compliance_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    obligation_id UUID REFERENCES compliance_obligations(id) ON DELETE CASCADE,
    audited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    audit_date DATE DEFAULT CURRENT_DATE,
    result VARCHAR(50) NOT NULL CHECK (result IN ('Pass', 'Fail', 'Conditional')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    priority VARCHAR(50) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status VARCHAR(50) DEFAULT 'Todo' CHECK (status IN ('Todo', 'In Progress', 'In Review', 'Done', 'Blocked')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    recurring_pattern VARCHAR(100), -- e.g., 'monthly', 'weekly'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Task Comments
CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Task Dependencies
CREATE TABLE task_dependencies (
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, depends_on_task_id)
);

-- 14. Message Threads
CREATE TABLE message_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subject VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Message Participants
CREATE TABLE message_participants (
    thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (thread_id, user_id)
);

-- 16. Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    attachment_file_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Support Tickets
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority VARCHAR(50) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. Support Comments
CREATE TABLE support_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_identity VARCHAR(255) NOT NULL,
    action TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(100) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- INDEXES FOR PERFORMANCE AND TENANT ISOLATION
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_folders_tenant ON folders(tenant_id);
CREATE INDEX idx_files_tenant ON files(tenant_id);
CREATE INDEX idx_compliance_tenant ON compliance_obligations(tenant_id);
CREATE INDEX idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX idx_threads_tenant ON message_threads(tenant_id);
CREATE INDEX idx_tickets_tenant ON support_tickets(tenant_id);
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);


-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the current user is a platform admin/super-admin
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- General policy helper: matching tenant_id
CREATE OR REPLACE FUNCTION user_tenant_id() 
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT tenant_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS POLICIES FOR TABLES
CREATE POLICY tenant_select ON tenants FOR SELECT USING (id = user_tenant_id() OR is_admin());
CREATE POLICY user_select ON users FOR SELECT USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY user_modify ON users FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());

-- Files & Folders
CREATE POLICY folder_all ON folders FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY file_all ON files FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());

-- Compliance
CREATE POLICY compliance_all ON compliance_obligations FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());

-- Tasks
CREATE POLICY task_all ON tasks FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());

-- Messaging & Support
CREATE POLICY thread_all ON message_threads FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY msg_all ON messages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM message_threads 
    WHERE message_threads.id = messages.thread_id 
    AND (message_threads.tenant_id = user_tenant_id() OR is_admin())
  )
);
CREATE POLICY ticket_all ON support_tickets FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());

-- Audit Logs
CREATE POLICY audit_select ON audit_logs FOR SELECT USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY audit_insert ON audit_logs FOR INSERT WITH CHECK (tenant_id = user_tenant_id() OR is_admin());


-- AUTOMATIC PROFILE SYNC TRIGGER FOR SUPABASE AUTH
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Resolve or auto-initialize a default tenant workspace
  SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;
  IF v_tenant_id IS NULL THEN
    INSERT INTO public.tenants (name, business_type)
    VALUES ('EAC Solutions Starter workspace', 'General Professional')
    RETURNING id INTO v_tenant_id;
  END IF;

  INSERT INTO public.users (id, tenant_id, email, full_name, role, status)
  VALUES (
    new.id,
    v_tenant_id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New Member'),
    'client_owner',
    'active'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- --- PHASE 1 COMPLIANCE OS TABLES ---

-- 1. Company Profiles
CREATE TABLE company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    legal_address TEXT,
    incorporation_date DATE,
    country VARCHAR(100) DEFAULT 'US',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. User/Member Invitations
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. KYC Verification logs
CREATE TABLE kyc_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    document_status VARCHAR(50) DEFAULT 'pending' CHECK (document_status IN ('pending', 'verified', 'rejected')),
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row Level Security policies
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_profile_all ON company_profiles FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY invitations_all ON invitations FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY kyc_all ON kyc_verifications FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());


-- --- PHASE 2 DOUBLE-ENTRY ACCOUNTING TABLES ---

-- 1. Chart of Accounts
CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_number VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    parent_id UUID REFERENCES chart_of_accounts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, account_number)
);

-- 2. Ledger Entries (Transactions)
CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Journal Lines (Transaction Lines)
CREATE TABLE journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entry_id UUID NOT NULL REFERENCES ledger_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('debit', 'credit')),
    amount_cents INT NOT NULL CHECK (amount_cents > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Expenses (linking files/receipts to COA)
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
    amount_cents INT NOT NULL,
    merchant VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    receipt_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS Enablement
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY coa_all ON chart_of_accounts FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY ledger_all ON ledger_entries FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY journal_all ON journal_lines FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY expenses_all ON expenses FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());

-- 5. Compliance Packs
CREATE TABLE compliance_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    authority VARCHAR(100) NOT NULL,
    description TEXT,
    rules JSONB DEFAULT '[]'::jsonb, -- e.g., [{ "title": "Corporate Tax Filing", "due_month": 3, "due_day": 15, "type": "Corporate Tax" }]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Filing Submissions
CREATE TABLE filing_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    obligation_id UUID NOT NULL REFERENCES compliance_obligations(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Under Review', 'Approved', 'Rejected', 'Filed')),
    evidence_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    comments TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS Enablement
ALTER TABLE compliance_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE filing_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Compliance packs are read-only for all authenticated users, writable by admin/super_admin
CREATE POLICY compliance_packs_read ON compliance_packs FOR SELECT USING (true);
CREATE POLICY compliance_packs_all ON compliance_packs FOR ALL USING (is_admin());

-- Filing submissions are segregated by tenant
CREATE POLICY filing_submissions_all ON filing_submissions FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());


