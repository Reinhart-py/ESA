import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    businessName: z.string().min(2, 'Business name must be at least 2 characters'),
    businessType: z.string().min(2, 'Business type must be at least 2 characters')
  })
});

export const uploadDocumentSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'File name is required'),
    sizeBytes: z.number().positive('Size must be greater than zero'),
    category: z.string().min(1, 'Category is required'),
    mimeType: z.string().min(1, 'Mime-type is required'),
    fileData: z.string().min(1, 'Base64 file data payload is required'),
    folderId: z.string().uuid().nullable().optional()
  })
});

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Task title is required'),
    description: z.string().optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
    priority: z.enum(['Low', 'Medium', 'High', 'Urgent'])
  })
});

export const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Message content cannot be empty'),
    threadId: z.string().uuid('Invalid thread ID')
  })
});

export const createTicketSchema = z.object({
  body: z.object({
    subject: z.string().min(1, 'Subject is required'),
    description: z.string().min(1, 'Description details are required'),
    category: z.string().min(1, 'Category is required'),
    priority: z.enum(['Low', 'Medium', 'High'])
  })
});

export const createInviteSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    role: z.string().min(1, 'Role is required')
  })
});

export const acceptInviteSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    userId: z.string().uuid('Invalid user ID'),
    fullName: z.string().min(2, 'Name must be at least 2 characters')
  })
});

export const createAccountSchema = z.object({
  body: z.object({
    accountNumber: z.string().min(1, 'Account number is required'),
    name: z.string().min(1, 'Account name is required'),
    type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
    parentId: z.string().uuid().nullable().optional()
  })
});

export const createJournalEntrySchema = z.object({
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    description: z.string().min(1, 'Description is required'),
    lines: z.array(z.object({
      accountId: z.string().uuid('Invalid account ID'),
      entryType: z.enum(['debit', 'credit']),
      amountCents: z.number().int().positive('Amount must be positive')
    })).min(2, 'At least two transaction lines are required')
  })
});

export const createExpenseSchema = z.object({
  body: z.object({
    accountId: z.string().uuid('Invalid account ID').nullable().optional(),
    amountCents: z.number().int().positive('Amount must be positive'),
    merchant: z.string().min(1, 'Merchant name is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    description: z.string().optional().nullable(),
    receiptFileId: z.string().uuid('Invalid receipt file ID').nullable().optional()
  })
});

export const linkReceiptSchema = z.object({
  body: z.object({
    receiptFileId: z.string().uuid('Invalid receipt file ID')
  })
});

export const createCompliancePackSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Pack name is required'),
    countryCode: z.string().min(2, 'Country code is required'),
    authority: z.string().min(1, 'Tax authority name is required'),
    description: z.string().optional(),
    rules: z.array(z.object({
      title: z.string().min(1, 'Obligation title is required'),
      due_month: z.number().int().min(1).max(12),
      due_day: z.number().int().min(1).max(31),
      type: z.enum(['GST', 'VAT', 'TDS', 'Corporate Tax', 'Payroll Tax', 'Company Return', 'License Renewal', 'Regulatory Filing', 'Audit'])
    })).min(1, 'At least one filing calendar rule is required')
  })
});

export const subscribePackSchema = z.object({
  body: z.object({
    packId: z.string().uuid('Invalid pack ID')
  })
});

export const submitEvidenceSchema = z.object({
  body: z.object({
    evidenceFileId: z.string().uuid('Invalid evidence file ID'),
    comments: z.string().optional().nullable()
  })
});

export const reviewSubmissionSchema = z.object({
  body: z.object({
    action: z.enum(['approve', 'reject']),
    comments: z.string().optional().nullable()
  })
});

export const shareDocumentSchema = z.object({
  body: z.object({
    fileId: z.string().uuid('Invalid file ID'),
    expiresInHours: z.number().positive('Expiry hours must be positive').optional().default(24)
  })
});

export const createESignRequestSchema = z.object({
  body: z.object({
    fileId: z.string().uuid('Invalid file ID'),
    signerEmail: z.string().email('Invalid email address')
  })
});

export const esignDocumentSchema = z.object({
  body: z.object({
    signatureText: z.string().min(1, 'Signature text is required')
  })
});

export const bulkDownloadSchema = z.object({
  query: z.object({
    fileIds: z.string().min(1, 'At least one file ID is required') // comma-separated query param
  })
});

