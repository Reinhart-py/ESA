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
    storage_limit_bytes BIGINT DEFAULT 10737418240, -- 10 GB default
    country VARCHAR(10) DEFAULT 'US',
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
    content_hash VARCHAR(64),
    retention_until TIMESTAMP WITH TIME ZONE,
    is_legal_hold BOOLEAN DEFAULT FALSE,
    ocr_text TEXT,
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

-- 9b. Compliance Templates (recurring scheduling templates)
CREATE TABLE compliance_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100) NOT NULL CHECK (type IN ('GST', 'VAT', 'TDS', 'Corporate Tax', 'Payroll Tax', 'Company Return', 'License Renewal', 'Regulatory Filing', 'Audit')),
    frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('Monthly', 'Quarterly', 'Annually')),
    country_code VARCHAR(10) NOT NULL,
    month_offset INT DEFAULT 0,
    day_offset INT DEFAULT 15,
    compliance_score_impact INT DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9c. Compliance Alerts (deadlines escalations logs)
CREATE TABLE compliance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    obligation_id UUID REFERENCES compliance_obligations(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('Warning', 'Late', 'Escalation')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
ALTER TABLE compliance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY compliance_templates_read ON compliance_templates FOR SELECT USING (true);
CREATE POLICY compliance_templates_all ON compliance_templates FOR ALL USING (is_admin());
CREATE POLICY compliance_alerts_all ON compliance_alerts FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());

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

-- 7. Secure Shares (expiring guest access tokens)
CREATE TABLE secure_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    share_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. E-Sign Requests (cryptographic signatures)
CREATE TABLE esign_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    signer_email VARCHAR(255) NOT NULL,
    signature_hash VARCHAR(64), -- SHA-256 hash of signature detail
    signed_at TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Signed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS Enablement
ALTER TABLE secure_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE esign_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Secure shares are read-only for public access if token matches, otherwise matching tenant
CREATE POLICY secure_shares_read ON secure_shares FOR SELECT USING (true); -- Guests can read file if they possess token
CREATE POLICY secure_shares_all ON secure_shares FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());

-- E-sign requests isolated by tenant workspace
CREATE POLICY esign_requests_all ON esign_requests FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());

-- 9. Webhooks Configuration
CREATE TABLE webhooks_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    url VARCHAR(2048) NOT NULL,
    secret VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. API Keys
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    key_name VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(16) NOT NULL,
    hashed_key VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS Enablement
ALTER TABLE webhooks_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY webhooks_config_all ON webhooks_config FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY api_keys_all ON api_keys FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());


-- --- PHASE 7 MARKETPLACE & PROFESSIONAL TABLES ---

-- 1. Professional Profiles
CREATE TABLE professional_profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    hourly_rate_cents INT DEFAULT 0,
    specializations TEXT[] DEFAULT '{}',
    is_verified BOOLEAN DEFAULT FALSE,
    availability_status VARCHAR(50) DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'unavailable')),
    rating_average NUMERIC(3, 2) DEFAULT 5.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Service Requests
CREATE TABLE service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    budget_cents INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Quotations
CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_cents INT NOT NULL,
    proposal TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Contracts
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_cents INT NOT NULL,
    terms TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'completed')),
    client_signature VARCHAR(255),
    client_signed_at TIMESTAMP WITH TIME ZONE,
    professional_signature VARCHAR(255),
    professional_signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS Enablement
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Professional profiles can be read by anyone, managed by owner or admin
CREATE POLICY professional_profiles_select ON professional_profiles FOR SELECT USING (true);
CREATE POLICY professional_profiles_all ON professional_profiles FOR ALL USING (id = auth.uid() OR is_admin());

-- Service requests can be read by anyone (so professionals can search), managed by matching tenant or admin
CREATE POLICY service_requests_select ON service_requests FOR SELECT USING (true);
CREATE POLICY service_requests_all ON service_requests FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());

-- Quotations read by matching professional, client tenant, or admin
CREATE POLICY quotations_all ON quotations FOR ALL USING (
  professional_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM service_requests 
    WHERE service_requests.id = quotations.request_id 
    AND (service_requests.tenant_id = user_tenant_id())
  ) OR is_admin()
);

-- Contracts read/write by client tenant, professional, or admin
CREATE POLICY contracts_all ON contracts FOR ALL USING (
  tenant_id = user_tenant_id() OR professional_id = auth.uid() OR is_admin()
);


