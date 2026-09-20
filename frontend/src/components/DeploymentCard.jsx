import React from 'react';
import { Link } from 'react-router-dom';
import { GitCommit, Clock, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';

const DeploymentCard = ({ deployment }) => {
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.85rem 1rem',
      backgroundColor: 'var(--bg-main)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '8px',
      gap: '1rem',
      transition: 'all 0.15s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <StatusBadge status={deployment.status} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
              {deployment.version}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              • {deployment.project_name || 'Service'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontFamily: 'var(--font-mono)' }}>
              <GitCommit size={12} />
              {deployment.commit_sha}
            </span>
            <span>Env: <strong style={{ color: '#94A3B8' }}>{deployment.environment}</strong></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={12} />
              {formatTime(deployment.started_at)}
            </span>
          </div>
        </div>
      </div>

      <Link
        to={`/deployments/${deployment.id}`}
        className="btn btn-secondary btn-sm"
        style={{ padding: '0.35rem 0.6rem' }}
      >
        <ArrowRight size={14} />
      </Link>
    </div>
  );
};

export default DeploymentCard;

