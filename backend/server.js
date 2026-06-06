import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { StorageService } from './services/storageService.js';
import { EmailService } from './services/emailService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Diagnostic status route
app.get('/api/status', (req, res) => {
  res.json({
    status: "online",
    storageProvider: StorageService.getProviderName(),
    databaseHost: process.env.SUPABASE_URL ? "Supabase Cloud" : "In-Memory Instance",
    timestamp: new Date().toISOString()
  });
});

// Mock relational DB state (synchronized with client context)
let dbClients = [
  { id: 'c1', name: 'Apex Logistics Ltd', businessType: 'Logistics', status: 'Late', filingType: 'Q3 Corporate Tax', lastActivity: '2 hours ago', ownerName: 'Thomas Shelby', complianceScore: 78, revenue: '$2.4M', assignedProfessional: 'p1' },
  { id: 'c2', name: 'Skyline Tech Solutions', businessType: 'SaaS / Startups', status: 'Needs Review', filingType: 'Annual Audit', lastActivity: 'Yesterday', ownerName: 'Elon Stark', complianceScore: 92, revenue: '$4.1M', assignedProfessional: 'p2' }
];

let dbFolders = [
  { id: 'f1', name: 'Tax Filings', parentId: null, clientId: 'c1' },
  { id: 'f2', name: 'Bank Statements', parentId: null, clientId: 'c1' }
];

let dbFiles = [
  { id: 'doc1', name: 'Q3_Corporate_Tax_Draft.pdf', folderId: 'f1', clientId: 'c1', size: '2.4 MB', uploadedBy: 'Thomas Shelby', uploadedAt: '2026-06-05', status: 'Reviewing', category: 'Taxation', version: 1, storageKey: 'gdrive_path_1' }
];

let dbObligations = [
  { id: 'ob1', clientId: 'c1', title: 'Q3 VAT Deadline', dueDate: '2026-10-15', status: 'Late', type: 'GST/VAT', assignedTo: 'p1', notes: 'Need client to upload invoices for missing shipping transactions.' },
  { id: 'ob2', clientId: 'c1', title: 'PAYE Submission', dueDate: '2026-10-19', status: 'On Track', type: 'Payroll', assignedTo: 'p3', notes: 'Payroll spreadsheet processed, awaiting validation.' }
];

let dbMessages = [
  { id: 'm1', threadId: 't1', senderId: 'c1', senderName: 'Thomas Shelby', content: 'Hi Arthur, I uploaded the Q3 bank statements.', timestamp: '2 hours ago' }
];

let dbTickets = [
  { id: 'tkt1', clientId: 'c1', subject: 'Discrepancy in Payroll calculation', priority: 'High', status: 'Open', category: 'Payroll', createdAt: '2026-06-05' }
];

let dbAuditLogs = [];

// Helper to append logs
const appendLog = (action, category, user = "System") => {
  dbAuditLogs.unshift({
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    user,
    action,
    category
  });
};

// --- API ENDPOINTS ---

// 1. Documents API
app.get('/api/documents', (req, res) => {
  res.json({ folders: dbFolders, files: dbFiles });
});

app.post('/api/documents/folder', (req, res) => {
  const { name, parentId, clientId } = req.body;
  const newFolder = { id: `f_${Date.now()}`, name, parentId, clientId };
  dbFolders.push(newFolder);
  appendLog(`Created folder: ${name}`, 'Files');
  res.status(201).json(newFolder);
});

// Pre-sign file upload handler (Swappable storage endpoint)
app.post('/api/documents/upload-presign', async (req, res) => {
  const { fileName, category, clientId } = req.body;
  try {
    const uploadDescriptor = await StorageService.getUploadEndpoint(fileName, category, clientId);
    res.json(uploadDescriptor);
  } catch (err) {
    res.status(500).json({ error: "Storage pre-sign failed: " + err.message });
  }
});

// Google Drive simulated storage uploader
app.post('/api/documents/upload-drive-mock', (req, res) => {
  const { name, size, folderId, category, clientId, fileKey } = req.body;
  const newFile = {
    id: `doc_${Date.now()}`,
    name,
    folderId,
    clientId,
    size,
    uploadedBy: 'Thomas Shelby',
    uploadedAt: new Date().toISOString().split('T')[0],
    status: 'Reviewing',
    category,
    version: 1,
    storageKey: fileKey
  };
  dbFiles.push(newFile);
  appendLog(`Uploaded file: ${name} to Google Drive`, 'Files');
  res.status(201).json(newFile);
});

app.delete('/api/documents/file/:id', async (req, res) => {
  const fileId = req.params.id;
  const fileIndex = dbFiles.findIndex(f => f.id === fileId);
  if (fileIndex !== -1) {
    const file = dbFiles[fileIndex];
    await StorageService.deleteObject(file.storageKey, 'eac-solutions-vault');
    dbFiles.splice(fileIndex, 1);
    appendLog(`Deleted document: ${file.name}`, 'Files');
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

// 2. Compliance API
app.get('/api/compliance/obligations', (req, res) => {
  res.json(dbObligations);
});

app.post('/api/compliance/status', async (req, res) => {
  const { obligationId, status } = req.body;
  dbObligations = dbObligations.map(ob => {
    if (ob.id === obligationId) {
      if (status === 'Late') {
        // Trigger Resend email dispatcher warning
        EmailService.sendDeadlineNotification(
          "finance@apexlogistics.com",
          "Thomas Shelby",
          ob.title,
          ob.dueDate
        );
      }
      return { ...ob, status };
    }
    return ob;
  });
  appendLog(`Updated obligation status to ${status}`, 'Compliance');
  res.json({ success: true });
});

// 3. Messages & Chats API
app.get('/api/messages', (req, res) => {
  res.json(dbMessages);
});

app.post('/api/messages/send', (req, res) => {
  const { content, senderId, senderName, threadId } = req.body;
  const newMsg = {
    id: `msg_${Date.now()}`,
    threadId,
    senderId,
    senderName,
    content,
    timestamp: "Just now"
  };
  dbMessages.push(newMsg);
  res.status(201).json(newMsg);
});

// 4. Invoices & Audits
app.get('/api/audit-logs', (req, res) => {
  res.json(dbAuditLogs);
});

app.post('/api/support/ticket', (req, res) => {
  const { subject, category, priority } = req.body;
  const newTkt = {
    id: `tkt_${Date.now()}`,
    clientId: 'c1',
    subject,
    priority,
    status: 'Open',
    category,
    createdAt: new Date().toISOString().split('T')[0]
  };
  dbTickets.push(newTkt);
  appendLog(`Created support ticket: ${subject}`, 'Support');
  res.status(201).json(newTkt);
});

app.listen(PORT, () => {
  console.log(`EAC Solutions server running on http://localhost:${PORT}`);
});