-- --- PHASE 11 AI ASSISTANT TABLES ---

-- 1. AI Chat Logs
CREATE TABLE ai_chat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_query TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS Enablement
ALTER TABLE ai_chat_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Isolated per tenant workspace
CREATE POLICY ai_chat_logs_all ON ai_chat_logs FOR ALL USING (
  tenant_id = user_tenant_id() OR is_admin()
);




-- --- PHASE 12: REAL REPORTING ENGINE + MESSAGING UPGRADES ---

-- Report History (stores generated financial reports per tenant)
CREATE TABLE IF NOT EXISTS report_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    report_type VARCHAR(100) NOT NULL CHECK (report_type IN ('profit_loss', 'balance_sheet', 'cash_flow', 'payroll', 'compliance', 'executive')),
    data JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_report_history_tenant ON report_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_history_type ON report_history(tenant_id, report_type);

ALTER TABLE report_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY report_history_all ON report_history FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());

-- Message Read Receipts (tracks when each user last read a thread)
CREATE TABLE IF NOT EXISTS message_read_receipts (
    thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (thread_id, user_id)
);

ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_receipts_all ON message_read_receipts FOR ALL USING (user_id = auth.uid() OR is_admin());

-- MFA (Multi-Factor Authentication / TOTP Setup)
CREATE TABLE IF NOT EXISTS user_mfa (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    secret VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    backup_codes TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE user_mfa ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_mfa_all ON user_mfa FOR ALL USING (user_id = auth.uid() OR is_admin());

-- 9. Saved Searches
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    query TEXT NOT NULL,
    filters JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY saved_searches_all ON saved_searches FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()) OR is_admin());

-- --- PHASE 13: CRM & PIPELINE TABLES ---

-- 1. CRM Accounts (Organizations/Companies)
CREATE TABLE IF NOT EXISTS crm_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    website VARCHAR(255),
    annual_revenue VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CRM Contacts (Stakeholders inside accounts)
CREATE TABLE IF NOT EXISTS crm_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_id UUID REFERENCES crm_accounts(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    job_title VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CRM Leads (Prospects before deal conversions)
CREATE TABLE IF NOT EXISTS crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'nurturing', 'lost')),
    source VARCHAR(100),
    lead_score INT DEFAULT 0,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, email)
);

-- 4. CRM Deals (Sales opportunities)
CREATE TABLE IF NOT EXISTS crm_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_id UUID REFERENCES crm_accounts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
    stage VARCHAR(50) DEFAULT 'qualification' CHECK (stage IN ('qualification', 'discovery', 'proposal', 'negotiation', 'won', 'lost')),
    probability INT DEFAULT 10 CHECK (probability >= 0 AND probability <= 100),
    closed_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. CRM Activities (Logged interactions)
CREATE TABLE IF NOT EXISTS crm_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('email', 'call', 'meeting', 'note', 'sms')),
    subject VARCHAR(255) NOT NULL,
    details TEXT,
    logged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for CRM Tables
ALTER TABLE crm_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY crm_accounts_all ON crm_accounts FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY crm_contacts_all ON crm_contacts FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY crm_leads_all ON crm_leads FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY crm_deals_all ON crm_deals FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY crm_activities_all ON crm_activities FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());

-- Performance Indexes
CREATE INDEX idx_crm_leads_tenant ON crm_leads(tenant_id);
CREATE INDEX idx_crm_deals_tenant ON crm_deals(tenant_id);
CREATE INDEX idx_crm_contacts_email ON crm_contacts(email);

-- 6. Invoicing and Payments
CREATE TABLE IF NOT EXISTS billing_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price_cents INT NOT NULL,
    sku VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing_tax_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    rate_percent DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    discount_percent INT NOT NULL CHECK (discount_percent BETWEEN 0 AND 100),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES billing_products(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price_cents INT NOT NULL,
    tax_rate_id UUID REFERENCES billing_tax_rates(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing_payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
    amount_cents INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing_dunning_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL,
    notification_sent BOOLEAN DEFAULT TRUE,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE billing_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_dunning_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY billing_products_all ON billing_products FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY billing_tax_rates_all ON billing_tax_rates FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY billing_coupons_all ON billing_coupons FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());

CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- 7. HR and Payroll System
CREATE TABLE IF NOT EXISTS payroll_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated')),
    role VARCHAR(100),
    tax_id VARCHAR(50),
    base_salary_cents INT NOT NULL CHECK (base_salary_cents >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, tax_id)
);

