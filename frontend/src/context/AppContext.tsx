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
  setSessionToken: (token: string | null) => void;
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
  webConfig: { WEBSITE_TITLE: string; WEBSITE_LOGO: string; CONTACT_EMAIL: string; CONTACT_PHONE: string };
}

export const AppContext = createContext<AppContextType | null>(null);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE1OTg4ODMwMDAsImV4cCI6MTkwNDQ2OTAwMH0.placeholder';

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<string>(() => localStorage.getItem('eac_role') || 'guest');
  const [themeMode, setThemeMode] = useState<string>(() => localStorage.getItem('eac_theme') || 'light');
  const [sessionToken, setSessionToken] = useState<string | null>(() => localStorage.getItem('supabase_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [webConfig, setWebConfig] = useState<any>({
    WEBSITE_TITLE: 'EAC Solutions',
    WEBSITE_LOGO: '/favicon.svg',
    CONTACT_EMAIL: 'support@eacsolutions.com',
    CONTACT_PHONE: '+1 (555) 019-2834'
  });

  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [obligations, setObligations] = useState<ComplianceObligation[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Fetch whitelabel configuration on mount
  useEffect(() => {
    apiClient.get('/public/config')
      .then(res => {
        if (res.data) setWebConfig(res.data);
      })
      .catch(err => console.error('Failed to load website config:', err));
  }, []);

  // Monitor Supabase Auth State
  useEffect(() => {
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        localStorage.setItem('supabase_token', session.access_token);
        setSessionToken(session.access_token);
      } else {
        const currentToken = localStorage.getItem('supabase_token');
        if (currentToken !== 'demo_token' && !currentToken?.startsWith('demo_')) {
          localStorage.removeItem('supabase_token');
          setSessionToken(null);
          setCurrentUser(null);
          setUserRole('guest');
        }
      }
    });
  }, []);

  // Fetch current user details from profile endpoint or set demo user
  useEffect(() => {
    const loadProfile = async () => {
      if (!sessionToken) return;
      if (sessionToken === 'demo_token' || sessionToken.startsWith('demo_')) {
        const storedRole = localStorage.getItem('eac_role') || 'client_owner';
        setCurrentUser({
          id: 'demo_user',
          tenant_id: 'demo_tenant',
          email: 'demo@eac.local',
          full_name: 'Demo User',
          role: storedRole as any,
          status: 'active',
          created_at: new Date().toISOString()
        } as any);
        setUserRole(storedRole);
        return;
      }
      try {
        const res = await apiClient.get('/users');
        if (res.data && res.data.length > 0) {
          const matchedUser = res.data[0];
          setCurrentUser(matchedUser);
          setUserRole(matchedUser.role);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };
    loadProfile();
  }, [sessionToken]);

  const syncState = async () => {
    if (!sessionToken) return;
    try {
      const [docRes, complianceRes, taskRes, msgRes, ticketRes, auditRes, subRes, invoiceRes, configRes] = await Promise.all([
        apiClient.get('/documents').catch(() => ({ data: { folders: [], files: [] } })),
        apiClient.get('/compliance/obligations').catch(() => ({ data: [] })),
        apiClient.get('/tasks').catch(() => ({ data: [] })),
        apiClient.get('/messages').catch(() => ({ data: { messages: [] } })),
        apiClient.get('/support/tickets').catch(() => ({ data: [] })),
        apiClient.get('/audit-logs').catch(() => ({ data: [] })),
        apiClient.get('/billing/subscription').catch(() => ({ data: null })),
        apiClient.get('/billing/invoices').catch(() => ({ data: [] })),
        apiClient.get('/public/config').catch(() => null)
      ]);

      setFolders(docRes.data?.folders || []);
      setFiles(docRes.data?.files || []);
      setObligations(Array.isArray(complianceRes.data) ? complianceRes.data : []);
      setTasks(Array.isArray(taskRes.data) ? taskRes.data : []);
      setMessages(msgRes.data?.messages || Array.isArray(msgRes.data) ? msgRes.data : []);
      setTickets(Array.isArray(ticketRes.data) ? ticketRes.data : []);
      setAuditLogs(Array.isArray(auditRes.data) ? auditRes.data : []);
      setSubscription(subRes.data);
      setInvoices(Array.isArray(invoiceRes.data) ? invoiceRes.data : []);
      if (configRes && configRes.data) {
        setWebConfig(configRes.data);
      }
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
        setSessionToken,
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
        webConfig,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
