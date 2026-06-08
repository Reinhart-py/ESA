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



