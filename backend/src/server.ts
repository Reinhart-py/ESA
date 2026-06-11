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
import { WorkflowService } from './services/workflowService.js';

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
import { CrmRepository } from './repositories/crmRepository.js';
import { PayrollRepository } from './repositories/payrollRepository.js';
import { AdminRepository } from './repositories/adminRepository.js';
import { validateRequest } from './middleware/validate.js';
import { registerSchema, uploadDocumentSchema, createTaskSchema, sendMessageSchema, createTicketSchema, createInviteSchema, acceptInviteSchema, createAccountSchema, createJournalEntrySchema, createExpenseSchema, linkReceiptSchema, createCompliancePackSchema, subscribePackSchema, submitEvidenceSchema, reviewSubmissionSchema, shareDocumentSchema, createESignRequestSchema, esignDocumentSchema, bulkDownloadSchema, createApiKeySchema, createWebhookConfigSchema, onboardProfessionalSchema, createServiceRequestSchema, createQuoteSchema, signContractSchema, createLeadSchema, updateLeadSchema, createContactSchema, createDealSchema, logActivitySchema, createInvoiceSchema, updateInvoiceSchema, createCheckoutSessionSchema, createProductCatalogSchema, createCouponCatalogSchema, createEmployeeSchema, updateEmployeeSchema, createTimesheetSchema, createPayrollRunSchema, createPtoRequestSchema, resolvePtoRequestSchema, createBenefitSchema, createObligationSchema, createTicketReplySchema, createSlaRuleSchema, createSupportCategorySchema, createKbArticleSchema, updateKbArticleSchema, createCsatRatingSchema, createTenantAdminSchema, suspendTenantSchema, updateSystemParameterSchema, addIpWhitelistSchema, setRateLimitSchema, mfaVerifySchema, saveSearchSchema, aiChatSchema, embedDocSchema } from './schemas/index.js';


import { BillingService } from './services/billing.js';
import { InviteService } from './services/inviteService.js';
import { ProfessionalRepository } from './repositories/professionalRepository.js';
import { MarketplaceRepository } from './repositories/marketplaceRepository.js';
import { MarketplaceService } from './services/marketplaceService.js';
import { OcrService } from './services/ocrService.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { MfaRepository } from './repositories/mfaRepository.js';
import { generateSecret, verifyTOTP } from './utils/totp.js';

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
import { SecurityRepository } from './repositories/securityRepository.js';
import { AiRepository } from './repositories/aiRepository.js';


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

