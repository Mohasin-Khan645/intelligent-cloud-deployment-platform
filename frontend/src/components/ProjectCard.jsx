import React from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, Github, Rocket, ExternalLink, Calendar } from 'lucide-react';
import StatusBadge from './StatusBadge';

const ProjectCard = ({ project, onDeployClick }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <Link
              to={`/projects/${project.id}`}
              style={{
                fontSize: '1.15rem',
                fontWeight: 600,
                color: '#FFFFFF',
                textDecoration: 'none',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.target.style.color = '#38BDF8')}
              onMouseLeave={(e) => (e.target.style.color = '#FFFFFF')}
            >
              {project.name}
            </Link>
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              marginTop: '0.35rem',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {project.description || 'No description provided.'}
            </p>
          </div>
          <StatusBadge status={project.last_deployment_status || 'SUCCESS'} />
        </div>

        {/* Repository & Branch */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          padding: '0.75rem',
          backgroundColor: 'var(--bg-main)',
          borderRadius: '6px',
          margin: '1rem 0',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <Github size={14} style={{ color: '#94A3B8' }} />
            <span style={{ fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.github_repository}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38BDF8' }}>
              <GitBranch size={13} />
              <span style={{ fontFamily: 'var(--font-mono)' }}>{project.github_branch || 'main'}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Ver: <span style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>{project.current_version || 'v1.0.0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Details & Action */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={13} />
            <span>Deployed: {formatDate(project.last_deployed_at)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => onDeployClick && onDeployClick(project)}
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
          >
            <Rocket size={14} />
            <span>Deploy</span>
          </button>
          <Link
            to={`/projects/${project.id}`}
            className="btn btn-secondary btn-sm"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;

