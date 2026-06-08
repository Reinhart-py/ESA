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