export const createApiKeySchema = z.object({
  body: z.object({
    keyName: z.string().min(1, 'API key name is required'),
    expiresInDays: z.number().int().positive().optional().default(30)
  })
});

export const createWebhookConfigSchema = z.object({
  body: z.object({
    url: z.string().url('Invalid webhook URL endpoint'),
    secret: z.string().min(8, 'HMAC signature secret must be at least 8 characters')
  })
});

export const onboardProfessionalSchema = z.object({
  body: z.object({
    bio: z.string().min(1, 'Professional bio is required'),
    hourlyRateCents: z.number().int().nonnegative('Hourly rate cannot be negative'),
    specializations: z.array(z.string()).min(1, 'Select at least one specialization tag')
  })
});

export const createServiceRequestSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(10, 'Provide a detailed description of the services required'),
    category: z.string().min(1, 'Category is required'),
    budgetCents: z.number().int().nonnegative('Budget cannot be negative')
  })
});

export const createQuoteSchema = z.object({
  body: z.object({
    amountCents: z.number().int().positive('Quote bid amount must be positive'),
    proposal: z.string().min(10, 'Provide a detailed service proposal')
  })
});

export const signContractSchema = z.object({
  body: z.object({
    signatureText: z.string().min(2, 'Provide a valid digital signature name')
  })
});

export const createLeadSchema = z.object({
  body: z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    company: z.string().optional(),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    source: z.string().optional(),
    assigned_to: z.string().uuid('Invalid user ID').optional()
  })
});

export const updateLeadSchema = z.object({
  body: z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    company: z.string().optional(),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().optional(),
    source: z.string().optional(),
    status: z.enum(['new', 'contacted', 'qualified', 'nurturing', 'lost']).optional(),
    assigned_to: z.string().uuid('Invalid user ID').optional()
  })
});

export const createContactSchema = z.object({
  body: z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    job_title: z.string().optional(),
    account_id: z.string().uuid('Invalid account ID').optional()
  })
});

export const createDealSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Deal title is required'),
    amount_cents: z.number().int().positive('Amount must be positive'),
    stage: z.string().optional(),
    probability: z.number().int().min(0).max(100).optional(),
    assigned_to: z.string().uuid('Invalid user ID').optional(),
    account_id: z.string().uuid('Invalid account ID').optional()
  })
});

export const logActivitySchema = z.object({
  body: z.object({
    lead_id: z.string().uuid('Invalid lead ID').optional(),
    deal_id: z.string().uuid('Invalid deal ID').optional(),
    activity_type: z.string().min(1, 'Activity type is required'),
    subject: z.string().min(1, 'Subject is required'),
    details: z.string().optional()
  })
});

export const createInvoiceSchema = z.object({
  body: z.object({
    amountCents: z.number().int().positive('Amount must be positive'),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
    currency: z.string().optional().default('USD'),
    items: z.array(z.object({
      productId: z.string().uuid().optional().nullable(),
      description: z.string().min(1, 'Item description is required'),
      quantity: z.number().int().positive().optional().default(1),
      unitPriceCents: z.number().int().positive('Unit price must be positive'),
      taxRateId: z.string().uuid().optional().nullable()
    })).min(1, 'At least one line item is required')
  })
});

export const updateInvoiceSchema = z.object({
  body: z.object({
    status: z.enum(['paid', 'unpaid', 'voided']).optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format').optional()
  })
});

export const createCheckoutSessionSchema = z.object({
  body: z.object({
    invoiceId: z.string().uuid('Invalid invoice ID'),
    couponCode: z.string().optional()
  })
});

export const createProductCatalogSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required'),
    price_cents: z.number().int().positive('Price must be positive'),
    sku: z.string().optional()
  })
});

export const createCouponCatalogSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Coupon code is required'),
    discount_percent: z.number().int().min(0).max(100),
    expires_at: z.string().optional()
  })
});

export const createEmployeeSchema = z.object({
  body: z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    role: z.string().optional(),
    tax_id: z.string().min(1, 'Tax ID is required'),
    base_salary_cents: z.number().int().nonnegative('Base salary must be non-negative'),
    status: z.enum(['active', 'suspended', 'terminated']).optional()
  })
});

