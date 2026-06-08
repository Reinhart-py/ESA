import React, { createContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { apiClient } from '../api/client.js';
import { Tenant, User, Folder, FileDocument, ComplianceObligation, Task, Message, SupportTicket, AuditLog, Subscription, Invoice } from '../types/index.js';

interface AppContextType {
  userRole: string;
  setUserRole: (role: string) => void;
  themeMode: string;
  toggleTheme: () => void;
  syncState: () => Promise<void>;
  supabaseClient: any;
  sessionToken: string | null;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  folders: Folder[];
  files: FileDocument[];
  obligations: ComplianceObligation[];
  tasks: Task[];
  messages: Message[];
  tickets: SupportTicket[];
  auditLogs: AuditLog[];
  subscription: Subscription | null;
  invoices: Invoice[];
  createFolder: (name: string, parentId?: string | null) => Promise<void>;
  uploadFile: (name: string, sizeBytes: number, category: string, mimeType: string, base64Data: string, folderId?: string | null) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  sendMessage: (content: string, threadId: string) => Promise<void>;
  createTask: (title: string, description: string, dueDate: string, priority: string, assignedTo?: string) => Promise<void>;
  createTicket: (subject: string, description: string, category: string, priority: string) => Promise<void>;
  updateObligationStatus: (obligationId: string, status: string) => Promise<void>;
}

export const AppContext = createContext<AppContextType | null>(null);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<string>(() => localStorage.getItem('eac_role') || 'guest');
  const [themeMode, setThemeMode] = useState<string>(() => localStorage.getItem('eac_theme') || 'light');
  const [sessionToken, setSessionToken] = useState<string | null>(() => localStorage.getItem('supabase_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [obligations, setObligations] = useState<ComplianceObligation[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Monitor Supabase Auth State
  useEffect(() => {
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        localStorage.setItem('supabase_token', session.access_token);
        setSessionToken(session.access_token);
        
        try {
          // Fetch current user details from profile endpoint
          const res = await apiClient.get('/users');
          if (res.data && res.data.length > 0) {
            const matchedUser = res.data.find((u: any) => u.id === session.user.id);
            if (matchedUser) {
              setCurrentUser(matchedUser);
              setUserRole(matchedUser.role);
            }
          }
        } catch (err) {
          console.error('Error fetching profile on auth change:', err);
        }
      } else {
        localStorage.removeItem('supabase_token');
        setSessionToken(null);
        setCurrentUser(null);
        setUserRole('guest');
      }
    });
  }, []);

  const syncState = async () => {
    if (!sessionToken) return;
    try {
      const [docRes, complianceRes, taskRes, msgRes, ticketRes, auditRes, subRes, invoiceRes] = await Promise.all([
        apiClient.get('/documents'),
        apiClient.get('/compliance/obligations'),
        apiClient.get('/tasks'),
        apiClient.get('/messages'),
        apiClient.get('/support/tickets'),
        apiClient.get('/audit-logs').catch(() => ({ data: [] })),
        apiClient.get('/billing/subscription').catch(() => ({ data: null })),
        apiClient.get('/billing/invoices').catch(() => ({ data: [] }))
      ]);

      setFolders(docRes.data.folders || []);
      setFiles(docRes.data.files || []);
      setObligations(complianceRes.data || []);
      setTasks(taskRes.data || []);
      setMessages(msgRes.data.messages || []);
      setTickets(ticketRes.data || []);
      setAuditLogs(auditRes.data || []);
      setSubscription(subRes.data);
      setInvoices(invoiceRes.data || []);
    } catch (err) {
      console.error('Failed to synchronize app state with DB APIs:', err);
    }
  };

  useEffect(() => {
    if (sessionToken) {
      syncState();
    }
  }, [sessionToken]);

  useEffect(() => {
    localStorage.setItem('eac_role', userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('eac_theme', themeMode);
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const createFolder = async (name: string, parentId: string | null = null) => {
    await apiClient.post('/documents/folder', { name, parentId });
    await syncState();
  };

  const uploadFile = async (
    name: string,
    sizeBytes: number,
    category: string,
    mimeType: string,
    base64Data: string,
    folderId: string | null = null
  ) => {
    await apiClient.post('/documents/upload', {
      name,
      sizeBytes,
      category,
      mimeType,
      fileData: base64Data,
      folderId
    });
    await syncState();
  };

  const deleteFile = async (fileId: string) => {
    await apiClient.delete(`/documents/file/${fileId}`);
    await syncState();
  };

  const sendMessage = async (content: string, threadId: string) => {
    await apiClient.post('/messages/send', { content, threadId });
    await syncState();
  };

  const createTask = async (
    title: string,
    description: string,
    dueDate: string,
    priority: string,
    assignedTo?: string
  ) => {
    await apiClient.post('/tasks', { title, description, dueDate, priority, assignedTo });
    await syncState();
  };

  const createTicket = async (subject: string, description: string, category: string, priority: string) => {
    await apiClient.post('/support/ticket', { subject, description, category, priority });
    await syncState();
  };

  const updateObligationStatus = async (obligationId: string, status: string) => {
    await apiClient.post('/compliance/status', { obligationId, status });
    await syncState();
  };

  return (
    <AppContext.Provider
      value={{
        userRole,
        setUserRole,
        themeMode,
        toggleTheme,
        syncState,
        supabaseClient,
        sessionToken,
        currentUser,
        setCurrentUser,
        folders,
        files,
        obligations,
        tasks,
        messages,
        tickets,
        auditLogs,
        subscription,
        invoices,
        createFolder,
        uploadFile,
        deleteFile,
        sendMessage,
        createTask,
        createTicket,
        updateObligationStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
