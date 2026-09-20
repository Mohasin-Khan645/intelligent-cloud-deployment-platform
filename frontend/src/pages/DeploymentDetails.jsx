import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { deploymentsAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import DeploymentTimeline from '../components/DeploymentTimeline';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ArrowLeft,
  GitCommit,
  Clock,
  Layers,
  TerminalSquare,
  AlertTriangle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

const DeploymentDetails = () => {
  const { id } = useParams();
  const [deployment, setDeployment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetails = async () => {
    try {
      const res = await deploymentsAPI.getById(id);
      setDeployment(res.data.data);
    } catch (err) {
      console.error('Failed to load deployment details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();

    // Auto-poll if deployment is still running
    const interval = setInterval(() => {
      if (deployment && ['QUEUED', 'BUILDING', 'DEPLOYING'].includes(deployment.status)) {
        fetchDetails();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [id, deployment?.status]);

  if (isLoading || !deployment) {
    return <LoadingSpinner text="Loading pipeline inspection details..." />;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Pending...';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="page-wrapper">
      {/* Back button */}
      <Link to="/deployments" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        fontSize: '0.85rem',
        marginBottom: '1rem'
      }}>
        <ArrowLeft size={16} />
        <span>Back to Deployments</span>
      </Link>

      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 className="page-title">
              Deployment #{deployment.id}
            </h1>
            <span style={{ fontSize: '1.25rem', color: '#38BDF8', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {deployment.version}
            </span>
            <StatusBadge status={deployment.status} />
          </div>
          <p className="page-subtitle">
            Project: <strong style={{ color: '#FFFFFF' }}>{deployment.project_name || 'Service'}</strong> • Target: <strong style={{ color: '#FFFFFF' }}>{deployment.environment}</strong>
          </p>
        </div>

        <button onClick={fetchDetails} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Overview Metadata Grid */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Commit SHA</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', color: '#FFFFFF' }}>
              <GitCommit size={16} style={{ color: '#38BDF8' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{deployment.commit_sha}</span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Environment</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', color: '#FFFFFF' }}>
              <Layers size={16} style={{ color: '#10B981' }} />
              <span style={{ fontWeight: 600 }}>{deployment.environment}</span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Started At</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', color: '#FFFFFF' }}>
              <Clock size={16} style={{ color: '#94A3B8' }} />
              <span style={{ fontSize: '0.85rem' }}>{formatDate(deployment.started_at)}</span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completed At</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', color: '#FFFFFF' }}>
              <CheckCircle2 size={16} style={{ color: deployment.completed_at ? '#10B981' : '#64748B' }} />
              <span style={{ fontSize: '0.85rem' }}>{formatDate(deployment.completed_at)}</span>
            </div>
          </div>
        </div>

        {deployment.error_message && (
          <div style={{
            marginTop: '1.25rem',
            padding: '0.85rem 1rem',
            backgroundColor: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '6px',
            color: '#FB7185',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>Error: {deployment.error_message}</span>
          </div>
        )}
      </div>

      {/* Pipeline Stepper & Live Execution Logs */}
      <div className="grid-cols-2">
        {/* Timeline */}
        <DeploymentTimeline status={deployment.status} />

        {/* Live Execution Logs */}
        <div className="terminal-window">
          <div className="terminal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="terminal-dots">
                <span className="terminal-dot" style={{ backgroundColor: '#EF4444' }}></span>
                <span className="terminal-dot" style={{ backgroundColor: '#F59E0B' }}></span>
                <span className="terminal-dot" style={{ backgroundColor: '#10B981' }}></span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                build-deploy-stream.log
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>STREAM READY</span>
            </div>
          </div>

          <div className="terminal-body">
            {deployment.logs && deployment.logs.length > 0 ? (
              deployment.logs.map((line, index) => {
                const isError = line.includes('[ERROR]');
                const isWarn = line.includes('[WARN]');
                const isSuccess = line.includes('[SUCCESS]');
                return (
                  <div key={index} className="log-line">
                    <span style={{
                      color: isError ? '#F43F5E' : isWarn ? '#FBBF24' : isSuccess ? '#34D399' : '#CBD5E1'
                    }}>
                      {line}
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>Waiting for container stream logs...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentDetails;

