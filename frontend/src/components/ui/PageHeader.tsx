import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div 
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '2rem',
        borderBottom: '1px solid var(--card-border)',
        paddingBottom: '1.5rem'
      }}
    >
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </h1>
        {description && (
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-sec)' }}>
            {description}
          </p>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}
