import React, { useState, useEffect, useRef, useContext } from 'react';
import { Search, Compass, Shield, CreditCard, Users, LogOut, Moon, Sun, Plus, FileUp, Sparkles, Terminal, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { AppContext } from '../../context/AppContext.tsx';
import { apiClient } from '../../api/client.ts';

interface CommandItem {
  icon: React.ReactNode;
  label: string;
  category: string;
  action: () => void;
  shortcut?: string;
}

export default function CommandPalette({ 
  isOpen, 
  onClose,
  setActiveSubTab 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  setActiveSubTab: (tab: string) => void;
}) {
  const context = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<{
    files: any[];
    tasks: any[];
    obligations: any[];
  }>({ files: [], tasks: [], obligations: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setActiveIndex(0);
      setSearchResults({ files: [], tasks: [], obligations: [] });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const navigationItems: CommandItem[] = [
    {
      icon: <Compass size={18} />,
      label: 'Go to Dashboard Overview',
      category: 'Navigation',
      action: () => { setActiveSubTab('dashboard'); onClose(); }
    },
    {
      icon: <Terminal size={18} />,
      label: 'Go to Secure Document Vault Pro',
      category: 'Navigation',
      action: () => { setActiveSubTab('documents'); onClose(); }
    },
    {
      icon: <Shield size={18} />,
      label: 'Go to Regional Compliance Desk',
      category: 'Navigation',
      action: () => { setActiveSubTab('compliance'); onClose(); }
    },
    {
      icon: <Sparkles size={18} />,
      label: 'Go to AI Co-pilot Engine',
      category: 'Navigation',
      action: () => { setActiveSubTab('ai_assistant'); onClose(); }
    },
    {
      icon: <CreditCard size={18} />,
      label: 'Go to Invoices & Plans',
      category: 'Navigation',
      action: () => { setActiveSubTab('billing'); onClose(); }
    },
    {
      icon: <Users size={18} />,
      label: 'Go to Team & Permissions',
      category: 'Navigation',
      action: () => { setActiveSubTab('team'); onClose(); }
    },
    {
      icon: <Moon size={18} />,
      label: 'Toggle UI Dark/Light Theme',
      category: 'System',
      action: () => { context?.toggleTheme(); onClose(); }
    },
    {
      icon: <FileUp size={18} />,
      label: 'Upload New Vault Document',
      category: 'Actions',
      action: () => { setActiveSubTab('documents'); onClose(); }
    }
  ];

  // Filter local navigation shortcuts
  const filteredNavigation = navigationItems.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  // Debounced API Search for files, tasks, obligations
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults({ files: [], tasks: [], obligations: [] });
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await apiClient.get(`/search?q=${encodeURIComponent(search)}`);
        setSearchResults(res.data || { files: [], tasks: [], obligations: [] });
      } catch (err) {
        console.error('Error fetching global search results:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // Combine local navigation items with backend entity results
  const items: CommandItem[] = [...filteredNavigation];

  searchResults.files.forEach(file => {
    items.push({
      icon: <FileText size={18} style={{ color: '#60a5fa' }} />,
      label: `Open File: ${file.name}`,
      category: 'Vault Files',
      action: () => {
        setActiveSubTab('documents');
        onClose();
      }
    });
  });

  searchResults.tasks.forEach(task => {
    items.push({
      icon: <CheckCircle size={18} style={{ color: '#10b981' }} />,
      label: `Task: ${task.title} - ${task.description || ''}`,
      category: 'Workspace Tasks',
      action: () => {
        setActiveSubTab('dashboard');
        onClose();
      }
    });
  });

  searchResults.obligations.forEach(ob => {
    items.push({
      icon: <AlertTriangle size={18} style={{ color: '#fbbf24' }} />,
      label: `Obligation: ${ob.title}`,
      category: 'Compliance Obligations',
      action: () => {
        setActiveSubTab('compliance');
        onClose();
      }
    });
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[activeIndex]) {
        items[activeIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
        zIndex: 9999,
        animation: 'fadeIn 0.15s ease'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '600px',
          background: 'rgba(30, 41, 59, 0.95)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Search header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Search size={20} style={{ color: '#64748b' }} />
          <input 
            ref={inputRef}
            type="text"
            placeholder="Type a command or search workspace entities..."
            value={search}
            onChange={e => { setSearch(e.target.value); setActiveIndex(0); }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#64748b' }}>ESC</span>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '0.5rem' }}>
          {searchLoading && items.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
              Searching workspace indexes...
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
              No commands or entities found for "{search}"
            </div>
          ) : (
            items.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div 
                  key={idx}
                  onClick={item.action}
                  onMouseEnter={() => setActiveIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                    <span style={{ color: isActive ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                    <span style={{ 
                      color: isActive ? '#fff' : '#cbd5e1', 
                      fontSize: '0.9rem', 
                      fontWeight: isActive ? 'bold' : 'normal',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      maxWidth: '380px'
                    }}>
                      {item.label}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.7rem', color: isActive ? '#10b981' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

