import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught boundary error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-color)',
            color: 'var(--text-primary)',
            fontFamily: 'sans-serif',
            padding: '2rem',
            textAlign: 'center'
          }}
        >
          <div style={{ color: 'var(--color-danger)', marginBottom: '1.5rem' }}>
            <AlertTriangle size={48} />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 1rem 0' }}>Something went wrong</h1>
          <p style={{ margin: '0 0 2rem 0', color: 'var(--text-sec)', fontSize: '0.95rem', maxWidth: '400px', lineHeight: 1.5 }}>
            An unexpected error occurred in this workspace. Please click the button below to retry or reload the platform console.
          </p>
          <button 
            onClick={this.handleReset}
            className="btn btn-teal"
            style={{
              padding: '0.75rem 2rem',
              background: 'var(--accent-color)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--border-radius-sm)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <RotateCcw size={16} /> Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