export const updateEmployeeSchema = z.object({
  body: z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().email('Invalid email address').optional(),
    role: z.string().optional(),
    tax_id: z.string().optional(),
    base_salary_cents: z.number().int().nonnegative('Base salary must be non-negative').optional(),
    status: z.enum(['active', 'suspended', 'terminated']).optional()
  })
});

export const createTimesheetSchema = z.object({
  body: z.object({
    employee_id: z.string().uuid('Invalid employee ID'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    hours_worked: z.number().min(0).max(24, 'Hours worked must be between 0 and 24')
  })
});

export const createPayrollRunSchema = z.object({
  body: z.object({
    period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
    period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
  })
});

export const createPtoRequestSchema = z.object({
  body: z.object({
    employee_id: z.string().uuid('Invalid employee ID'),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
  })
});

export const resolvePtoRequestSchema = z.object({
  body: z.object({
    status: z.enum(['approved', 'rejected'])
  })
});

export const createBenefitSchema = z.object({
  body: z.object({
    employee_id: z.string().uuid('Invalid employee ID'),
    type: z.string().min(1, 'Benefit type/name is required'),
    cost_cents: z.number().int().nonnegative('Cost must be non-negative')
  })
});

export const createObligationSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
    type: z.enum(['GST', 'VAT', 'TDS', 'Corporate Tax', 'Payroll Tax', 'Company Return', 'License Renewal', 'Regulatory Filing', 'Audit']),
    assignedSpecialistId: z.string().uuid('Invalid user ID').nullable().optional(),
    notes: z.string().optional(),
    complianceScoreImpact: z.number().int().min(0).max(100).optional().default(10)
  })
});

export const createTicketReplySchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Reply content cannot be empty')
  })
});

export const createSlaRuleSchema = z.object({
  body: z.object({
    priority: z.string().min(1, 'Priority name is required'),
    response_time_hours: z.number().int().positive('Response hours must be positive'),
    resolution_time_hours: z.number().int().positive('Resolution hours must be positive')
  })
});

export const createSupportCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required'),
    description: z.string().optional()
  })
});

export const createKbArticleSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    category: z.string().optional(),
    is_published: z.boolean().optional()
  })
});

export const updateKbArticleSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    category: z.string().optional(),
    is_published: z.boolean().optional()
  })
});

export const createCsatRatingSchema = z.object({
  body: z.object({
    ticket_id: z.string().uuid('Invalid ticket ID'),
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
    feedback: z.string().optional()
  })
});

export const createTenantAdminSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    business_type: z.string().min(2, 'Business type must be at least 2 characters'),
    country: z.string().length(2, 'Country code must be exactly 2 characters').optional().default('US'),
    storage_limit_bytes: z.number().int().positive('Storage limit must be positive').optional().default(10737418240)
  })
});

export const suspendTenantSchema = z.object({
  body: z.object({
    reason: z.string().min(5, 'Suspension reason must be at least 5 characters')
  })
});

export const updateSystemParameterSchema = z.object({
  body: z.object({
    key: z.string().min(1, 'Parameter key is required'),
    value: z.string().min(1, 'Parameter value is required'),
    description: z.string().optional()
  })
});

export const addIpWhitelistSchema = z.object({
  body: z.object({
    ip_address: z.string().min(1, 'IP address is required'),
    description: z.string().optional()
  })
});

export const setRateLimitSchema = z.object({
  body: z.object({
    apiKeyId: z.string().uuid('Invalid API key ID'),
    maxRequestsPerMinute: z.number().int().positive('Rate limit must be at least 1')
  })
});

export const mfaVerifySchema = z.object({
  body: z.object({
    code: z.string().min(6, 'TOTP verification code must be at least 6 digits').max(8, 'TOTP code cannot exceed 8 digits')
  })
});

export const saveSearchSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Saved search name is required'),
    query: z.string().min(1, 'Query parameter is required'),
    filters: z.any().optional()
  })
});

export const aiChatSchema = z.object({
  body: z.object({
    query: z.string().min(1, 'AI chat prompt query is required')
  })
});

export const embedDocSchema = z.object({
  body: z.object({
    documentId: z.string().uuid('Invalid document file ID'),
    chunks: z.array(z.object({
      content: z.string().min(1, 'Chunk content is required')
    })).min(1, 'At least one document text chunk is required')
  })
});





