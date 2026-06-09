import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(2, 6, 23, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--border-radius-md)',
          padding: '2rem',
          boxShadow: 'var(--shadow-card)',
          color: 'var(--text-primary)'
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div style={{ color: 'var(--color-danger)', flexShrink: 0 }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: 800 }}>{title}</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-sec)', lineHeight: 1.5 }}>{message}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '0.5rem 1.25rem',
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--border-radius-sm)',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            {cancelLabel}
          </button>
          <button 
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1.25rem',
              background: 'var(--color-danger)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--border-radius-sm)',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
