import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireRoles, AuthenticatedRequest } from './middleware/auth.js';
import { supabase } from './config/supabase.js';
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
import { registerSchema, uploadDocumentSchema, createTaskSchema, sendMessageSchema, createTicketSchema, createInviteSchema, acceptInviteSchema, createAccountSchema, createJournalEntrySchema, createExpenseSchema, linkReceiptSchema, createCompliancePackSchema, subscribePackSchema, submitEvidenceSchema, reviewSubmissionSchema, shareDocumentSchema, createESignRequestSchema, esignDocumentSchema, bulkDownloadSchema, createApiKeySchema, createWebhookConfigSchema, onboardProfessionalSchema, createServiceRequestSchema, createQuoteSchema, signContractSchema } from './schemas/index.js';

import { BillingService } from './services/billing.js';
import { InviteService } from './services/inviteService.js';
import { ProfessionalRepository } from './repositories/professionalRepository.js';
import { MarketplaceRepository } from './repositories/marketplaceRepository.js';
import { MarketplaceService } from './services/marketplaceService.js';
import { OcrService } from './services/ocrService.js';
import crypto from 'crypto';
import { getPagination, buildPaginatedResult } from './utils/pagination.js';
import { LedgerRepository } from './repositories/ledgerRepository.js';
import { LedgerService } from './services/ledgerService.js';
import { ExpenseRepository } from './repositories/expenseRepository.js';
import { ComplianceFilingRepository } from './repositories/complianceFilingRepository.js';
import { ComplianceFilingService } from './services/complianceFilingService.js';
import { DocumentProRepository } from './repositories/documentProRepository.js';
import { DocumentProService } from './services/documentProService.js';
import { DeveloperRepository } from './repositories/developerRepository.js';
import { DeveloperService } from './services/developerService.js';
import { ComplianceSchedulerService } from './services/complianceScheduler.js';
import { AdminService } from './services/adminService.js';
import { AiService } from './services/aiService.js';

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

const missingVars: string[] = [];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    missingVars.push(envVar);
  }
}

