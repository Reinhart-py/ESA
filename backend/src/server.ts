import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { requireAuth, requireRoles, AuthenticatedRequest } from './middleware/auth.js';
// Services & Engines
import { StorageService } from './services/storage.js';
import { EmailService } from './services/email.js';
import { ComplianceEngine } from './services/compliance.js';
import { ReportingEngine } from './services/reports.js';
import { TaskService } from './services/taskService.js';

// Repositories
import { TenantRepository } from './repositories/tenantRepository.js';
import { UserRepository } from './repositories/userRepository.js';
import { DocumentRepository } from './repositories/documentRepository.js';
import { ComplianceRepository } from './repositories/complianceRepository.js';
import { TaskRepository } from './repositories/taskRepository.js';
import { MessageRepository } from './repositories/messageRepository.js';
import { SupportRepository } from './repositories/supportRepository.js';
import { BillingRepository } from './repositories/billingRepository.js';
import { AuditRepository } from './repositories/auditRepository.js';
import { SearchRepository } from './repositories/searchRepository.js';
import { validateRequest } from './middleware/validate.js';
import { registerSchema, uploadDocumentSchema, createTaskSchema, sendMessageSchema, createTicketSchema, createInviteSchema, acceptInviteSchema, createAccountSchema, createJournalEntrySchema, createExpenseSchema, linkReceiptSchema } from './schemas/index.js';

import { BillingService } from './services/billing.js';
import { InviteService } from './services/inviteService.js';
import { LedgerRepository } from './repositories/ledgerRepository.js';
import { LedgerService } from './services/ledgerService.js';
import { ExpenseRepository } from './repositories/expenseRepository.js';

dotenv.config();

// STRICT ENVIRONMENT ENFORCEMENT (P1 ARCHITECTURE GAP REMEDIATION)
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GOOGLE_DRIVE_REFRESH_TOKEN',
  'GOOGLE_DRIVE_CLIENT_ID',
  'GOOGLE_DRIVE_CLIENT_SECRET',
  'RESEND_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`FATAL STARTUP ERROR: Environment variable "${envVar}" is missing.`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// Webhook requires raw payload for Stripe signature verification
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sigHeader = req.headers['stripe-signature'];
  const sig = Array.isArray(sigHeader) ? sigHeader[0] : (sigHeader || '');
  try {
    await BillingService.handleWebhookEvent(sig, req.body);
    res.json({ received: true });
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

app.use(express.json());

// Helper to record audit logs via repository pattern
const logActivity = async (req: AuthenticatedRequest, category: string, action: string, details: any = {}) => {
  const userId = req.user?.id || null;
  const userIdentity = req.user?.email || 'Anonymous';
  const tenantId = req.user?.tenant_id || null;
  const ipAddress = req.ip || req.socket.remoteAddress || null;

  try {
    await AuditRepository.createLog({
      tenant_id: tenantId,
      user_id: userId,
      user_identity: userIdentity,
      action,
      category,
      details,
      ip_address: ipAddress
    });
  } catch (err: any) {
    console.error('Failed to write audit log:', err.message);
  }
};

// Diagnostic Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    storageProvider: StorageService.getProviderName(),
    timestamp: new Date().toISOString()
  });
});

