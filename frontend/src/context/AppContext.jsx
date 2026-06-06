import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

const API_BASE = "http://localhost:5000/api";

const initialProfessionals = [
  { id: 'p1', name: 'Arthur Pendelton', role: 'Lead Chartered Accountant', specialty: 'Corporate Taxation & Auditing', email: 'arthur.p@eacsolutions.com', phone: '+1 (555) 019-2831', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120' },
  { id: 'p2', name: 'Sarah Jenkins', role: 'Compliance Specialist', specialty: 'GST & TDS Regulatory Filings', email: 'sarah.j@eacsolutions.com', phone: '+1 (555) 019-2832', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120' },
  { id: 'p3', name: 'David Miller', role: 'Senior Bookkeeper', specialty: 'Payroll Operations & Reporting', email: 'david.m@eacsolutions.com', phone: '+1 (555) 019-2833', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120' }
];

const initialClients = [
  { id: 'c1', name: 'Apex Logistics Ltd', businessType: 'Logistics', status: 'Late', filingType: 'Q3 Corporate Tax', lastActivity: '2 hours ago', ownerName: 'Thomas Shelby', complianceScore: 78, revenue: '$2.4M', assignedProfessional: 'p1' },
  { id: 'c2', name: 'Skyline Tech Solutions', businessType: 'SaaS / Startups', status: 'Needs Review', filingType: 'Annual Audit', lastActivity: 'Yesterday', ownerName: 'Elon Stark', complianceScore: 92, revenue: '$4.1M', assignedProfessional: 'p2' },
  { id: 'c3', name: 'Veridian Ventures', businessType: 'Consulting', status: 'On Track', filingType: 'Payroll Processing', lastActivity: '3 days ago', ownerName: 'Diana Prince', complianceScore: 98, revenue: '$850K', assignedProfessional: 'p3' },
  { id: 'c4', name: 'Merit Builders', businessType: 'Manufacturing', status: 'On Track', filingType: 'VAT Submission', lastActivity: '5 days ago', ownerName: 'Bruce Wayne', complianceScore: 95, revenue: '$12.5M', assignedProfessional: 'p1' }
];

export const AppProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(() => localStorage.getItem('eac_role') || 'guest');
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('eac_theme') || 'light');
  
  const [clients, setClients] = useState(initialClients);
  const [professionals] = useState(initialProfessionals);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [bookings, setBookings] = useState(() => JSON.parse(localStorage.getItem('eac_bookings')) || []);
  const [auditLogs, setAuditLogs] = useState([]);

  // Fetch all state from full-stack backend
  const syncState = async () => {
    try {
      const docRes = await fetch(`${API_BASE}/documents`);
      if (docRes.ok) {
        const docData = await docRes.json();
        setFolders(docData.folders);
        setFiles(docData.files);
      }

      const complianceRes = await fetch(`${API_BASE}/compliance/obligations`);
      if (complianceRes.ok) {
        const complianceData = await complianceRes.json();
        setObligations(complianceData);
      }

      const msgRes = await fetch(`${API_BASE}/messages`);
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setMessages(msgData);
      }

      const logRes = await fetch(`${API_BASE}/audit-logs`);
      if (logRes.ok) {
        const logData = await logRes.json();
        setAuditLogs(logData);
      }
    } catch (err) {
      console.log("Full-stack backend offline. Running in browser sandbox context mode.", err);
    }
  };

  useEffect(() => {
    localStorage.setItem('eac_role', userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('eac_theme', themeMode);
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem('eac_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    syncState();
  }, []);

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  // API Call Helpers
  const createFolder = async (name, parentId = null, clientId = 'c1') => {
    try {
      const res = await fetch(`${API_BASE}/documents/folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId, clientId })
      });
      if (res.ok) {
        syncState();
        return;
      }
    } catch (e) {
      console.error(e);
    }
    const newFolder = { id: 'f_' + Date.now(), name, parentId, clientId };
    setFolders(prev => [...prev, newFolder]);
  };

  const uploadFile = async (name, size, folderId, category = 'General', clientId = 'c1') => {
    try {
      const presignRes = await fetch(`${API_BASE}/documents/upload-presign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: name, category, clientId })
      });
      
      if (presignRes.ok) {
        const descriptor = await presignRes.json();
        const uploadRes = await fetch(`${API_BASE}/documents/upload-drive-mock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name, size, folderId, category, clientId, fileKey: descriptor.fileKey
          })
        });
        if (uploadRes.ok) {
          syncState();
          return;
        }
      }
    } catch (e) {
      console.error("Upload process error", e);
    }

    const newFile = {
      id: 'doc_' + Date.now(),
      name, folderId, clientId, size,
      uploadedBy: 'Thomas Shelby',
      uploadedAt: new Date().toISOString().split('T')[0],
      status: 'Reviewing', category, version: 1
    };
    setFiles(prev => [...prev, newFile]);
  };

  const deleteFile = async (fileId) => {
    try {
      const res = await fetch(`${API_BASE}/documents/file/${fileId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        syncState();
        return;
      }
    } catch (e) {
      console.error(e);
    }
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const addMessage = async (threadId, content, senderId, senderName) => {
    try {
      const res = await fetch(`${API_BASE}/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, content, senderId, senderName })
      });
      if (res.ok) {
        syncState();
        return;
      }
    } catch (e) {
      console.error(e);
    }
    const newMessage = { id: 'msg_' + Date.now(), threadId, senderId, senderName, content, timestamp: 'Just now' };
    setMessages(prev => [...prev, newMessage]);
  };

  const addTicket = async (subject, category, priority) => {
    try {
      const res = await fetch(`${API_BASE}/support/ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, category, priority })
      });
      if (res.ok) {
        syncState();
        return;
      }
    } catch (e) {
      console.error(e);
    }
    const newTicket = { id: 'tkt_' + Date.now(), clientId: 'c1', subject, priority, status: 'Open', category, createdAt: new Date().toISOString().split('T')[0] };
    setTickets(prev => [...prev, newTicket]);
  };

  const updateTicketStatus = async (ticketId, status) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
  };

  const updateObligationStatus = async (obId, status) => {
    try {
      const res = await fetch(`${API_BASE}/compliance/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ obligationId: obId, status })
      });
      if (res.ok) {
        syncState();
        return;
      }
    } catch (e) {
      console.error(e);
    }
    setObligations(prev => prev.map(o => o.id === obId ? { ...o, status } : o));
  };

  const bookConsultation = (service, date, time, notes) => {
    const newBooking = {
      id: 'bk_' + Date.now(),
      clientId: 'c1',
      service, date, time, notes,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Confirmed'
    };
    setBookings(prev => [...prev, newBooking]);
    return newBooking;
  };

  return (
    <AppContext.Provider value={{
      userRole,
      setUserRole,
      themeMode,
      toggleTheme,
      clients,
      setClients,
      professionals,
      folders,
      files,
      obligations,
      messages,
      tickets,
      bookings,
      auditLogs,
      createFolder,
      uploadFile,
      deleteFile,
      addMessage,
      addTicket,
      updateTicketStatus,
      updateObligationStatus,
      bookConsultation
    }}>
      {children}
    </AppContext.Provider>
  );
};