if (missingVars.length > 0) {
  if (process.env.NODE_ENV === 'production') {
    console.error(`FATAL STARTUP ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  } else {
    console.warn(`[DEV WARNING] Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('[DEV WARNING] API endpoints requiring these services will return errors. Configure .env to enable full functionality.');
  }
}


const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

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

app.use(express.json({ limit: '10mb' }));

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
app.get('/api/tenants', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const data = await TenantRepository.getAll();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/switch-tenant', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { tenantId } = req.body;
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }
    const { data, error } = await supabase
      .from('users')
      .update({ tenant_id: tenantId })
      .eq('id', req.user?.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, user: data });
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

  // File size check (Max 50MB)
  if (sizeBytes > 50 * 1024 * 1024) {
    return res.status(400).json({ error: 'File size exceeds maximum permitted limit (50MB).' });
  }

  // MIME type whitelist validation
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/octet-stream'
  ];

  if (!allowedMimeTypes.includes(mimeType)) {
    return res.status(400).json({ error: `File type '${mimeType}' is not allowed. Supported types: PDF, DOCX, XLSX, CSV, TXT, PNG, JPEG, WEBP.` });
  }

  try {
    const fileBuffer = Buffer.from(fileData, 'base64');
    const contentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Duplicate check
    const duplicate = await DocumentRepository.checkDuplicateHash(tenantId, contentHash);
    if (duplicate) {
      return res.status(409).json({
        error: 'Duplicate file detected',
        message: `A file named "${duplicate.name}" with the identical content already exists in this workspace.`
      });
    }

    const storageKey = await StorageService.uploadFile(name, mimeType, fileBuffer, tenantId, category);
    
    // OCR & Auto Classification
    const { ocrText, suggestedCategory } = await OcrService.extractTextAndClassify(name, fileData);

    // Save to Database
    const data = await DocumentRepository.createFile({
      tenant_id: tenantId,
      folder_id: folderId || null,
      name,
      size_bytes: sizeBytes,
      category: category || suggestedCategory,
      uploaded_by: userId,
      storage_provider: StorageService.getProviderName(),
      storage_key: storageKey,
      mime_type: mimeType,
      content_hash: contentHash,
      ocr_text: ocrText
    });

    await logActivity(req, 'Files', `Uploaded file: ${name}`, { fileId: data.id });
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/documents/trash', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const files = await DocumentRepository.getDeletedFilesByTenant(tenantId);
    res.json(files);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents/file/:id/restore', requireAuth, async (req: AuthenticatedRequest, res) => {
  const fileId = req.params.id;
  const tenantId = req.user?.tenant_id || '';
  try {
    const file = await DocumentRepository.restoreFile(fileId, tenantId);
    await logActivity(req, 'Files', `Restored file from trash: ${file.name}`, { fileId });
    res.json(file);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents/file/:id/retention', requireAuth, async (req: AuthenticatedRequest, res) => {
  const fileId = req.params.id;
  const tenantId = req.user?.tenant_id || '';
  const { retentionUntil, isLegalHold } = req.body;
  try {
    const file = await DocumentRepository.updateFileRetention(fileId, tenantId, retentionUntil || null, !!isLegalHold);
    await logActivity(req, 'Files', `Updated retention configuration for file: ${file.name}`, { fileId, retentionUntil, isLegalHold });
    res.json(file);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/documents/file/:id/url', requireAuth, async (req: AuthenticatedRequest, res) => {
  const fileId = req.params.id;
  const tenantId = req.user?.tenant_id || '';
  try {
    const file = await DocumentRepository.getFileById(fileId, tenantId);
    const url = await StorageService.getDownloadUrl(file.storage_key);
    res.json({
      url,
      name: file.name,
      mime_type: file.mime_type,
      ocr_text: file.ocr_text,
      is_legal_hold: file.is_legal_hold,
      retention_until: file.retention_until
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/documents/search-content', requireAuth, async (req: AuthenticatedRequest, res) => {
  const query = (req.query.q as string) || '';
  const tenantId = req.user?.tenant_id || '';
  try {
    const results = await DocumentRepository.searchFilesByOcrText(tenantId, query);
    res.json(results);
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

// --- DOCUMENT VAULT PRO: SHARING, SIGNING & ZIP STREAMING ---
app.post('/api/documents/share', requireAuth, validateRequest(shareDocumentSchema), async (req: AuthenticatedRequest, res) => {
  const { fileId, expiresInHours } = req.body;
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await DocumentProService.generateSecureShare(tenantId, fileId, expiresInHours);
    await logActivity(req, 'Files', `Generated secure share link for file`, { fileId, shareToken: data.share_token });
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/documents/share/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const share = await DocumentProService.validateShareToken(token);
    const downloadUrl = await StorageService.getDownloadUrl(share.file.storage_key);
    res.json({
      share,
      downloadUrl
    });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/documents/esign', requireAuth, validateRequest(createESignRequestSchema), async (req: AuthenticatedRequest, res) => {
  const { fileId, signerEmail } = req.body;
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await DocumentProRepository.createESignRequest({
      tenant_id: tenantId,
      file_id: fileId,
      signer_email: signerEmail
    });
    await logActivity(req, 'Files', `Created e-sign request for email: ${signerEmail}`, { esignRequestId: data.id, fileId });
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/documents/esign', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await DocumentProRepository.getESignRequestsByTenant(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents/esign/:id/sign', requireAuth, validateRequest(esignDocumentSchema), async (req: AuthenticatedRequest, res) => {
  const esignRequestId = req.params.id;
  const { signatureText } = req.body;
  const tenantId = req.user?.tenant_id || '';
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  try {
    const data = await DocumentProService.esignDocument(esignRequestId, tenantId, ipAddress, signatureText);
    await logActivity(req, 'Files', `Recorded document e-signature cryptographic hash`, { esignRequestId, hash: data.signature_hash });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/documents/bulk-download', requireAuth, validateRequest(bulkDownloadSchema), async (req: AuthenticatedRequest, res) => {
  const fileIdsQuery = req.query.fileIds as string;
  const fileIds = fileIdsQuery.split(',');
  const tenantId = req.user?.tenant_id || '';

  try {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=EAC_Vault_Bulk_${Date.now()}.zip`);
    
    const zipStream = await DocumentProService.packageBulkZip(fileIds, tenantId);
    
    // Pipe the zip stream directly to the response
    zipStream.pipe(res);
    
    await logActivity(req, 'Files', `Bulk downloaded ${fileIds.length} files as ZIP archive`);
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
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

app.get('/api/compliance/score', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const score = await ComplianceRepository.calculateComplianceScore(tenantId);
    res.json({ score });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/compliance/tenant-country', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  const { country } = req.body;
  if (!country) {
    return res.status(400).json({ error: 'Country code is required' });
  }
  try {
    const { data, error } = await supabase
      .from('tenants')
      .update({ country })
      .eq('id', tenantId)
      .select()
      .single();

    if (error) throw error;
    
    // Automatically trigger scheduler sweep for the updated country pack
    await ComplianceSchedulerService.runGlobalSweep();

    await logActivity(req, 'Compliance', `Updated workspace country pack to: ${country}`);
    res.json({ success: true, tenant: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/compliance/scheduler/run', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const summary = await ComplianceSchedulerService.runGlobalSweep();
    await logActivity(req, 'Compliance', 'Manually executed compliance scheduler engine sweep');
    res.json({ success: true, summary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/compliance/alerts', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const alerts = await ComplianceRepository.getAlertsByTenant(tenantId);
    res.json(alerts);
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

// --- REGIONAL COMPLIANCE & FILING WORKFLOWS ---
app.get('/api/compliance/packs', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const data = await ComplianceFilingRepository.getCompliancePacks();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/compliance/packs', requireAuth, requireRoles(['super_admin', 'admin']), validateRequest(createCompliancePackSchema), async (req: AuthenticatedRequest, res) => {
  const { name, countryCode, authority, description, rules } = req.body;
  try {
    const data = await ComplianceFilingRepository.createCompliancePack({
      name,
      country_code: countryCode,
      authority,
      description,
      rules
    });
    await logActivity(req, 'Compliance', `Created regional compliance pack: ${name}`);
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/compliance/packs/subscribe', requireAuth, validateRequest(subscribePackSchema), async (req: AuthenticatedRequest, res) => {
  const { packId } = req.body;
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await ComplianceFilingService.subscribeToPack(tenantId, packId);
    await logActivity(req, 'Compliance', `Subscribed workspace to compliance pack`, { packId });
    res.status(200).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/compliance/submissions', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await ComplianceFilingRepository.getFilingSubmissions(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/compliance/submissions/:id/submit', requireAuth, validateRequest(submitEvidenceSchema), async (req: AuthenticatedRequest, res) => {
  const submissionId = req.params.id;
  const { evidenceFileId, comments } = req.body;
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await ComplianceFilingService.submitEvidence(tenantId, submissionId, evidenceFileId, comments);
    await logActivity(req, 'Compliance', `Submitted evidence for compliance obligation`, { submissionId, evidenceFileId });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/compliance/submissions/:id/review', requireAuth, requireRoles(['super_admin', 'admin', 'senior_accountant', 'accountant', 'auditor']), validateRequest(reviewSubmissionSchema), async (req: AuthenticatedRequest, res) => {
  const submissionId = req.params.id;
  const { action, comments } = req.body;
  const tenantId = req.user?.tenant_id || '';
  const userId = req.user?.id || '';
  try {
    const data = await ComplianceFilingService.reviewSubmission(tenantId, submissionId, userId, action, comments);
    await logActivity(req, 'Compliance', `Reviewed filing submission: ${action}`, { submissionId, action });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- ENTERPRISE DEVELOPER CONFIGS & WEBHOOKS ---
app.get('/api/developer/keys', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await DeveloperRepository.getApiKeysByTenant(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/developer/keys', requireAuth, validateRequest(createApiKeySchema), async (req: AuthenticatedRequest, res) => {
  const { keyName, expiresInDays } = req.body;
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await DeveloperService.generateApiKey(tenantId, keyName, expiresInDays);
    await logActivity(req, 'Developer', `Created developer API key: ${keyName}`);
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/developer/keys/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const keyId = req.params.id;
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await DeveloperRepository.deleteApiKey(keyId, tenantId);
    await logActivity(req, 'Developer', `Revoked developer API key`, { keyId });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/developer/webhooks', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await DeveloperRepository.getWebhookConfigsByTenant(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/developer/webhooks', requireAuth, validateRequest(createWebhookConfigSchema), async (req: AuthenticatedRequest, res) => {
  const { url, secret } = req.body;
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await DeveloperRepository.createWebhookConfig({
      tenant_id: tenantId,
      url,
      secret
    });
    await logActivity(req, 'Developer', `Added webhook endpoint: ${url}`);
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/developer/webhooks/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const hookId = req.params.id;
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await DeveloperRepository.deleteWebhookConfig(hookId, tenantId);
    await logActivity(req, 'Developer', `Deleted webhook configuration`, { hookId });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- ENTERPRISE ANALYTICS & METRICS ---
app.get('/api/analytics/metrics', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    // 1. Storage limit and used bytes
    const tenant = await TenantRepository.getById(tenantId);
    
    // 2. Active obligations
    const obligations = await ComplianceRepository.getObligationsByTenant(tenantId);
    
    // 3. Active tasks
    const tasks = await TaskRepository.getTasksByTenant(tenantId);
    const incompleteTasksCount = tasks.filter((t: any) => t.status !== 'Done').length;
    
    // 4. MRR Estimate from Subscription
    const subscription = await BillingRepository.getSubscriptionByTenant(tenantId);
    let mrrCents = 0;
    if (subscription && subscription.status === 'active' && subscription.billing_plans) {
      mrrCents = subscription.billing_plans.price_cents;
    }

    // 5. Recent audit logs
    const logs = await AuditRepository.getLogsByTenant(tenantId);
    const recentLogs = logs.slice(0, 10);

    res.json({
      storageUsedBytes: tenant?.storage_used_bytes || 0,
      storageLimitBytes: 10 * 1024 * 1024 * 1024, // 10 GB default fallback limit
      activeObligationsCount: obligations.length,
      activeTasksCount: incompleteTasksCount,
      mrrEstimateCents: mrrCents,
      recentLogs
    });
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

// --- SUPER ADMIN OPERATION GATEWAYS ---
app.get('/api/admin/metrics', requireAuth, requireRoles(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const metrics = await AdminService.getAdminMetrics();
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/invoices', requireAuth, requireRoles(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, tenants(name)');
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/professionals/pending', requireAuth, requireRoles(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const pending = await AdminService.getPendingProfessionals();
    res.json(pending);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/professionals/:id/verify', requireAuth, requireRoles(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  const userId = req.params.id;
  const { isVerified } = req.body;
  try {
    const data = await AdminService.verifyProfessional(userId, !!isVerified);
    await logActivity(req, 'Admin', `${isVerified ? 'Approved' : 'Revoked'} professional profile credentials`, { userId });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/tenants/:id/quota', requireAuth, requireRoles(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  const tenantId = req.params.id;
  const { quotaBytes } = req.body;
  if (quotaBytes === undefined) {
    return res.status(400).json({ error: 'quotaBytes is required' });
  }
  try {
    const data = await AdminService.updateTenantQuota(tenantId, Number(quotaBytes));
    await logActivity(req, 'Admin', `Updated custom storage quota for tenant workspace`, { tenantId, quotaBytes });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- AI ASSISTANT & CO-PILOT SERVICES ---
app.post('/api/ai/chat', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { query } = req.body;
  const tenantId = req.user?.tenant_id || '';
  const userId = req.user?.id || '';
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }
  try {
    const reply = await AiService.processChatQuery(tenantId, userId, query);
    res.json({ reply });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ai/chat/history', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const history = await AiService.getChatHistory(tenantId);
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- TASK MANAGEMENT ---
app.get('/api/tasks', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const { page: pageVal, limit: limitVal } = req.query;

    if (pageVal || limitVal) {
      const { page, limit, offset } = getPagination(pageVal as string, limitVal as string);
      const { data, total } = await TaskRepository.getTasksByTenantPaginated(tenantId, offset, limit);
      res.json(buildPaginatedResult(data, total, page, limit));
    } else {
      const data = await TaskRepository.getTasksByTenant(tenantId);
      res.json(data);
    }
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

app.patch('/api/tasks/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const taskId = req.params.id;
  const tenantId = req.user?.tenant_id || '';
  const updates = req.body;

  try {
    const data = await TaskRepository.updateTask(taskId, tenantId, updates);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const taskId = req.params.id;
  const tenantId = req.user?.tenant_id || '';

  try {
    await TaskRepository.deleteTask(taskId, tenantId);
    res.status(204).end();
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

// --- MESSAGES / CONVERSATIONS (Legacy) ---
// Note: Phase 12 exposes /api/messages/threads and /api/messages/threads/:id/messages
app.get('/api/messages', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const threads = await MessageRepository.getThreadsByTenant(tenantId);
    res.json({ threads, messages: [] }); // messages now fetched per-thread
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
app.get('/api/billing/plans', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('billing_plans')
      .select('*')
      .order('price_cents', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

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

// --- PROFESSIONAL ONBOARDING & VERIFICATION ---
app.post('/api/onboarding/professional', requireAuth, validateRequest(onboardProfessionalSchema), async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id || '';
  const { bio, hourlyRateCents, specializations } = req.body;
  try {
    const profile = await ProfessionalRepository.upsertProfile({
      id: userId,
      bio,
      hourly_rate_cents: hourlyRateCents,
      specializations,
      is_verified: false,
      availability_status: 'available'
    });
    await logActivity(req, 'Verification', 'Registered professional profile', { userId });
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/marketplace/professionals', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const pros = await ProfessionalRepository.listVerified();
    res.json(pros);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- SERVICE REQUESTS ---
app.post('/api/marketplace/requests', requireAuth, validateRequest(createServiceRequestSchema), async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  const { title, description, category, budgetCents } = req.body;
  try {
    const request = await MarketplaceService.postServiceRequest(tenantId, title, description, category, budgetCents);
    await logActivity(req, 'Marketplace', 'Posted new service request', { requestId: request.id });
    res.json(request);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/marketplace/requests', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const requests = await MarketplaceRepository.listRequests();
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- QUOTATIONS ---
app.post('/api/marketplace/requests/:id/quotes', requireAuth, validateRequest(createQuoteSchema), async (req: AuthenticatedRequest, res) => {
  const requestId = req.params.id;
  const proId = req.user?.id || '';
  const { amountCents, proposal } = req.body;
  try {
    const quote = await MarketplaceService.submitQuotation(requestId, proId, amountCents, proposal);
    await logActivity(req, 'Marketplace', 'Submitted quotation bid', { quoteId: quote.id, requestId });
    res.json(quote);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/marketplace/requests/:id/quotes', requireAuth, async (req: AuthenticatedRequest, res) => {
  const requestId = req.params.id;
  try {
    const quotes = await MarketplaceRepository.getQuotesForRequest(requestId);
    res.json(quotes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/marketplace/quotes/:id/accept', requireAuth, async (req: AuthenticatedRequest, res) => {
  const quoteId = req.params.id;
  const tenantId = req.user?.tenant_id || '';
  try {
    const contract = await MarketplaceService.acceptQuotation(quoteId, tenantId);
    await logActivity(req, 'Marketplace', 'Accepted quotation and generated service contract', { quoteId, contractId: contract.id });
    res.json(contract);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- CONTRACTS ---
app.get('/api/marketplace/contracts', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id || '';
  const tenantId = req.user?.tenant_id || '';
  const role = req.user?.role || '';
  try {
    if (['accountant', 'senior_accountant', 'tax_specialist', 'compliance_officer', 'payroll_specialist'].includes(role)) {
      const contracts = await MarketplaceRepository.listContractsForProfessional(userId);
      res.json(contracts);
    } else {
      const contracts = await MarketplaceRepository.listContractsForTenant(tenantId);
      res.json(contracts);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/marketplace/contracts/:id/sign', requireAuth, validateRequest(signContractSchema), async (req: AuthenticatedRequest, res) => {
  const contractId = req.params.id;
  const userId = req.user?.id || '';
  const role = req.user?.role || '';
  const { signatureText } = req.body;
  try {
    const isPro = ['accountant', 'senior_accountant', 'tax_specialist', 'compliance_officer', 'payroll_specialist'].includes(role);
    const contract = await MarketplaceService.signContract(
      contractId,
      userId,
      isPro ? 'professional' : 'client',
      signatureText
    );
    await logActivity(req, 'Marketplace', 'Signed service contract agreement', { contractId, role });
    res.json(contract);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PHASE 12: REAL REPORTING ENGINE
// ============================================================
import { ReportingService } from './services/reportingService.js';
import { NotificationRepository } from './repositories/notificationRepository.js';

// --- REPORTING ROUTES ---
app.get('/api/reports/pl', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  const { start_date, end_date } = req.query as { start_date?: string; end_date?: string };
  try {
    const now = new Date();
    const startDate = start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = end_date || now.toISOString().split('T')[0];
    const report = await ReportingService.generatePLStatement(tenantId, startDate, endDate);
    await logActivity(req, 'Reporting', 'Generated Profit & Loss Statement', { start_date: startDate, end_date: endDate });
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/balance-sheet', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  const { as_of_date } = req.query as { as_of_date?: string };
  try {
    const date = as_of_date || new Date().toISOString().split('T')[0];
    const report = await ReportingService.generateBalanceSheet(tenantId, date);
    await logActivity(req, 'Reporting', 'Generated Balance Sheet', { as_of_date: date });
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/cash-flow', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  const { start_date, end_date } = req.query as { start_date?: string; end_date?: string };
  try {
    const now = new Date();
    const startDate = start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = end_date || now.toISOString().split('T')[0];
    const report = await ReportingService.generateCashFlowStatement(tenantId, startDate, endDate);
    await logActivity(req, 'Reporting', 'Generated Cash Flow Statement', { start_date: startDate, end_date: endDate });
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/pl/csv', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  const { start_date, end_date } = req.query as { start_date?: string; end_date?: string };
  try {
    const now = new Date();
    const startDate = start_date || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = end_date || now.toISOString().split('T')[0];
    const report = await ReportingService.generatePLStatement(tenantId, startDate, endDate);
    const rows = [
      { label: 'Report Type', value: 'Profit & Loss' },
      { label: 'Period', value: `${startDate} to ${endDate}` },
      { label: '', value: '' },
      { label: '--- REVENUE ---', value: '' },
      ...report.revenue.map(r => ({ label: r.account_name, value: r.balance_cents })),
      { label: 'Total Revenue', value: report.total_revenue_cents },
      { label: '', value: '' },
      { label: '--- EXPENSES ---', value: '' },
      ...report.expenses.map(e => ({ label: e.account_name, value: e.balance_cents })),
      { label: 'Total Expenses', value: report.total_expenses_cents },
      { label: '', value: '' },
      { label: 'Gross Profit', value: report.gross_profit_cents },
      { label: 'Net Income', value: report.net_income_cents }
    ];
    const csv = ReportingService.exportToCSV('Profit & Loss', rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="pl-report-${startDate}-${endDate}.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/history', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const history = await ReportingService.getReportHistory(tenantId);
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PHASE 12: NOTIFICATION SYSTEM
// ============================================================

app.get('/api/notifications', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id || '';
  const tenantId = req.user?.tenant_id || '';
  try {
    const notifications = await NotificationRepository.getByUser(userId, tenantId);
    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notifications/unread-count', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id || '';
  const tenantId = req.user?.tenant_id || '';
  try {
    const count = await NotificationRepository.getUnreadCount(userId, tenantId);
    res.json({ count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/notifications/:id/read', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id || '';
  const notificationId = req.params.id;
  try {
    const notification = await NotificationRepository.markRead(notificationId, userId);
    res.json(notification);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/notifications/mark-all-read', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id || '';
  const tenantId = req.user?.tenant_id || '';
  try {
    const result = await NotificationRepository.markAllRead(userId, tenantId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notifications/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id || '';
  const notificationId = req.params.id;
  try {
    const result = await NotificationRepository.delete(notificationId, userId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PHASE 12: FULL MESSAGING SYSTEM
// ============================================================

app.get('/api/messages/threads', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id || '';
  const tenantId = req.user?.tenant_id || '';
  try {
    const threads = await MessageRepository.getThreadsForUser(userId, tenantId);
    res.json(threads);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages/threads', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  const userId = req.user?.id || '';
  const { subject, participant_ids } = req.body;
  if (!subject || !Array.isArray(participant_ids)) {
    return res.status(400).json({ error: 'subject and participant_ids are required' });
  }
  try {
    // Always add sender as participant
    const allParticipants = [...new Set([userId, ...participant_ids])];
    const thread = await MessageRepository.createThread(tenantId, subject, allParticipants);
    await logActivity(req, 'Messaging', 'Created new message thread', { threadId: thread.id, subject });
    res.status(201).json(thread);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/messages/threads/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  const threadId = req.params.id;
  try {
    const thread = await MessageRepository.getThreadById(threadId, tenantId);
    res.json(thread);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/messages/threads/:id/messages', requireAuth, async (req: AuthenticatedRequest, res) => {
  const threadId = req.params.id;
  const userId = req.user?.id || '';
  try {
    const messages = await MessageRepository.getMessagesByThread(threadId);
    // Mark as read
    await MessageRepository.markThreadRead(threadId, userId);
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages/threads/:id/messages', requireAuth, async (req: AuthenticatedRequest, res) => {
  const threadId = req.params.id;
  const senderId = req.user?.id || '';
  const tenantId = req.user?.tenant_id || '';
  const { content, attachment_file_ids } = req.body;
  if (!content?.trim()) {
    return res.status(400).json({ error: 'Message content is required' });
  }
  try {
    const message = await MessageRepository.createMessage({
      thread_id: threadId,
      sender_id: senderId,
      content,
      attachment_file_ids
    });

    // Mark as read for sender
    await MessageRepository.markThreadRead(threadId, senderId);

    // Get thread participants to notify others
    const thread = await MessageRepository.getThreadById(threadId, tenantId);
    if (thread && thread.participants) {
      const otherParticipants = thread.participants
        .map((p: any) => p.user_id)
        .filter((id: string) => id !== senderId);

      if (otherParticipants.length > 0) {
        await NotificationRepository.broadcast(
          tenantId,
          otherParticipants,
          'New Message',
          `${req.user?.email || 'Someone'}: ${content.substring(0, 100)}`,
          'message',
          threadId
        );
      }
    }

    await logActivity(req, 'Messaging', 'Sent message in thread', { threadId, messageId: message.id });
    res.status(201).json(message);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages/threads/:id/participants', requireAuth, async (req: AuthenticatedRequest, res) => {
  const threadId = req.params.id;
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });
  try {
    const result = await MessageRepository.addParticipant(threadId, user_id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/messages/threads/:id/read', requireAuth, async (req: AuthenticatedRequest, res) => {
  const threadId = req.params.id;
  const userId = req.user?.id || '';
  try {
    await MessageRepository.markThreadRead(threadId, userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- SYSTEM INITIALIZER BOOTSTRAP ---
app.listen(PORT, () => {
  console.log(`EAC Solutions server running on http://localhost:${PORT}`);
  BillingService.bootstrapBillingPlans().catch((err) => {
    console.error('Failed to seed default billing plans:', err);
  });
});

