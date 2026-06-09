import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
}

interface ToastProps extends ToastMessage {
  onClose: (id: string) => void;
}

export default function Toast({ id, type, title, message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const icons = {
    success: <CheckCircle className="text-emerald-500" size={20} />,
    warning: <AlertTriangle className="text-amber-500" size={20} />,
    error: <XCircle className="text-red-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />
  };

  const borders = {
    success: 'border-l-4 border-emerald-500',
    warning: 'border-l-4 border-amber-500',
    error: 'border-l-4 border-red-500',
    info: 'border-l-4 border-blue-500'
  };

  return (
    <div 
      className={`premium-card flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${borders[type]} animate-fade-in`}
      style={{
        width: '320px',
        pointerEvents: 'auto',
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
      }}
    >
      <div style={{ flexShrink: 0, marginTop: '2px' }}>{icons[type]}</div>
      <div style={{ flexGrow: 1 }}>
        <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h5>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-sec)', lineHeight: 1.4 }}>{message}</p>
      </div>
      <button 
        onClick={() => onClose(id)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
