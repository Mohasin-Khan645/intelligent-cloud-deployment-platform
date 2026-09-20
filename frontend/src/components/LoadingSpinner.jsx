import React from 'react';
import { Loader2, FolderKanban } from 'lucide-react';

export const LoadingSpinner = ({ text = 'Loading pipeline data...' }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem',
      gap: '1rem',
      color: 'var(--text-secondary)'
    }}>
      <Loader2 className="animate-spin" size={32} style={{ color: 'var(--border-focus)' }} />
      <p style={{ fontSize: '0.9rem', letterSpacing: '0.025em' }}>{text}</p>
    </div>
  );
};

export const EmptyState = ({
  icon: Icon = FolderKanban,
  title = 'No records found',
  description = 'Get started by creating your first entry.',
  action = null
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      backgroundColor: 'var(--bg-card)',
      border: '1px dashed var(--border-light)',
      borderRadius: '10px',
      textAlign: 'center',
      gap: '1rem'
    }}>
      <div style={{
        padding: '1rem',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        color: 'var(--text-muted)'
      }}>
        <Icon size={36} />
      </div>
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '0.35rem' }}>{title}</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '400px' }}>{description}</p>
      </div>
      {action && <div style={{ marginTop: '0.5rem' }}>{action}</div>}
    </div>
  );
};

export default LoadingSpinner;