// --- AUTHENTICATION & USERS ---
app.post('/api/auth/register', validateRequest(registerSchema), async (req, res) => {
  const { email, fullName, businessName, businessType } = req.body;
  try {
    // 1. Create Tenant via TenantRepository
    const tenant = await TenantRepository.create({ name: businessName, business_type: businessType });

    // 2. Create profile map in public.users via UserRepository
    // Note: auth account itself is created by client SDK directly before profile sync
    res.status(201).json({ success: true, tenant, message: 'Tenant space generated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/invite', requireAuth, requireRoles(['super_admin', 'admin', 'client_owner']), validateRequest(createInviteSchema), async (req: AuthenticatedRequest, res) => {
  const { email, role } = req.body;
  const tenantId = req.user?.tenant_id || '';
  try {
    const invite = await InviteService.sendInvitation(tenantId, email, role);
    await logActivity(req, 'Auth', `Sent team invitation to ${email}`, { role });
    res.status(201).json(invite);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/invite/validate', async (req, res) => {
  const token = req.query.token as string;
  try {
    const invite = await InviteService.validateInvite(token);
    res.json(invite);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/invite/accept', validateRequest(acceptInviteSchema), async (req, res) => {
  const { token, userId, fullName } = req.body;
  try {
    const profile = await InviteService.acceptInvitation(token, userId, fullName);
    res.status(200).json({ success: true, profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- TENANTS & PORTALS ---
app.get('/api/tenants', requireAuth, requireRoles(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const data = await TenantRepository.getAll();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const data = await UserRepository.getByTenant(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- FILE / DOCUMENT MANAGEMENT ---
app.get('/api/documents', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const folders = await DocumentRepository.getFoldersByTenant(tenantId);
    const files = await DocumentRepository.getFilesByTenant(tenantId);
    res.json({ folders, files });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents/folder', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { name, parentId } = req.body;
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await DocumentRepository.createFolder({ tenant_id: tenantId, name, parent_id: parentId });
    await logActivity(req, 'Files', `Created folder: ${name}`, { folderId: data.id });
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents/upload', requireAuth, validateRequest(uploadDocumentSchema), async (req: AuthenticatedRequest, res) => {
  const { name, sizeBytes, category, mimeType, folderId, fileData } = req.body; // base64 encoded
  const tenantId = req.user?.tenant_id;
  const userId = req.user?.id;

  if (!tenantId || !userId) {
    return res.status(400).json({ error: 'Context tenant_id and user_id are required' });
  }

  try {
    const fileBuffer = Buffer.from(fileData, 'base64');
    const storageKey = await StorageService.uploadFile(name, mimeType, fileBuffer, tenantId, category);

    // Save to Database
    const data = await DocumentRepository.createFile({
      tenant_id: tenantId,
      folder_id: folderId || null,
      name,
      size_bytes: sizeBytes,
      category,
      uploaded_by: userId,
      storage_provider: StorageService.getProviderName(),
      storage_key: storageKey,
      mime_type: mimeType
    });

    await logActivity(req, 'Files', `Uploaded file: ${name}`, { fileId: data.id });
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/documents/file/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const fileId = req.params.id;
  const tenantId = req.user?.tenant_id || '';
  try {
    const file = await DocumentRepository.getFileById(fileId, tenantId);

    // Delete in storage provider
    await StorageService.deleteFile(file.storage_key);

    // Soft delete in database
    await DocumentRepository.softDeleteFile(fileId, tenantId);

    await logActivity(req, 'Files', `Deleted file: ${file.name}`, { fileId });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- COMPLIANCE ENGINE ---
app.get('/api/compliance/obligations', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const data = await ComplianceRepository.getObligationsByTenant(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/compliance/obligation', requireAuth, requireRoles(['super_admin', 'admin', 'accountant']), async (req: AuthenticatedRequest, res) => {
  const { title, dueDate, type, assignedSpecialistId, notes, complianceScoreImpact } = req.body;
  const tenantId = req.user?.tenant_id || '';

  try {
    const data = await ComplianceRepository.createObligation({
      tenant_id: tenantId,
      title,
      due_date: dueDate,
      type,
      assigned_specialist_id: assignedSpecialistId,
      notes,
      compliance_score_impact: complianceScoreImpact
    });
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/compliance/status', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { obligationId, status } = req.body;
  const tenantId = req.user?.tenant_id || '';
  try {
    const obligation = await ComplianceRepository.getObligationById(obligationId, tenantId);
    await ComplianceRepository.updateObligationStatus(obligationId, tenantId, status);

    if (status === 'Late') {
      await EmailService.sendDeadlineNotification(
        req.user?.email || '',
        'Authorized Workspace Representative',
        obligation.title,
        obligation.due_date
      );
    }

    await logActivity(req, 'Compliance', `Updated compliance status: ${obligation.title} to ${status}`, { obligationId });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dynamic calculations using ComplianceEngine
app.post('/api/compliance/calculate', requireAuth, (req: AuthenticatedRequest, res) => {
  const { type, referenceDate } = req.body;
  try {
    const ref = referenceDate ? new Date(referenceDate) : new Date();
    const nextDue = ComplianceEngine.getNextDueDate(type, ref);
    res.json({ type, nextDue: nextDue.toISOString().split('T')[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- DOUBLE-ENTRY LEDGER & FINANCE OS ---
app.get('/api/finance/accounts', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await LedgerRepository.getAccountsByTenant(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/finance/accounts', requireAuth, requireRoles(['super_admin', 'admin', 'senior_accountant', 'accountant']), validateRequest(createAccountSchema), async (req: AuthenticatedRequest, res) => {
  const { accountNumber, name, type, parentId } = req.body;
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await LedgerRepository.createAccount({
      tenant_id: tenantId,
      account_number: accountNumber,
      name,
      type,
      parent_id: parentId
    });
    await logActivity(req, 'Finance', `Created chart of account: ${accountNumber} - ${name}`);
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/finance/journal-entries', requireAuth, requireRoles(['super_admin', 'admin', 'senior_accountant', 'accountant']), validateRequest(createJournalEntrySchema), async (req: AuthenticatedRequest, res) => {
  const { date, description, lines } = req.body;
  const tenantId = req.user?.tenant_id || '';
  const userId = req.user?.id || '';
  try {
    const entryLines = lines.map((l: any) => ({
      account_id: l.accountId,
      entry_type: l.entryType,
      amount_cents: l.amountCents
    }));
    
    const data = await LedgerService.postJournalEntry({
      tenant_id: tenantId,
      date,
      description,
      created_by: userId
    }, entryLines);

    await logActivity(req, 'Finance', `Posted journal entry: ${description}`, { entryId: data.id });
    res.status(201).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/finance/ledger', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await LedgerRepository.getEntriesByTenant(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/finance/balance-sheet', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await LedgerService.getBalanceSheet(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/finance/trial-balance', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await LedgerService.getTrialBalance(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- EXPENSE & RECEIPT MANAGEMENT ---
app.get('/api/finance/expenses', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await ExpenseRepository.getExpensesByTenant(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/finance/expenses', requireAuth, validateRequest(createExpenseSchema), async (req: AuthenticatedRequest, res) => {
  const { accountId, amountCents, merchant, date, description, receiptFileId } = req.body;
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await ExpenseRepository.createExpense({
      tenant_id: tenantId,
      account_id: accountId,
      amount_cents: amountCents,
      merchant,
      date,
      description,
      receipt_file_id: receiptFileId
    });
    await logActivity(req, 'Finance', `Recorded expense: ${merchant} - $${(amountCents / 100).toFixed(2)}`, { expenseId: data.id });
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/finance/expenses/:id/receipt', requireAuth, validateRequest(linkReceiptSchema), async (req: AuthenticatedRequest, res) => {
  const expenseId = req.params.id;
  const { receiptFileId } = req.body;
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await ExpenseRepository.linkReceipt(expenseId, tenantId, receiptFileId);
    await logActivity(req, 'Finance', `Linked receipt to expense`, { expenseId, receiptFileId });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Server-side Report Compiler
app.get('/api/reports/pl', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const report = await ReportingEngine.compilePLStatement(tenantId);
    await logActivity(req, 'Reports', 'Compiled Profit & Loss financial forecast', { type: 'P&L' });
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CSV Export route
app.get('/api/reports/pl/export', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const report = await ReportingEngine.compilePLStatement(tenantId);
    const csvData = ReportingEngine.exportToCSV(report);
    
    await logActivity(req, 'Reports', 'Exported Profit & Loss statement to CSV format');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=PL_Report_${tenantId}.csv`);
    res.status(200).send(csvData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- TASK MANAGEMENT ---
app.get('/api/tasks', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const data = await TaskRepository.getTasksByTenant(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', requireAuth, validateRequest(createTaskSchema), async (req: AuthenticatedRequest, res) => {
  const { title, description, dueDate, priority, assignedTo } = req.body;
  const tenantId = req.user?.tenant_id || '';
  const userId = req.user?.id || '';

  try {
    const data = await TaskRepository.createTask({
      tenant_id: tenantId,
      title,
      description,
      due_date: dueDate,
      priority,
      assigned_to: assignedTo,
      created_by: userId
    });
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Task Comments Endpoints
app.get('/api/tasks/:id/comments', requireAuth, async (req: AuthenticatedRequest, res) => {
  const taskId = req.params.id;
  try {
    const data = await TaskRepository.getComments(taskId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks/:id/comments', requireAuth, async (req: AuthenticatedRequest, res) => {
  const taskId = req.params.id;
  const { content } = req.body;
  const userId = req.user?.id || '';
  try {
    const data = await TaskRepository.createComment({
      task_id: taskId,
      user_id: userId,
      content
    });
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Task Dependencies Endpoints
app.get('/api/tasks/:id/dependencies', requireAuth, async (req: AuthenticatedRequest, res) => {
  const taskId = req.params.id;
  try {
    const data = await TaskRepository.getDependencies(taskId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks/:id/dependencies', requireAuth, async (req: AuthenticatedRequest, res) => {
  const taskId = req.params.id;
  const { dependsOnId } = req.body;
  try {
    const data = await TaskService.linkDependency(taskId, dependsOnId);
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- MESSAGES / CONVERSATIONS ---
app.get('/api/messages', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const threads = await MessageRepository.getThreadsByTenant(tenantId);
    const threadIds = threads.map(t => t.id);
    const messages = await MessageRepository.getMessagesByThreads(threadIds);

    res.json({ threads, messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages/send', requireAuth, validateRequest(sendMessageSchema), async (req: AuthenticatedRequest, res) => {
  const { content, threadId } = req.body;
  const userId = req.user?.id || '';
  try {
    const data = await MessageRepository.createMessage({
      thread_id: threadId,
      sender_id: userId,
      content
    });
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- SUPPORT TICKETS ---
app.get('/api/support/tickets', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const data = await SupportRepository.getTicketsByTenant(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/support/ticket', requireAuth, validateRequest(createTicketSchema), async (req: AuthenticatedRequest, res) => {
  const { subject, description, category, priority } = req.body;
  const tenantId = req.user?.tenant_id || '';
  const userId = req.user?.id || '';
  try {
    const data = await SupportRepository.createTicket({
      tenant_id: tenantId,
      subject,
      description,
      category,
      priority,
      created_by: userId
    });
    await logActivity(req, 'Support', `Created support ticket: ${subject}`, { ticketId: data.id });
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- AUDIT TRAIL ---
app.get('/api/audit-logs', requireAuth, requireRoles(['super_admin', 'admin', 'auditor']), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const data = await AuditRepository.getLogsByTenant(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- BILLING & SUBSCRIPTIONS ---
app.get('/api/billing/subscription', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const data = await BillingRepository.getSubscriptionByTenant(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/billing/invoices', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const data = await BillingRepository.getInvoicesByTenant(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/billing/session', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { priceId, successUrl, cancelUrl } = req.body;
  const tenantId = req.user?.tenant_id || '';

  try {
    const checkoutUrl = await BillingService.createCheckoutSession(tenantId, priceId, successUrl, cancelUrl);
    await logActivity(req, 'Billing', 'Created Stripe checkout billing checkout session', { priceId });
    res.json({ checkoutUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- GLOBAL SEARCH ---
app.get('/api/search', requireAuth, async (req: AuthenticatedRequest, res) => {
  const query = (req.query.q as string) || '';
  const tenantId = req.user?.tenant_id || '';

  try {
    const results = await SearchRepository.searchAll(tenantId, query);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- SYSTEM INITIALIZER BOOTSTRAP ---
app.listen(PORT, () => {
  console.log(`EAC Solutions server running on http://localhost:${PORT}`);
});