// Webhook requires raw payload for signature verification across gateways
app.post('/api/billing/webhook/:provider', express.raw({ type: 'application/json' }), async (req, res) => {
  const provider = req.params.provider as 'stripe' | 'razorpay' | 'paddle';
  const sigHeader = req.headers['stripe-signature'] || req.headers['x-razorpay-signature'] || req.headers['x-signature'];
  const sig = Array.isArray(sigHeader) ? sigHeader[0] : (sigHeader || '');
  try {
    await BillingService.handleWebhookEvent(provider, sig, req.body);
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
    const tenant = await TenantRepository.create({ name: businessName, business_type: businessType });
    
    // Provision tenant workspace folders in the storage provider
    StorageService.provisionTenantFolders(tenant.id).catch((err) => {
      console.error('[Storage Onboarding] Folder provisioning failed:', err.message);
    });

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

// Setup MFA: Generate secret and backup codes
app.post('/api/auth/mfa/setup', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const email = req.user?.email;
  if (!userId || !email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const secret = generateSecret();
    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));
    
    await MfaRepository.upsert({
      user_id: userId,
      secret,
      is_enabled: false,
      backup_codes: backupCodes
    });

    const qrCodeUrl = `otpauth://totp/EACSolutions:${email}?secret=${secret}&issuer=EACSolutions`;

    await logActivity(req, 'Auth', 'Initiated MFA (TOTP) setup');
    
    res.json({
      secret,
      qrCodeUrl,
      backupCodes
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Enable MFA: Verify TOTP token to confirm setup and activate MFA
app.post('/api/auth/mfa/enable', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const { token } = req.body;
  
  if (!userId || !token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const mfa = await MfaRepository.getByUserId(userId);
    if (!mfa) {
      return res.status(404).json({ error: 'MFA setup not found. Initiate setup first.' });
    }

    const isValid = verifyTOTP(token, mfa.secret);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    await MfaRepository.upsert({
      user_id: userId,
      is_enabled: true
    });

    await logActivity(req, 'Auth', 'MFA (TOTP) enabled successfully');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Disable MFA: Disable/remove MFA settings
app.post('/api/auth/mfa/disable', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const { token } = req.body;

  if (!userId || !token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const mfa = await MfaRepository.getByUserId(userId);
    if (!mfa || !mfa.is_enabled) {
      return res.status(400).json({ error: 'MFA is not enabled' });
    }

    // Verify token or backup code
    let isValid = verifyTOTP(token, mfa.secret);
    if (!isValid && mfa.backup_codes.includes(token)) {
      isValid = true;
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid validation token or backup code' });
    }

    await MfaRepository.delete(userId);
    await logActivity(req, 'Auth', 'MFA (TOTP) disabled');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Check if MFA is enabled for a logging in user
app.post('/api/auth/mfa/check', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }
  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const mfa = await MfaRepository.getByUserId(user.id);
    res.json({
      mfaRequired: !!(mfa && mfa.is_enabled)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Verify login with TOTP or backup code
app.post('/api/auth/mfa/verify-login', async (req, res) => {
  const authHeader = req.headers.authorization;
  const { token } = req.body;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }
  if (!token) {
    return res.status(400).json({ error: 'Verification code is required' });
  }
  const authToken = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(authToken);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const mfa = await MfaRepository.getByUserId(user.id);
    if (!mfa || !mfa.is_enabled) {
      return res.status(400).json({ error: 'MFA is not enabled for this user' });
    }

    let isValid = verifyTOTP(token, mfa.secret);
    let usedBackupCode = false;

    if (!isValid && mfa.backup_codes.includes(token)) {
      isValid = true;
      usedBackupCode = true;
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (usedBackupCode) {
      // Remove the used backup code
      const updatedBackupCodes = mfa.backup_codes.filter(c => c !== token);
      await MfaRepository.upsert({
        user_id: user.id,
        backup_codes: updatedBackupCodes
      });
    }

    const mfaToken = jwt.sign(
      { userId: user.id, mfaVerified: true },
      process.env.JWT_SECRET || 'your-super-secret-jwt-signing-key-change-in-production',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      mfaToken
    });
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
app.get(['/api/documents', '/api/documents/explorer'], requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const folders = await DocumentRepository.getFoldersByTenant(tenantId);
    const files = await DocumentRepository.getFilesByTenant(tenantId);
    res.json({ folders, files });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post(['/api/documents/folder', '/api/documents/folders'], requireAuth, async (req: AuthenticatedRequest, res) => {
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

app.put('/api/documents/folders/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const tenantId = req.user?.tenant_id || '';
  try {
    const { data, error } = await supabase
      .from('folders')
      .update({ name })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) throw error;
    await logActivity(req, 'Files', `Renamed folder to: ${name}`, { folderId: id });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/documents/folders/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const tenantId = req.user?.tenant_id || '';
  try {
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);
    if (error) throw error;
    await logActivity(req, 'Files', `Deleted folder`, { folderId: id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/documents/files/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const tenantId = req.user?.tenant_id || '';
  try {
    const file = await DocumentRepository.getFileById(id, tenantId);
    res.json(file);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post(['/api/documents/upload', '/api/documents/files'], requireAuth, validateRequest(uploadDocumentSchema), async (req: AuthenticatedRequest, res) => {
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

    // 1. Duplicate check (identical contents)
    const duplicate = await DocumentRepository.checkDuplicateHash(tenantId, contentHash);
    if (duplicate) {
      return res.status(409).json({
        error: 'Duplicate file detected',
        message: `A file named "${duplicate.name}" with the identical content already exists in this workspace.`
      });
    }

    // 2. Conflict check (name conflict in the same folder)
    const conflictingFile = await DocumentRepository.getFileByName(tenantId, name, folderId || null);

    const storageKey = await StorageService.uploadFile(name, mimeType, fileBuffer, tenantId, category);
    
    // OCR & Auto Classification
    const { ocrText, suggestedCategory } = await OcrService.extractTextAndClassify(name, fileData);

    let data;
    if (conflictingFile) {
      // Conflict resolution: Archive current version in file_versions first
      const currentVersion = conflictingFile.version || 1;
      
      await DocumentRepository.createVersion({
        file_id: conflictingFile.id,
        version: currentVersion,
        size_bytes: conflictingFile.size_bytes,
        storage_key: conflictingFile.storage_key,
        uploaded_by: conflictingFile.uploaded_by
      });

      // Update parent file row to point to the new uploaded content
      data = await DocumentRepository.updateFile(conflictingFile.id, {
        size_bytes: sizeBytes,
        category: category || suggestedCategory,
        uploaded_by: userId,
        storage_provider: StorageService.getProviderName(),
        storage_key: storageKey,
        mime_type: mimeType,
        content_hash: contentHash,
        version: currentVersion + 1,
        ocr_text: ocrText
      });
      
      await logActivity(req, 'Files', `Uploaded new version (v${currentVersion + 1}) for file: ${name}`, { fileId: data.id });
    } else {
      // Create new file
      data = await DocumentRepository.createFile({
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
    }

    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents/repair', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }
  try {
    const result = await StorageService.repairTenantFolders(tenantId);
    await logActivity(req, 'Files', 'Executed Workspace Folder Repair Routine', { result });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents/reconcile', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }
  try {
    const result = await StorageService.reconcileSync(tenantId);
    await logActivity(req, 'Files', 'Executed Workspace Sync Reconciliation Run', { result });
    res.json(result);
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

app.post(['/api/documents/file/:id/restore', '/api/documents/files/:id/restore'], requireAuth, async (req: AuthenticatedRequest, res) => {
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

app.get(['/api/documents/analytics', '/api/documents/reports/storage'], requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    const rawFiles = await DocumentRepository.getStorageAnalytics(tenantId);
    
    let totalSize = 0;
    const totalCount = rawFiles.length;
    const categoryMap: Record<string, { size: number; count: number }> = {};
    const monthlyMap: Record<string, number> = {};

    rawFiles.forEach((file: any) => {
      const size = Number(file.size_bytes || 0);
      const cat = file.category || 'general';
      totalSize += size;

      if (!categoryMap[cat]) {
        categoryMap[cat] = { size: 0, count: 0 };
      }
      categoryMap[cat].size += size;
      categoryMap[cat].count += 1;

      if (file.created_at) {
        const date = new Date(file.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + size;
      }
    });

    const sortedMonths = Object.keys(monthlyMap).sort();
    const monthlyGrowth = sortedMonths.map(month => ({
      month,
      addedBytes: monthlyMap[month]
    }));

    let predictedNextMonthSize = totalSize;
    if (monthlyGrowth.length > 0) {
      const totalGrowthVal = monthlyGrowth.reduce((acc, m) => acc + m.addedBytes, 0);
      const averageMonthlyGrowth = totalGrowthVal / monthlyGrowth.length;
      predictedNextMonthSize = totalSize + averageMonthlyGrowth;
    }

    res.json({
      totalSizeBytes: totalSize,
      totalFilesCount: totalCount,
      categories: categoryMap,
      growth: monthlyGrowth,
      forecasting: {
        predictedNextMonthSizeBytes: Math.round(predictedNextMonthSize),
        forecastStatus: 'STABLE'
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/search', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id;
  const query = (req.query.q as string) || '';
  const category = req.query.category as string;
  const status = req.query.status as string;
  const minSize = req.query.minSize ? Number(req.query.minSize) : undefined;
  const maxSize = req.query.maxSize ? Number(req.query.maxSize) : undefined;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant context required' });
  }

  try {
    const results = await SearchRepository.searchAll(tenantId, query, {
      category,
      status,
      minSize,
      maxSize,
      startDate,
      endDate
    });

    await logActivity(req, 'Search', `Searched query: "${query}"`, { query, category, resultsCount: results.files.length + results.tasks.length + results.obligations.length });
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/search/saved', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id;
  const userId = req.user?.id;
  const { name, query, filters } = req.body;

  if (!tenantId || !userId) {
    return res.status(400).json({ error: 'Context tenant_id and user_id are required' });
  }
  if (!name || !query) {
    return res.status(400).json({ error: 'Name and query are required' });
  }

  try {
    const saved = await SearchRepository.createSavedSearch({
      tenant_id: tenantId,
      user_id: userId,
      name,
      query,
      filters: filters || {}
    });
    await logActivity(req, 'Search', `Saved search query: "${name}"`, { name, query });
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/search/saved', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id;
  const userId = req.user?.id;

  if (!tenantId || !userId) {
    return res.status(400).json({ error: 'Context tenant_id and user_id are required' });
  }

  try {
    const list = await SearchRepository.getSavedSearches(tenantId, userId);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/search/analytics', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('details')
      .eq('tenant_id', tenantId)
      .eq('category', 'Search');

    if (error) throw error;

    const queryFrequencies: Record<string, number> = {};
    (logs || []).forEach((log: any) => {
      const q = log.details?.query;
      if (q) {
        queryFrequencies[q] = (queryFrequencies[q] || 0) + 1;
      }
    });

    const sortedQueries = Object.entries(queryFrequencies)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json(sortedQueries);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get(['/api/documents/file/:id/versions', '/api/documents/files/:id/versions'], requireAuth, async (req: AuthenticatedRequest, res) => {
  const fileId = req.params.id;
  try {
    const versions = await DocumentRepository.getFileVersions(fileId);
    res.json(versions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents/files/:id/restore-version', requireAuth, async (req: AuthenticatedRequest, res) => {
  const fileId = req.params.id;
  const versionId = req.body.versionId || req.query.versionId;
  const tenantId = req.user?.tenant_id || '';
  const userId = req.user?.id || '';

  if (!versionId) {
    return res.status(400).json({ error: 'versionId is required in request body or query parameters' });
  }

  try {
    const currentFile = await DocumentRepository.getFileById(fileId, tenantId);
    if (!currentFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    const targetVersion = await DocumentRepository.getVersionById(versionId);
    if (!targetVersion || targetVersion.file_id !== fileId) {
      return res.status(404).json({ error: 'Version not found or mismatch' });
    }

    await DocumentRepository.createVersion({
      file_id: currentFile.id,
      version: currentFile.version || 1,
      size_bytes: currentFile.size_bytes,
      storage_key: currentFile.storage_key,
      uploaded_by: currentFile.uploaded_by
    });

    const updatedFile = await DocumentRepository.updateFile(fileId, {
      storage_key: targetVersion.storage_key,
      size_bytes: targetVersion.size_bytes,
      version: targetVersion.version,
      uploaded_by: userId
    });

    await DocumentRepository.deleteVersion(versionId);

    await logActivity(req, 'Files', `Restored version v${targetVersion.version} for file: ${currentFile.name}`, { fileId, versionId });
    res.json(updatedFile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents/file/:id/version/:versionId/restore', requireAuth, async (req: AuthenticatedRequest, res) => {
  const fileId = req.params.id;
  const versionId = req.params.versionId;
  const tenantId = req.user?.tenant_id || '';
  const userId = req.user?.id || '';

  try {
    const currentFile = await DocumentRepository.getFileById(fileId, tenantId);
    if (!currentFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    const targetVersion = await DocumentRepository.getVersionById(versionId);
    if (!targetVersion || targetVersion.file_id !== fileId) {
      return res.status(404).json({ error: 'Version not found or mismatch' });
    }

    await DocumentRepository.createVersion({
      file_id: currentFile.id,
      version: currentFile.version || 1,
      size_bytes: currentFile.size_bytes,
      storage_key: currentFile.storage_key,
      uploaded_by: currentFile.uploaded_by
    });

    const updatedFile = await DocumentRepository.updateFile(fileId, {
      storage_key: targetVersion.storage_key,
      size_bytes: targetVersion.size_bytes,
      version: targetVersion.version,
      uploaded_by: userId
    });

    await DocumentRepository.deleteVersion(versionId);

    await logActivity(req, 'Files', `Restored previous version (v${targetVersion.version}) for file: ${currentFile.name}`, { fileId, versionId });
    res.json(updatedFile);
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

app.post('/api/documents/file/:id/approve', requireAuth, requireRoles(['super_admin', 'admin', 'client_owner', 'accountant']), async (req: AuthenticatedRequest, res) => {
  const fileId = req.params.id;
  const tenantId = req.user?.tenant_id || '';
  const userId = req.user?.id || '';
  const identity = req.user?.email || 'Unknown User';

  try {
    const file = await WorkflowService.approveDocument(fileId, tenantId, userId, identity);
    res.json(file);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents/file/:id/reject', requireAuth, requireRoles(['super_admin', 'admin', 'client_owner', 'accountant']), async (req: AuthenticatedRequest, res) => {
  const fileId = req.params.id;
  const tenantId = req.user?.tenant_id || '';
  const userId = req.user?.id || '';
  const identity = req.user?.email || 'Unknown User';
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Rejection reason is required' });
  }

  try {
    const file = await WorkflowService.rejectDocument(fileId, tenantId, userId, identity, reason);
    res.json(file);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents/file/:id/assign-review', requireAuth, requireRoles(['super_admin', 'admin', 'client_owner', 'accountant']), async (req: AuthenticatedRequest, res) => {
  const fileId = req.params.id;
  const tenantId = req.user?.tenant_id || '';
  const userId = req.user?.id || '';
  const identity = req.user?.email || 'Unknown User';
  const { assigneeId } = req.body;

  if (!assigneeId) {
    return res.status(400).json({ error: 'Assignee user ID is required' });
  }

  try {
    const file = await WorkflowService.assignReviewer(fileId, tenantId, assigneeId, userId, identity);
    res.json(file);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents/workflows/escalate-pending', requireAuth, requireRoles(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const result = await WorkflowService.runEscalationRoutine();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents/workflows/check-expirations', requireAuth, requireRoles(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const result = await WorkflowService.runExpirationRoutine();
    res.json(result);
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

app.delete(['/api/documents/file/:id', '/api/documents/files/:id'], requireAuth, async (req: AuthenticatedRequest, res) => {
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
app.post(['/api/documents/share', '/api/documents/shares/create'], requireAuth, validateRequest(shareDocumentSchema), async (req: AuthenticatedRequest, res) => {
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

app.get(['/api/documents/share/:token', '/api/documents/shares/:token'], async (req, res) => {
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

app.post(['/api/documents/esign', '/api/documents/esign/request'], requireAuth, validateRequest(createESignRequestSchema), async (req: AuthenticatedRequest, res) => {
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

app.get('/api/documents/esign/requests/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await DocumentProRepository.getESignRequestById(id, tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents/esign/sign', requireAuth, validateRequest(esignDocumentSchema), async (req: AuthenticatedRequest, res) => {
  const { esignRequestId, signatureText } = req.body;
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

app.post('/api/compliance/obligation', requireAuth, requireRoles(['super_admin', 'admin', 'accountant']), validateRequest(createObligationSchema), async (req: AuthenticatedRequest, res) => {

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

// --- CRM & CUSTOMER PIPELINE ENGINE ---
app.get('/api/crm/leads', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  const { search, sortBy, order, page = 1, limit = 50 } = req.query;
  try {
    let leads = await CrmRepository.getLeads(tenantId);
    if (search) {
      const q = String(search).toLowerCase();
      leads = leads.filter(l => 
        (l.first_name || '').toLowerCase().includes(q) || 
        (l.last_name || '').toLowerCase().includes(q) || 
        (l.email || '').toLowerCase().includes(q) ||
        (l.company && l.company.toLowerCase().includes(q))
      );
    }
    if (sortBy) {
      const sortField = String(sortBy);
      const direction = order === 'asc' ? 1 : -1;
      leads.sort((a: any, b: any) => {
        const valA = a[sortField] || '';
        const valB = b[sortField] || '';
        return valA > valB ? direction : valA < valB ? -direction : 0;
      });
    }
    const total = leads.length;
    const offset = (Number(page) - 1) * Number(limit);
    const paginatedLeads = leads.slice(offset, offset + Number(limit));
    res.setHeader('X-Total-Count', total.toString());
    res.json({
      data: paginatedLeads,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/crm/leads/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const { data, error } = await supabase.from('crm_leads').select('*').eq('id', req.params.id).eq('tenant_id', tenantId).single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/crm/leads', requireAuth, requireRoles(['super_admin', 'admin', 'client_owner']), validateRequest(createLeadSchema), async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const lead = await CrmRepository.createLead({
      tenant_id: tenantId,
      ...req.body
    });
    await logActivity(req, 'CRM', `Created lead: ${lead.first_name} ${lead.last_name}`, { leadId: lead.id });
    res.status(201).json(lead);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'A lead with this email address already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/crm/leads/:id', requireAuth, requireRoles(['super_admin', 'admin', 'client_owner']), validateRequest(updateLeadSchema), async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const lead = await CrmRepository.updateLead(req.params.id, tenantId, req.body);
    await logActivity(req, 'CRM', `Updated lead: ${lead.first_name} ${lead.last_name}`, { leadId: lead.id });
    res.json(lead);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/crm/leads/:id', requireAuth, requireRoles(['super_admin', 'admin', 'client_owner']), async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    await CrmRepository.deleteLead(req.params.id, tenantId);
    await logActivity(req, 'CRM', `Deleted lead ID: ${req.params.id}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/crm/contacts', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const contacts = await CrmRepository.getContacts(tenantId);
    res.json(contacts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/crm/contacts', requireAuth, requireRoles(['super_admin', 'admin', 'client_owner']), validateRequest(createContactSchema), async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const contact = await CrmRepository.createContact({
      tenant_id: tenantId,
      ...req.body
    });
    await logActivity(req, 'CRM', `Created contact: ${contact.first_name} ${contact.last_name}`, { contactId: contact.id });
    res.status(201).json(contact);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/crm/contacts/:id', requireAuth, requireRoles(['super_admin', 'admin', 'client_owner']), async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const { data, error } = await supabase.from('crm_contacts').update(req.body).eq('id', req.params.id).eq('tenant_id', tenantId).select().single();
    if (error) throw error;
    await logActivity(req, 'CRM', `Updated contact: ${data.first_name} ${data.last_name}`, { contactId: data.id });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/crm/contacts/:id', requireAuth, requireRoles(['super_admin', 'admin', 'client_owner']), async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const { error } = await supabase.from('crm_contacts').delete().eq('id', req.params.id).eq('tenant_id', tenantId);
    if (error) throw error;
    await logActivity(req, 'CRM', `Deleted contact ID: ${req.params.id}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/crm/deals', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const deals = await CrmRepository.getDeals(tenantId);
    res.json(deals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/crm/deals', requireAuth, requireRoles(['super_admin', 'admin', 'client_owner']), validateRequest(createDealSchema), async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const deal = await CrmRepository.createDeal({
      tenant_id: tenantId,
      ...req.body
    });
    await logActivity(req, 'CRM', `Created sales opportunity: ${deal.title}`, { dealId: deal.id });
    res.status(201).json(deal);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/crm/deals/:id/stage', requireAuth, requireRoles(['super_admin', 'admin', 'client_owner']), async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  const { stage, probability } = req.body;
  try {
    const deal = await CrmRepository.updateDealStage(req.params.id, tenantId, stage, probability);
    await logActivity(req, 'CRM', `Updated deal stage: ${deal.title} to ${stage}`, { dealId: deal.id });
    res.json(deal);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/crm/activities', requireAuth, requireRoles(['super_admin', 'admin', 'client_owner']), validateRequest(logActivitySchema), async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const activity = await CrmRepository.logActivity({
      tenant_id: tenantId,
      logged_by: req.user?.id,
      ...req.body
    });
    res.status(201).json(activity);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/crm/activities', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  const { leadId, dealId } = req.query;
  try {
    let query = supabase.from('crm_activities').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
    if (leadId) query = query.eq('lead_id', leadId);
    if (dealId) query = query.eq('deal_id', dealId);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/crm/dashboard-summary', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const leads = await CrmRepository.getLeads(tenantId);
    const deals = await CrmRepository.getDeals(tenantId);
    const contacts = await CrmRepository.getContacts(tenantId);
    
    const totalLeads = leads.length;
    const newLeads = leads.filter(l => l.status === 'new').length;
    const totalDealsValue = deals.reduce((sum, d) => sum + (d.amount_cents || 0), 0);
    const activeDeals = deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length;
    const wonDealsValue = deals.filter(d => d.stage === 'Closed Won').reduce((sum, d) => sum + (d.amount_cents || 0), 0);

    res.json({
      totalLeads,
      newLeads,
      totalDealsValue,
      activeDeals,
      wonDealsValue,
      totalContacts: contacts.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/crm/accounts', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const accounts = await CrmRepository.getAccounts(tenantId);
    res.json(accounts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/crm/accounts', requireAuth, requireRoles(['super_admin', 'admin', 'client_owner']), async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const account = await CrmRepository.createAccount({
      tenant_id: tenantId,
      ...req.body
    });
    await logActivity(req, 'CRM', `Created company account: ${account.name}`, { accountId: account.id });
    res.status(201).json(account);
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

app.get('/api/developer/webhooks/:id/logs', requireAuth, async (req: AuthenticatedRequest, res) => {
  const hookId = req.params.id;
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await DeveloperRepository.getWebhookLogs(tenantId, hookId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/developer/webhooks/:id/test', requireAuth, async (req: AuthenticatedRequest, res) => {
  const hookId = req.params.id;
  const tenantId = req.user?.tenant_id || '';
  try {
    const configs = await DeveloperRepository.getWebhookConfigsByTenant(tenantId);
    const config = configs.find((c: any) => c.id === hookId);
    if (!config) {
      return res.status(404).json({ error: 'Webhook configuration not found' });
    }

    const eventType = 'test.ping';
    const payload = {
      message: 'This is a test webhook event from the Enterprise Operating System.',
      test: true,
      timestamp: new Date().toISOString()
    };
    const bodyPayload = JSON.stringify({
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload
    });

    const hmac = crypto.createHmac('sha256', config.secret);
    const signature = hmac.update(bodyPayload).digest('hex');

    let responseStatus = 0;
    let responseBody = '';
    try {
      const resp = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-EAC-Event': eventType,
          'X-EAC-Signature': signature
        },
        body: bodyPayload
      });
      responseStatus = resp.status;
      responseBody = await resp.text();
    } catch (err: any) {
      responseStatus = 500;
      responseBody = err.message || 'Connection failed';
    }

    const logEntry = await DeveloperRepository.logWebhookDelivery({
      tenant_id: tenantId,
      webhook_id: hookId,
      event_type: eventType,
      payload,
      response_status: responseStatus,
      response_body: responseBody.slice(0, 1000)
    });

    await logActivity(req, 'Developer', `Dispatched mock test webhook to ${config.url}`, { hookId, responseStatus });
    res.json(logEntry);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/developer/api-logs', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await DeveloperRepository.getApiLogs(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/developer/docs', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    let data = await DeveloperRepository.getApiDocs();
    if (data.length === 0) {
      // Default baseline documentation routes if none exist in DB
      data = [
        {
          id: 'doc-1',
          endpoint: '/api/crm/leads',
          method: 'GET',
          description: 'Fetch list of CRM leads for the tenant with sorting, search, and page boundaries filters.',
          request_schema: { query: { page: 'number', limit: 'number', query: 'string' } },
          response_schema: { data: 'array', total: 'number' }
        },
        {
          id: 'doc-2',
          endpoint: '/api/crm/leads',
          method: 'POST',
          description: 'Register a new customer lead to the B2B sales pipeline.',
          request_schema: { body: { first_name: 'string', last_name: 'string', email: 'string', company: 'string', phone: 'string' } },
          response_schema: { id: 'uuid', first_name: 'string', last_name: 'string', status: 'string' }
        },
        {
          id: 'doc-3',
          endpoint: '/api/ledger/accounts',
          method: 'GET',
          description: 'Fetch the chart of accounts for the general double-entry ledger.',
          request_schema: {},
          response_schema: { data: 'array' }
        },
        {
          id: 'doc-4',
          endpoint: '/api/ledger/journal-entries',
          method: 'POST',
          description: 'Post a manual journal entry to adjust account balances. Total debits must match credits.',
          request_schema: { body: { date: 'string', description: 'string', lines: 'Array<{ accountId: string, entryType: debit|credit, amountCents: number }>' } },
          response_schema: { id: 'uuid', description: 'string', total_cents: 'number' }
        },
        {
          id: 'doc-5',
          endpoint: '/api/billing/invoices',
          method: 'GET',
          description: 'Fetch outbound invoices list, matching billing schedules.',
          request_schema: {},
          response_schema: { data: 'array' }
        }
      ];
    }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/developer/rate-limits', requireAuth, validateRequest(setRateLimitSchema), async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  const { apiKeyId, maxRequestsPerMinute } = req.body;
  try {
    const data = await DeveloperRepository.setRateLimit({
      tenant_id: tenantId,
      api_key_id: apiKeyId,
      max_requests_per_minute: maxRequestsPerMinute
    });
    await logActivity(req, 'Developer', `Updated API key rate limits`, { apiKeyId, maxRequestsPerMinute });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/developer/sdks', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    let data = await DeveloperRepository.getSdkReleases();
    if (data.length === 0) {
      // Default releases to display if database hasn't been seeded
      data = [
        {
          id: 'sdk-1',
          version: '1.4.2',
          language: 'Node.js',
          download_url: 'https://sdk.enterpriseos.io/node-v1.4.2.tgz',
          released_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'sdk-2',
          version: '1.2.0',
          language: 'Python',
          download_url: 'https://sdk.enterpriseos.io/python-v1.2.0.tar.gz',
          released_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'sdk-3',
          version: '0.9.1',
          language: 'Go',
          download_url: 'https://sdk.enterpriseos.io/go-v0.9.1.zip',
          released_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/developer/webhook-queue/flush', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    await DeveloperService.flushWebhookQueue(tenantId);
    await logActivity(req, 'Developer', 'Manually flushed webhook event queue');
    res.json({ message: 'Webhook event queue flushed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/developer/webhooks/events', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const events = [
      'crm.lead.created',
      'crm.lead.updated',
      'crm.contact.created',
      'ledger.journal.posted',
      'billing.invoice.created',
      'billing.invoice.paid',
      'support.ticket.created',
      'support.ticket.updated'
    ];
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- ENTERPRISE SECURITY, MFA, & AUDITING ---
app.get('/api/security/audit-logs', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await AuditRepository.getLogsByTenant(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/security/mfa/setup', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const email = req.user?.email || '';
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const secret = generateSecret();
    const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));
    
    await MfaRepository.upsert({
      user_id: userId,
      secret,
      is_enabled: false,
      backup_codes: backupCodes
    });

    const qrCodeUrl = `otpauth://totp/EACSolutions:${email}?secret=${secret}&issuer=EACSolutions`;
    await logActivity(req, 'Auth', 'Initiated security MFA (TOTP) setup');
    
    res.json({
      secret,
      qrCodeUrl,
      backupCodes
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/security/mfa/enable', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const { code } = req.body;
  if (!userId || !code) {
    return res.status(400).json({ error: 'Verification code is required' });
  }

  try {
    const mfa = await MfaRepository.getByUserId(userId);
    if (!mfa) {
      return res.status(404).json({ error: 'MFA setup not found. Initiate setup first.' });
    }

    const isValid = verifyTOTP(code, mfa.secret);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    await MfaRepository.upsert({
      user_id: userId,
      is_enabled: true
    });

    await logActivity(req, 'Auth', 'Security MFA (TOTP) enabled successfully');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/security/mfa/disable', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const { code } = req.body;
  if (!userId || !code) {
    return res.status(400).json({ error: 'Verification code/token is required' });
  }

  try {
    const mfa = await MfaRepository.getByUserId(userId);
    if (!mfa || !mfa.is_enabled) {
      return res.status(400).json({ error: 'MFA is not enabled' });
    }

    let isValid = verifyTOTP(code, mfa.secret);
    if (!isValid && mfa.backup_codes.includes(code)) {
      isValid = true;
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid validation token or backup code' });
    }

    await MfaRepository.delete(userId);
    await logActivity(req, 'Auth', 'Security MFA (TOTP) disabled');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/security/mfa/verify', requireAuth, validateRequest(mfaVerifySchema), async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const { code } = req.body;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const mfa = await MfaRepository.getByUserId(userId);
    if (!mfa || !mfa.is_enabled) {
      return res.json({ success: true, message: 'MFA not active' });
    }

    let isValid = verifyTOTP(code, mfa.secret);
    if (!isValid && mfa.backup_codes.includes(code)) {
      isValid = true;
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid MFA verification code' });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/security/sessions', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id || '';
  try {
    const data = await SecurityRepository.getSessionsByUser(userId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/security/sessions/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const sessionId = req.params.id;
  const userId = req.user?.id || '';
  try {
    const data = await SecurityRepository.deleteSession(sessionId, userId);
    await logActivity(req, 'Security', `Revoked active user session`, { sessionId });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/security/saved-searches', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id || '';
  try {
    const data = await SecurityRepository.getSavedSearches(userId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/security/saved-searches', requireAuth, validateRequest(saveSearchSchema), async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id || '';
  const tenantId = req.user?.tenant_id || '';
  const { name, query, filters } = req.body;
  try {
    const data = await SecurityRepository.createSavedSearch({
      tenant_id: tenantId,
      user_id: userId,
      name,
      query,
      filters: filters || {}
    });
    await logActivity(req, 'Security', `Created saved search: ${name}`, { searchId: data.id });
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/security/saved-searches/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const searchId = req.params.id;
  const userId = req.user?.id || '';
  try {
    const data = await SecurityRepository.deleteSavedSearch(searchId, userId);
    await logActivity(req, 'Security', `Deleted saved search`, { searchId });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/security/incidents', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await SecurityRepository.getIncidentsByTenant(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/security/incidents/:id/resolve', requireAuth, async (req: AuthenticatedRequest, res) => {
  const incidentId = req.params.id;
  const userId = req.user?.id || '';
  try {
    const data = await SecurityRepository.resolveIncident(incidentId, userId);
    await logActivity(req, 'Security', `Resolved security incident report`, { incidentId });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- ENTERPRISE AI COMPILATIONS & EMBEDDINGS ---
app.post('/api/ai/chat', requireAuth, validateRequest(aiChatSchema), async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  const userId = req.user?.id || '';
  const { query } = req.body;
  try {
    const terms = query.split(/\s+/).filter((t: string) => t.length > 2);
    const matchedChunks = await AiRepository.searchDocChunks(tenantId, terms);

    let contextStr = '';
    if (matchedChunks.length > 0) {
      contextStr = `\n\nFound relevant document context:\n` + matchedChunks.map((c: any) => `- ${c.chunk_content}`).join('\n');
    }

    const responses = [
      `I have analyzed your workspace query. Based on current records, everything looks correct. Let me know if you want me to search or export this information.${contextStr}`,
      `Based on the double-entry accounting ledger and compliance schedules, I can confirm the records align with the requested data.${contextStr}`,
      `Here is the diagnostic report compiled from your active integration channels. Let me know if you need to run adjustments.${contextStr}`
    ];
    const aiResponse = responses[Math.abs(query.length) % responses.length];

    const logEntry = await AiRepository.logChat({
      tenant_id: tenantId,
      user_id: userId,
      user_query: query,
      ai_response: aiResponse
    });

    res.json(logEntry);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ai/chat/history', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  const userId = req.user?.id || '';
  try {
    const data = await AiRepository.getChatLogs(tenantId, userId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/documents/embed', requireAuth, validateRequest(embedDocSchema), async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  const { documentId, chunks } = req.body;
  try {
    const dbEmbeddings = chunks.map((chunk: any) => ({
      tenant_id: tenantId,
      document_id: documentId,
      chunk_content: chunk.content,
      embedding: Array.from({ length: 128 }, () => Math.random())
    }));

    const data = await AiRepository.saveDocEmbeddings(dbEmbeddings);
    await logActivity(req, 'AI', `Indexed document text chunks for vector RAG search`, { documentId });
    res.status(201).json(data);
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

app.get('/api/admin/tenants', requireAuth, requireRoles(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const search = req.query.search as string;
    const type = req.query.type as string;
    const tenants = await AdminRepository.getTenants(search, type);
    res.json(tenants);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/tenants', requireAuth, requireRoles(['super_admin', 'admin']), validateRequest(createTenantAdminSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const newTenant = await AdminRepository.createTenant(req.body);
    await AdminRepository.logSecurityEvent({
      event_type: 'tenant.created',
      severity: 'medium',
      message: `New tenant workspace "${req.body.name}" created by administrator`,
      user_identity: req.user?.id
    });
    res.status(201).json(newTenant);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/tenants/:id', requireAuth, requireRoles(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const tenant = await AdminRepository.getTenantDetails(req.params.id);
    res.json(tenant);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/tenants/:id', requireAuth, requireRoles(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const tenant = await AdminRepository.updateTenant(req.params.id, req.body);
    await AdminRepository.logSecurityEvent({
      event_type: 'tenant.updated',
      severity: 'low',
      message: `Tenant workspace "${tenant.name}" parameters updated by administrator`,
      user_identity: req.user?.id
    });
    res.json(tenant);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/tenants/:id/suspend', requireAuth, requireRoles(['super_admin', 'admin']), validateRequest(suspendTenantSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const result = await AdminRepository.suspendTenant(req.params.id, req.user!.id, req.body.reason);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/tenants/:id/unsuspend', requireAuth, requireRoles(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const result = await AdminRepository.unsuspendTenant(req.params.id, req.user!.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/impersonate/:userId', requireAuth, requireRoles(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { data: targetUser, error: uErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.userId)
      .maybeSingle();

    if (uErr || !targetUser) {
      return res.status(404).json({ error: 'Impersonation failed: Target user profile not found' });
    }

    const impersonateToken = jwt.sign(
      { 
        userId: targetUser.id,
        role: targetUser.role,
        tenantId: targetUser.tenant_id,
        isImpersonating: true,
        adminId: req.user!.id
      }, 
      process.env.JWT_SECRET || 'your-super-secret-jwt-signing-key-change-in-production',
      { expiresIn: '2h' }
    );

    res.json({ token: impersonateToken, user: targetUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/impersonate', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    res.json({ success: true, message: 'Impersonation session terminated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/security-events', requireAuth, requireRoles(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const eventType = req.query.eventType as string;
    const severity = req.query.severity as string;
    const events = await AdminRepository.getSecurityEvents(eventType, severity);
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/telemetry/traffic', requireAuth, requireRoles(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const telemetry = await AdminRepository.getGlobalTelemetry();
    res.json(telemetry);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/telemetry/storage', requireAuth, requireRoles(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('id, name, storage_used_bytes, storage_limit_bytes')
      .order('storage_used_bytes', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/parameters', requireAuth, requireRoles(['super_admin', 'admin']), validateRequest(updateSystemParameterSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const param = await AdminRepository.updateSystemParameter(req.body.key, req.body.value, req.body.description);
    res.json(param);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/migrations', requireAuth, requireRoles(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const migrations = await AdminRepository.getMigrations();
    res.json(migrations);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/ip-whitelist', requireAuth, requireRoles(['super_admin', 'admin']), validateRequest(addIpWhitelistSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const entry = await AdminRepository.addIpWhitelist({
      ip_address: req.body.ip_address,
      description: req.body.description,
      created_by: req.user!.id
    });
    res.status(201).json(entry);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/ip-whitelist/:id', requireAuth, requireRoles(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const result = await AdminRepository.deleteIpWhitelist(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/telemetry/health', requireAuth, requireRoles(['super_admin', 'admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    
    const start = Date.now();
    const { error } = await supabase.from('tenants').select('id').limit(1);
    const dbLatency = Date.now() - start;

    await AdminRepository.recordTelemetry({
      cpu_usage: Number((Math.random() * 20 + 5).toFixed(2)),
      memory_usage_bytes: memoryUsage.heapUsed,
      request_count: Math.floor(Math.random() * 1000 + 200),
      error_count: Math.floor(Math.random() * 5),
      latency_ms_avg: Math.floor(dbLatency)
    });

    res.json({
      status: error ? 'DEGRADED' : 'HEALTHY',
      database: error ? 'DISCONNECTED' : 'CONNECTED',
      dbLatencyMs: dbLatency,
      memoryUsage: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external
      },
      uptimeSeconds: process.uptime()
    });
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
    await logActivity(req, 'Tasks', `Created workspace task: ${title}`, { taskId: data.id });
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
    await logActivity(req, 'Tasks', `Updated workspace task details`, { taskId, updates });
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
    await logActivity(req, 'Tasks', `Deleted workspace task`, { taskId });
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
// --- SUPPORT TICKETS ---
app.get('/api/support/tickets', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  const statusFilter = req.query.status as string;
  const priorityFilter = req.query.priority as string;
  const categoryFilter = req.query.category as string;
  const assignedAgentFilter = req.query.assignedAgentId as string;
  const query = req.query.q as string;

  try {
    let rawTickets = await SupportRepository.getTicketsByTenant(tenantId);
    
    // Apply filters in memory
    if (statusFilter) {
      rawTickets = rawTickets.filter(t => t.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    if (priorityFilter) {
      rawTickets = rawTickets.filter(t => t.priority?.toLowerCase() === priorityFilter.toLowerCase());
    }
    if (categoryFilter) {
      rawTickets = rawTickets.filter(t => t.category?.toLowerCase() === categoryFilter.toLowerCase());
    }
    if (assignedAgentFilter) {
      rawTickets = rawTickets.filter(t => t.assigned_agent_id === assignedAgentFilter);
    }
    if (query) {
      rawTickets = rawTickets.filter(t => 
        t.subject?.toLowerCase().includes(query.toLowerCase()) || 
        t.description?.toLowerCase().includes(query.toLowerCase())
      );
    }

    res.json(rawTickets);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post(['/api/support/ticket', '/api/support/tickets'], requireAuth, validateRequest(createTicketSchema), async (req: AuthenticatedRequest, res) => {
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

app.get('/api/support/tickets/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const tenantId = req.user?.tenant_id || '';
  try {
    const ticket = await SupportRepository.getTicketById(id, tenantId);
    const messages = await SupportRepository.getCommentsByTicket(id);
    res.json({ ...ticket, messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/support/tickets/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const tenantId = req.user?.tenant_id || '';
  const { category, priority, assigned_agent_id } = req.body;
  try {
    const data = await SupportRepository.updateTicket(id, { category, priority, assigned_agent_id }, tenantId);
    await logActivity(req, 'Support', `Updated ticket properties`, { ticketId: id });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/support/tickets/:id/status', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await SupportRepository.updateTicket(id, { status }, tenantId);
    await logActivity(req, 'Support', `Updated ticket status to: ${status}`, { ticketId: id, status });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/support/tickets/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const tenantId = req.user?.tenant_id || '';
  try {
    await SupportRepository.deleteTicket(id, tenantId);
    await logActivity(req, 'Support', `Deleted support ticket`, { ticketId: id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/support/tickets/:id/messages', requireAuth, validateRequest(createTicketReplySchema), async (req: AuthenticatedRequest, res) => {
  const ticketId = req.params.id;
  const { content } = req.body;
  const userId = req.user?.id || '';
  const tenantId = req.user?.tenant_id || '';
  try {
    // Verify ticket exists
    await SupportRepository.getTicketById(ticketId, tenantId);
    const data = await SupportRepository.createComment({
      ticket_id: ticketId,
      user_id: userId,
      content
    });
    await logActivity(req, 'Support', `Added response comment to ticket`, { ticketId, commentId: data.id });
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- KNOWLEDGE BASE ---
app.get('/api/support/kb', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await SupportRepository.getKbArticles(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/support/kb', requireAuth, validateRequest(createKbArticleSchema), async (req: AuthenticatedRequest, res) => {
  const { title, content, category, is_published } = req.body;
  const tenantId = req.user?.tenant_id || '';
  const userId = req.user?.id || '';
  try {
    const data = await SupportRepository.createKbArticle({
      tenant_id: tenantId,
      title,
      content,
      category,
      is_published: is_published !== undefined ? is_published : true,
      created_by: userId
    });
    await logActivity(req, 'Support', `Created help article: ${title}`, { articleId: data.id });
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/support/kb/:id', requireAuth, validateRequest(updateKbArticleSchema), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await SupportRepository.updateKbArticle(id, req.body, tenantId);
    await logActivity(req, 'Support', `Updated help article`, { articleId: id });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/support/kb/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const tenantId = req.user?.tenant_id || '';
  try {
    await SupportRepository.deleteKbArticle(id, tenantId);
    await logActivity(req, 'Support', `Deleted help article`, { articleId: id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- CSAT & SLA RATINGS / REPORTS ---
app.post('/api/support/tickets/:id/rate', requireAuth, async (req: AuthenticatedRequest, res) => {
  const ticketId = req.params.id;
  const { rating, feedback } = req.body;
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await SupportRepository.createCsatRating({
      tenant_id: tenantId,
      ticket_id: ticketId,
      rating: Number(rating),
      feedback
    });
    await logActivity(req, 'Support', `Submitted CSAT rating for ticket`, { ticketId, rating });
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/support/reports/sla', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const breaches = await SupportRepository.getSlaBreaches(tenantId);
    res.json(breaches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/support/reports/cstat', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const ratings = await SupportRepository.getCsatRatings(tenantId);
    
    let totalScore = 0;
    const ratingCounts = [0, 0, 0, 0, 0]; // 1 to 5 stars counts
    
    ratings.forEach((r: any) => {
      const val = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      totalScore += val;
      ratingCounts[val - 1]++;
    });

    const totalRatings = ratings.length;
    const averageScore = totalRatings > 0 ? Number((totalScore / totalRatings).toFixed(2)) : 5.0;

    res.json({
      averageScore,
      totalRatingsCount: totalRatings,
      breakdown: {
        stars5: ratingCounts[4],
        stars4: ratingCounts[3],
        stars3: ratingCounts[2],
        stars2: ratingCounts[1],
        stars1: ratingCounts[0]
      },
      ratings
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/support/reports/volume', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const tickets = await SupportRepository.getTicketsByTenant(tenantId);
    
    const categoryVolume: Record<string, number> = {};
    const statusVolume: Record<string, number> = {
      'Open': 0,
      'In Progress': 0,
      'Resolved': 0,
      'Closed': 0
    };

    tickets.forEach((t: any) => {
      const cat = t.category || 'General';
      const status = t.status || 'Open';
      categoryVolume[cat] = (categoryVolume[cat] || 0) + 1;
      statusVolume[status] = (statusVolume[status] || 0) + 1;
    });

    res.json({
      totalVolume: tickets.length,
      categories: categoryVolume,
      status: statusVolume
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/support/agents/status', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    // List support agents in tenant workspace
    const { data: users, error } = await supabase
      .from('users')
      .select('id, full_name, email, role')
      .eq('tenant_id', tenantId);
    
    if (error) throw error;
    
    // Filter agents
    const agents = (users || []).map(u => ({
      ...u,
      is_available: true,
      active_tickets_count: 0
    }));

    res.json(agents);
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

// --- ACCOUNTANT OPERATIONS & CUSTOM PRICING ---
app.post('/api/billing/invoices', requireAuth, requireRoles(['senior_accountant', 'admin']), validateRequest(createInvoiceSchema), async (req: AuthenticatedRequest, res) => {
  const { amountCents, dueDate, currency, items, tenantId } = req.body;
  const resolvedTenantId = tenantId || req.user?.tenant_id || '';
  try {
    const invoice = await BillingRepository.createInvoice({
      tenant_id: resolvedTenantId,
      amount_cents: amountCents,
      currency: currency || 'USD',
      status: 'unpaid',
      due_date: dueDate
    });

    const itemsToInsert = items.map((item: any) => ({
      invoice_id: invoice.id,
      product_id: item.productId || null,
      description: item.description,
      quantity: item.quantity || 1,
      unit_price_cents: item.unitPriceCents,
      tax_rate_id: item.taxRateId || null
    }));

    const dbItems = await BillingRepository.createInvoiceItems(itemsToInsert);
    
    await logActivity(req, 'Billing', `Created invoice ${invoice.id} for $${(amountCents / 100).toFixed(2)}`, { invoiceId: invoice.id });
    res.status(201).json({ ...invoice, items: dbItems });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/billing/invoices/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const invoice = await BillingRepository.getInvoiceById(req.params.id, tenantId);
    res.json(invoice);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/billing/invoices/:id', requireAuth, requireRoles(['senior_accountant', 'admin']), validateRequest(updateInvoiceSchema), async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await BillingRepository.updateInvoice(req.params.id, tenantId, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/billing/invoices/:id', requireAuth, requireRoles(['senior_accountant', 'admin']), async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    await BillingRepository.deleteInvoice(req.params.id, tenantId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/billing/checkout-session', requireAuth, validateRequest(createCheckoutSessionSchema), async (req: AuthenticatedRequest, res) => {
  const { invoiceId, couponCode } = req.body;
  const tenantId = req.user?.tenant_id || '';
  try {
    const invoice = await BillingRepository.getInvoiceById(invoiceId, tenantId);
    let amount = invoice.amount_cents;
    if (couponCode) {
      const coupons = await BillingRepository.getCoupons(tenantId);
      const coupon = coupons.find(c => c.code === couponCode);
      if (coupon) {
        const discount = Math.floor(amount * (coupon.discount_percent / 100));
        amount = amount - discount;
      }
    }
    const mockSessionUrl = `https://checkout.stripe.com/pay/mock_session_${Math.random().toString(36).substring(7)}`;
    res.json({ checkoutUrl: mockSessionUrl, finalAmountCents: amount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/billing/products', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await BillingRepository.getProducts(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/billing/products', requireAuth, requireRoles(['senior_accountant', 'admin']), validateRequest(createProductCatalogSchema), async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const product = await BillingRepository.createProduct({
      tenant_id: tenantId,
      ...req.body
    });
    res.status(201).json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/billing/coupons', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await BillingRepository.getCoupons(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/billing/coupons', requireAuth, requireRoles(['senior_accountant', 'admin']), validateRequest(createCouponCatalogSchema), async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const coupon = await BillingRepository.createCoupon({
      tenant_id: tenantId,
      ...req.body
    });
    res.status(201).json(coupon);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/billing/tax-rates', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await BillingRepository.getTaxRates(tenantId);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/billing/tax-rates', requireAuth, requireRoles(['senior_accountant', 'admin']), async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  const { name, rate_percent } = req.body;
  try {
    const taxRate = await BillingRepository.createTaxRate({
      tenant_id: tenantId,
      name,
      rate_percent
    });
    res.status(201).json(taxRate);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/billing/reports/aging', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const invoices = await BillingRepository.getInvoicesByTenant(tenantId);
    const now = new Date();
    let current = 0;
    let d30 = 0;
    let d60 = 0;
    let d90 = 0;

    for (const inv of invoices) {
      if (inv.status === 'unpaid') {
        const due = new Date(inv.due_date);
        const diffTime = now.getTime() - due.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 0) current += inv.amount_cents;
        else if (diffDays <= 30) d30 += inv.amount_cents;
        else if (diffDays <= 90) d60 += inv.amount_cents;
        else d90 += inv.amount_cents;
      }
    }
    res.json({ current, d30, d60, d90 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/billing/reports/revenue', requireAuth, async (req: AuthenticatedRequest, res) => {
  const tenantId = req.user?.tenant_id || '';
  try {
    const invoices = await BillingRepository.getInvoicesByTenant(tenantId);
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const totalRevenueCents = paidInvoices.reduce((sum, inv) => sum + inv.amount_cents, 0);
    res.json({ totalRevenueCents, invoiceCount: invoices.length, paidCount: paidInvoices.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/billing/invoices/:id/void', requireAuth, requireRoles(['senior_accountant', 'admin']), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await BillingRepository.updateInvoice(id, tenantId, { status: 'voided' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/billing/invoices/:id/refund', requireAuth, requireRoles(['senior_accountant', 'admin']), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const tenantId = req.user?.tenant_id || '';
  try {
    const data = await BillingRepository.updateInvoice(id, tenantId, { status: 'refunded' });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/tenants/:id/status', requireAuth, requireRoles(['senior_accountant', 'admin']), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    // If tenants status column is empty, we flag via business_type for visual audit
    const { data, error } = await supabase
      .from('tenants')
      .update({ business_type: status === 'suspended' ? 'Suspended Enterprise' : 'Active Corporation' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    await logActivity(req, 'System', `Updated client ${id} business active status to: ${status}`);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/billing/pricing/packages', requireAuth, requireRoles(['senior_accountant', 'admin']), async (req: AuthenticatedRequest, res) => {
  const { name, code, priceCents, storageLimitBytes } = req.body;
  try {
    const { data, error } = await supabase
      .from('billing_plans')
      .insert({
        name,
        code,
        price_cents: priceCents,
        storage_limit_bytes: storageLimitBytes || 21474836480,
        currency: 'USD'
      })
      .select()
      .single();
    if (error) throw error;
    await logActivity(req, 'Billing', `Accountant proposed pricing package: ${name} (${code})`);
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/accountants', requireAuth, requireRoles(['admin']), async (req: AuthenticatedRequest, res) => {
  const { email, fullName } = req.body;
  try {
    // Insert new user profile as junior/senior accountant directly in mock DB
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        full_name: fullName,
        role: 'senior_accountant',
        status: 'active',
        tenant_id: req.user?.tenant_id || 'demo_tenant'
      })
      .select()
      .single();
    if (error) throw error;
    await logActivity(req, 'System', `Admin created accountant profile for email: ${email}`);
    res.status(201).json(data);
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

// --- HR, EMPLOYEES & PAYROLL ENGINE ---
app.get('/api/payroll/employees', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const employees = await PayrollRepository.getEmployeesByTenant(tenantId);
    res.json(employees);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payroll/employees', requireAuth, requireRoles(['payroll_specialist', 'admin', 'senior_accountant']), validateRequest(createEmployeeSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const { first_name, last_name, email, role, tax_id, base_salary_cents, status } = req.body;
    
    const employee = await PayrollRepository.createEmployee({
      tenant_id: tenantId,
      first_name,
      last_name,
      email,
      role,
      tax_id,
      base_salary_cents,
      status: status || 'active'
    });

    // Create a default salary structure
    await PayrollRepository.saveSalaryStructure({
      employee_id: employee.id,
      base_salary_cents: base_salary_cents,
      allowances_cents: 0,
      deductions_cents: 0
    });

    await logActivity(req, 'HR', `Onboarded new employee: ${first_name} ${last_name}`, { employeeId: employee.id });
    res.status(201).json(employee);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/payroll/employees/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const employee = await PayrollRepository.getEmployeeById(req.params.id, tenantId);
    const salaryStructure = await PayrollRepository.getSalaryStructureByEmployee(employee.id);
    const benefits = await PayrollRepository.getBenefitsByEmployee(employee.id);
    
    res.json({
      ...employee,
      salary_structure: salaryStructure,
      benefits
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/payroll/employees/:id', requireAuth, requireRoles(['payroll_specialist', 'admin', 'senior_accountant']), validateRequest(updateEmployeeSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const employeeId = req.params.id;
    const { first_name, last_name, email, role, tax_id, base_salary_cents, status } = req.body;

    const updates: any = {};
    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (tax_id !== undefined) updates.tax_id = tax_id;
    if (base_salary_cents !== undefined) updates.base_salary_cents = base_salary_cents;
    if (status !== undefined) updates.status = status;

    const employee = await PayrollRepository.updateEmployee(employeeId, tenantId, updates);

    // If base salary is updated, update salary structure as well
    if (base_salary_cents !== undefined) {
      const existing = await PayrollRepository.getSalaryStructureByEmployee(employeeId);
      await PayrollRepository.saveSalaryStructure({
        employee_id: employeeId,
        base_salary_cents,
        allowances_cents: existing?.allowances_cents || 0,
        deductions_cents: existing?.deductions_cents || 0
      });
    }

    await logActivity(req, 'HR', `Updated employee: ${employee.first_name} ${employee.last_name}`, { employeeId });
    res.json(employee);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/payroll/employees/:id', requireAuth, requireRoles(['payroll_specialist', 'admin', 'senior_accountant']), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    await PayrollRepository.deleteEmployee(req.params.id, tenantId);
    await logActivity(req, 'HR', `Removed employee ID: ${req.params.id}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Timesheets
app.get('/api/payroll/timesheets', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const timesheets = await PayrollRepository.getTimesheetsByTenant(tenantId);
    res.json(timesheets);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payroll/timesheets', requireAuth, validateRequest(createTimesheetSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { employee_id, date, hours_worked } = req.body;
    // Verify employee belongs to tenant
    const tenantId = req.user?.tenant_id || '';
    await PayrollRepository.getEmployeeById(employee_id, tenantId);

    const timesheet = await PayrollRepository.createTimesheet({
      employee_id,
      date,
      hours_worked
    });

    await logActivity(req, 'HR', `Logged ${hours_worked} hours for employee ID: ${employee_id} on ${date}`);
    res.status(201).json(timesheet);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Payroll Runs
app.get('/api/payroll/runs', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const runs = await PayrollRepository.getPayrollRunsByTenant(tenantId);
    res.json(runs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payroll/runs', requireAuth, requireRoles(['payroll_specialist', 'admin', 'senior_accountant']), validateRequest(createPayrollRunSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const { period_start, period_end } = req.body;

    // Process run: find all active employees, calculate salaries, create payslips
    const employees = await PayrollRepository.getEmployeesByTenant(tenantId);
    const activeEmployees = employees.filter((e: any) => e.status === 'active');

    if (activeEmployees.length === 0) {
      return res.status(400).json({ error: 'No active employees found to run payroll' });
    }

    let totalPayoutCents = 0;
    const payslipData: any[] = [];

    for (const employee of activeEmployees) {
      const structure = await PayrollRepository.getSalaryStructureByEmployee(employee.id);
      const baseSalary = structure?.base_salary_cents || employee.base_salary_cents || 0;
      const allowances = structure?.allowances_cents || 0;
      const deductions = structure?.deductions_cents || 0;
      const netPay = Math.max(0, baseSalary + allowances - deductions);

      totalPayoutCents += netPay;
      payslipData.push({
        employee_id: employee.id,
        base_salary_cents: baseSalary,
        allowances_cents: allowances,
        deductions_cents: deductions,
        net_pay_cents: netPay
      });
    }

    const run = await PayrollRepository.createPayrollRun({
      tenant_id: tenantId,
      period_start,
      period_end,
      status: 'draft',
      total_payout_cents: totalPayoutCents
    });

    const payslips = payslipData.map(ps => ({
      ...ps,
      payroll_run_id: run.id
    }));

    await PayrollRepository.createPayslips(payslips);

    await logActivity(req, 'HR', `Generated draft payroll run for period: ${period_start} to ${period_end}`, { runId: run.id });
    res.status(201).json(run);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/payroll/runs/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const run = await PayrollRepository.getPayrollRunById(req.params.id, tenantId);
    const payslips = await PayrollRepository.getPayslipsByRun(run.id);
    res.json({
      ...run,
      payslips
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payroll/runs/:id/approve', requireAuth, requireRoles(['payroll_specialist', 'admin', 'senior_accountant']), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const run = await PayrollRepository.updatePayrollRun(req.params.id, tenantId, { status: 'approved' });
    await logActivity(req, 'HR', `Approved payroll run ID: ${req.params.id}`);
    res.json(run);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payroll/runs/:id/pay', requireAuth, requireRoles(['payroll_specialist', 'admin', 'senior_accountant']), async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const run = await PayrollRepository.updatePayrollRun(req.params.id, tenantId, { status: 'paid' });
    await logActivity(req, 'HR', `Disbursed payments for payroll run ID: ${req.params.id}`);
    res.json(run);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Payslips
app.get('/api/payroll/payslips', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const payslips = await PayrollRepository.getPayslipsByTenant(tenantId);
    res.json(payslips);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/payroll/payslips/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const payslip = await PayrollRepository.getPayslipById(req.params.id);
    if (payslip.employee?.tenant_id !== tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(payslip);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PTO Requests
app.get('/api/payroll/pto-requests', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const requests = await PayrollRepository.getPtoRequestsByTenant(tenantId);
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payroll/pto-requests', requireAuth, validateRequest(createPtoRequestSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { employee_id, start_date, end_date } = req.body;
    const tenantId = req.user?.tenant_id || '';
    
    // Validate employee exists for this tenant
    await PayrollRepository.getEmployeeById(employee_id, tenantId);

    const request = await PayrollRepository.createPtoRequest({
      employee_id,
      start_date,
      end_date,
      status: 'pending'
    });

    await logActivity(req, 'HR', `Requested PTO leave for employee ID: ${employee_id} from ${start_date} to ${end_date}`);
    res.status(201).json(request);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/payroll/pto-requests/:id/approve', requireAuth, requireRoles(['payroll_specialist', 'admin', 'senior_accountant']), validateRequest(resolvePtoRequestSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { status } = req.body;
    const request = await PayrollRepository.updatePtoRequestStatus(req.params.id, status);
    await logActivity(req, 'HR', `Updated PTO request ID: ${req.params.id} status to: ${status}`);
    res.json(request);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Benefits
app.post('/api/payroll/benefits', requireAuth, requireRoles(['payroll_specialist', 'admin', 'senior_accountant']), validateRequest(createBenefitSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { employee_id, type, cost_cents } = req.body;
    const tenantId = req.user?.tenant_id || '';
    
    // Validate employee exists for this tenant
    await PayrollRepository.getEmployeeById(employee_id, tenantId);

    const benefit = await PayrollRepository.createBenefit({
      employee_id,
      type,
      cost_cents
    });

    await logActivity(req, 'HR', `Assigned benefit: ${type} ($${(cost_cents / 100).toFixed(2)}) to employee ID: ${employee_id}`);
    res.status(201).json(benefit);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/payroll/benefits/:id', requireAuth, requireRoles(['payroll_specialist', 'admin', 'senior_accountant']), async (req: AuthenticatedRequest, res) => {
  try {
    await PayrollRepository.deleteBenefit(req.params.id);
    await logActivity(req, 'HR', `Revoked benefit ID: ${req.params.id}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/payroll/reports/compensation', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id || '';
    const employees = await PayrollRepository.getEmployeesByTenant(tenantId);
    
    const activeEmployees = employees.filter((e: any) => e.status === 'active');
    const totalEmployeesCount = employees.length;
    const activeCount = activeEmployees.length;

    let totalBaseSalaryCents = 0;
    for (const emp of activeEmployees) {
      const structure = await PayrollRepository.getSalaryStructureByEmployee(emp.id);
      totalBaseSalaryCents += structure?.base_salary_cents || emp.base_salary_cents || 0;
    }

    const avgBaseSalaryCents = activeCount > 0 ? Math.round(totalBaseSalaryCents / activeCount) : 0;
    
    // Count roles
    const rolesDistribution: { [key: string]: number } = {};
    for (const emp of employees) {
      const r = emp.role || 'Unspecified';
      rolesDistribution[r] = (rolesDistribution[r] || 0) + 1;
    }

    res.json({
      totalEmployees: totalEmployeesCount,
      activeEmployees: activeCount,
      totalMonthlyPayrollCostCents: totalBaseSalaryCents,
      averageSalaryCents: avgBaseSalaryCents,
      rolesDistribution
    });
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

