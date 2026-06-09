import React from 'react';
import { HelpCircle } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div 
      className="flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-lg"
      style={{
        borderColor: 'var(--card-border)',
        borderRadius: 'var(--border-radius-md)',
        padding: '3rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--card-bg)'
      }}
    >
      <div 
        style={{ 
          marginBottom: '1rem',
          color: 'var(--accent-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {icon || <HelpCircle size={44} />}
      </div>
      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h4>
      <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', color: 'var(--text-sec)', maxWidth: '320px', lineHeight: 1.5 }}>
        {description}
      </p>
      {action && (
        <button 
          onClick={action.onClick}
          className="btn btn-teal"
          style={{
            padding: '0.5rem 1.25rem',
            background: 'var(--accent-color)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--border-radius-sm)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
