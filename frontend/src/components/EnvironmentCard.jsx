import React from 'react';
import { Globe, Clock, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

const EnvironmentCard = ({ environment }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not deployed yet';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isHealthy = environment.status === 'Healthy';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF' }}>
              {environment.name}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Project: {environment.project_name || 'Demo Application'}
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.65rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 600,
            backgroundColor: isHealthy ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
            color: isHealthy ? '#34D399' : '#FB7185',
            border: `1px solid ${isHealthy ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`
          }}>
            {isHealthy ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
            <span>● {environment.status}</span>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-main)',
          padding: '0.85rem',
          borderRadius: '6px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.825rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Active Version:</span>
            <span style={{ color: '#38BDF8', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {environment.current_version || 'v1.0.0'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.825rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>URL:</span>
            <a
              href={environment.application_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#94A3B8',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.775rem'
              }}
              onClick={(e) => {
                // If it's internal/placeholder, prevent navigating away unless valid
                if (!environment.application_url?.startsWith('http')) {
                  e.preventDefault();
                }
              }}
            >
              <Globe size={12} />
              <span>{environment.application_url || 'https://placeholder.internal'}</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        <Clock size={13} />
        <span>Last Deployment: {formatDate(environment.last_deployed_at)}</span>
      </div>
    </div>
  );
};

export default EnvironmentCard;