CREATE TABLE IF NOT EXISTS payroll_salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
    base_salary_cents INT NOT NULL CHECK (base_salary_cents >= 0),
    allowances_cents INT DEFAULT 0 CHECK (allowances_cents >= 0),
    deductions_cents INT DEFAULT 0 CHECK (deductions_cents >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll_timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours_worked DECIMAL(4,2) NOT NULL CHECK (hours_worked >= 0 AND hours_worked <= 24),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
    total_payout_cents INT NOT NULL CHECK (total_payout_cents >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll_payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
    base_salary_cents INT NOT NULL CHECK (base_salary_cents >= 0),
    allowances_cents INT DEFAULT 0 CHECK (allowances_cents >= 0),
    deductions_cents INT DEFAULT 0 CHECK (deductions_cents >= 0),
    net_pay_cents INT NOT NULL CHECK (net_pay_cents >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    cost_cents INT NOT NULL CHECK (cost_cents >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll_pto_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE payroll_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_pto_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY payroll_employees_all ON payroll_employees FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY payroll_timesheets_all ON payroll_timesheets FOR ALL USING (employee_id IN (SELECT id FROM payroll_employees WHERE tenant_id = user_tenant_id()) OR is_admin());
CREATE POLICY payroll_runs_all ON payroll_runs FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());

CREATE INDEX idx_payroll_employees_status ON payroll_employees(status);
CREATE INDEX idx_payroll_timesheets_emp_date ON payroll_timesheets(employee_id, date);

-- ====================================================
-- MODULE 7: HELPDESK & SUPPORT TICKETING SCHEMAS
-- ====================================================

CREATE TABLE IF NOT EXISTS support_sla_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    priority VARCHAR(50) NOT NULL,
    response_time_hours INT NOT NULL,
    resolution_time_hours INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_sla_breaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    breach_type VARCHAR(100) NOT NULL, -- 'response' or 'resolution'
    target_time TIMESTAMP WITH TIME ZONE NOT NULL,
    breached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_cstat_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    is_published BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS Enablement
ALTER TABLE support_sla_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_sla_breaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_cstat_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_knowledge_base ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY support_sla_rules_all ON support_sla_rules FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY support_categories_all ON support_categories FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY support_sla_breaches_all ON support_sla_breaches FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY support_cstat_ratings_all ON support_cstat_ratings FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY support_knowledge_base_all ON support_knowledge_base FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());

-- Indexes
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_agent_id);


-- ====================================================
-- MODULE 8: MULTI-TENANT TENANT ISOLATION & SUPER ADMIN
-- ====================================================

-- 1. Global System Telemetry (Metrics)
CREATE TABLE IF NOT EXISTS admin_global_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpu_usage NUMERIC(5, 2) NOT NULL,
    memory_usage_bytes BIGINT NOT NULL,
    request_count INT NOT NULL DEFAULT 0,
    error_count INT NOT NULL DEFAULT 0,
    latency_ms_avg INT NOT NULL DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Admin Impersonation Logs
CREATE TABLE IF NOT EXISTS admin_impersonation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    impersonated_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Admin Security Events Logs
CREATE TABLE IF NOT EXISTS admin_security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL, -- e.g., 'auth.failed_login', 'auth.mfa_bypass', 'data.rls_violation'
    severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    user_identity VARCHAR(255), -- email or username attempted
    ip_address VARCHAR(50),
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Global System Parameters / Constants
CREATE TABLE IF NOT EXISTS admin_system_parameters (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tenant Suspensions Tracking
CREATE TABLE IF NOT EXISTS admin_tenant_suspensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    suspended_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Database Migration Log History
CREATE TABLE IF NOT EXISTS admin_migration_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. IP Whitelists
CREATE TABLE IF NOT EXISTS admin_ip_whitelists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address VARCHAR(50) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance & Auditing Indexes
CREATE INDEX IF NOT EXISTS idx_admin_telemetry_time ON admin_global_telemetry(timestamp);
CREATE INDEX IF NOT EXISTS idx_admin_security_events_type ON admin_security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_admin_security_events_created ON admin_security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_suspensions_tenant ON admin_tenant_suspensions(tenant_id);

-- Enable RLS
ALTER TABLE admin_global_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_impersonation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_system_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_tenant_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_migration_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_ip_whitelists ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Limit access strictly to super_admin and admin roles)
CREATE POLICY admin_telemetry_all ON admin_global_telemetry FOR ALL USING (is_admin());
CREATE POLICY admin_impersonation_all ON admin_impersonation_logs FOR ALL USING (is_admin());
CREATE POLICY admin_security_events_all ON admin_security_events FOR ALL USING (is_admin());
CREATE POLICY admin_system_parameters_all ON admin_system_parameters FOR ALL USING (is_admin());
CREATE POLICY admin_tenant_suspensions_all ON admin_tenant_suspensions FOR ALL USING (is_admin());
CREATE POLICY admin_migration_history_all ON admin_migration_history FOR ALL USING (is_admin());
CREATE POLICY admin_ip_whitelists_all ON admin_ip_whitelists FOR ALL USING (is_admin());


-- ====================================================
-- MODULE 9: DEVELOPER PORTAL, API KEYS & WEBHOOKS
-- ====================================================

-- 1. Webhook Delivery Logs
CREATE TABLE IF NOT EXISTS developer_webhook_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    webhook_id UUID NOT NULL REFERENCES webhooks_config(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    response_status INT NOT NULL,
    response_body TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. API Rate Limits
CREATE TABLE IF NOT EXISTS developer_api_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    max_requests_per_minute INT NOT NULL DEFAULT 60 CHECK (max_requests_per_minute > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Webhook Events Queue (Buffer)
CREATE TABLE IF NOT EXISTS developer_webhook_events_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
    attempts INT DEFAULT 0,
    next_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. SDK Releases catalog
CREATE TABLE IF NOT EXISTS developer_sdk_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(50) NOT NULL,
    language VARCHAR(50) NOT NULL, -- 'Node', 'Python', 'Go', 'Ruby'
    download_url VARCHAR(2048) NOT NULL,
    released_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. API Documentation reference
CREATE TABLE IF NOT EXISTS developer_api_docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE')),
    description TEXT NOT NULL,
    request_schema JSONB DEFAULT '{}'::jsonb,
    response_schema JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_dev_webhook_logs_webhook ON developer_webhook_delivery_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_dev_webhook_logs_tenant ON developer_webhook_delivery_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dev_rate_limits_key ON developer_api_rate_limits(api_key_id);
CREATE INDEX IF NOT EXISTS idx_dev_queue_status_next ON developer_webhook_events_queue(status, next_attempt_at);

-- Enable RLS
ALTER TABLE developer_webhook_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_webhook_events_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_sdk_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_api_docs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY dev_webhook_logs_all ON developer_webhook_delivery_logs FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY dev_rate_limits_all ON developer_api_rate_limits FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY dev_webhook_queue_all ON developer_webhook_events_queue FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY dev_sdk_releases_read ON developer_sdk_releases FOR SELECT USING (true); -- Publicly viewable
CREATE POLICY dev_sdk_releases_all ON developer_sdk_releases FOR ALL USING (is_admin());
CREATE POLICY dev_api_docs_read ON developer_api_docs FOR SELECT USING (true); -- Publicly viewable
CREATE POLICY dev_api_docs_all ON developer_api_docs FOR ALL USING (is_admin());


-- ====================================================
-- MODULE 10: PLATFORM SECURITY & BASELINE AI
-- ====================================================

-- 1. Active User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 2. Security Incident Reports
CREATE TABLE IF NOT EXISTS security_incident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Document Embeddings (RAG search chunks mapping)
CREATE TABLE IF NOT EXISTS ai_document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    document_id UUID REFERENCES files(id) ON DELETE CASCADE,
    chunk_content TEXT NOT NULL,
    embedding NUMERIC[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Additional Audit Log Indices
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_identity);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_document_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY user_sessions_all ON user_sessions FOR ALL USING (user_id = auth.uid() OR is_admin());
CREATE POLICY security_incident_reports_all ON security_incident_reports FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());
CREATE POLICY ai_document_embeddings_all ON ai_document_embeddings FOR ALL USING (tenant_id = user_tenant_id() OR is_admin());




