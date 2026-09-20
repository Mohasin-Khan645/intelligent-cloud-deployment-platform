import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { deploymentsAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner, { EmptyState } from '../components/LoadingSpinner';
import { Rocket, RefreshCw, GitCommit, ArrowRight, Filter } from 'lucide-react';

const Deployments = () => {
  const [deployments, setDeployments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [envFilter, setEnvFilter] = useState('ALL');

  const fetchDeployments = async () => {
    try {
      setIsLoading(true);
      const res = await deploymentsAPI.getAll();
      setDeployments(res.data.data || []);
    } catch (err) {
      console.error('Failed to load deployments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '-';
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now - past;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHour < 24) return `${diffHour} hr ago`;
    return `${diffDay} days ago`;
  };

  const calculateDuration = (startStr, endStr) => {
    if (!startStr) return '-';
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : new Date();
    const sec = Math.max(1, Math.round((end - start) / 1000));
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    const remSec = sec % 60;
    return `${min}m ${remSec}s`;
  };

  const filteredDeployments = deployments.filter((d) => {
    if (envFilter === 'ALL') return true;
    return d.environment.toUpperCase() === envFilter.toUpperCase();
  });

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Rocket size={26} style={{ color: '#38BDF8' }} />
            <span>Deployments History</span>
          </h1>
          <p className="page-subtitle">
            Immutable audit record of all multi-environment rollout operations
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Environment Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--bg-card)', padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Environments</option>
              <option value="Development">Development</option>
              <option value="Staging">Staging</option>
              <option value="Production">Production</option>
            </select>
          </div>

          <button onClick={fetchDeployments} className="btn btn-secondary btn-sm" title="Refresh list">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Retrieving deployment ledger..." />
      ) : filteredDeployments.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Commit</th>
                <th>Project</th>
                <th>Environment</th>
                <th>Status</th>
                <th>Started</th>
                <th>Duration</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeployments.map((dep) => (
                <tr key={dep.id}>
                  <td>
                    <span style={{ fontWeight: 600, color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>
                      {dep.version}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <GitCommit size={13} />
                      {dep.commit_sha}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500, color: '#FFFFFF' }}>
                      {dep.project_name || 'Application Service'}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      fontSize: '0.8rem',
                      color: '#E2E8F0'
                    }}>
                      {dep.environment}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={dep.status} />
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {formatRelativeTime(dep.started_at)}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {calculateDuration(dep.started_at, dep.completed_at)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      to={`/deployments/${dep.id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.3rem 0.6rem' }}
                    >
                      <span>Inspect</span>
                      <ArrowRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Rocket}
          title="No deployments found"
          description="Deployments executed through the platform will be logged here."
        />
      )}
    </div>
  );
};

export default Deployments;

