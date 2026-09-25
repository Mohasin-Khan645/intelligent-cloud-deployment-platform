import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { deploymentsAPI, githubAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner, { EmptyState } from '../components/LoadingSpinner';
import {
  Rocket,
  RefreshCw,
  GitCommit,
  ArrowRight,
  Filter,
  CheckCircle2,
  XCircle,
  Activity
} from 'lucide-react';

const Deployments = () => {
  const [deployments, setDeployments] = useState([]);
  const [liveStatus, setLiveStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveLoading, setIsLiveLoading] = useState(true);
  const [envFilter, setEnvFilter] = useState('ALL');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployMessage, setDeployMessage] = useState('');
  const [deployError, setDeployError] = useState('');


  const handleDeploy = async () => {
  const confirmed = window.confirm(
    'Start a new Production deployment for Demo Application Service from the main branch?'
  );

  if (!confirmed) {
    return;
  }

  try {
    setIsDeploying(true);
    setDeployMessage('');
    setDeployError('');

    const response =
      await githubAPI.triggerDeployment({
        project_id: 1,
        environment: 'Production',
        branch: 'main'
      });

    const data = response.data?.data;

    setDeployMessage(
      `Deployment started successfully. GitHub Actions run #${data?.github?.runNumber || '-'} is now queued.`
    );

    await refreshAll();

  } catch (error) {
    console.error(
      'Failed to trigger deployment:',
      error
    );

    setDeployError(
      error.response?.data?.error ||
      'Failed to start deployment.'
    );
  } finally {
    setIsDeploying(false);
  }
};

  const hasActiveDeployment = deployments.some((deployment) =>
    ['QUEUED', 'BUILDING', 'DEPLOYING', 'HEALTH_CHECK'].includes(
      deployment.status
    )
  );

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

  const fetchLiveStatus = async () => {
    try {
      setIsLiveLoading(true);

      const res = await deploymentsAPI.getLiveStatus();

      setLiveStatus(res.data.data || null);
    } catch (err) {
      console.error('Failed to load live deployment status:', err);
      setLiveStatus(null);
    } finally {
      setIsLiveLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([
      fetchDeployments(),
      fetchLiveStatus()
    ]);
  };

  useEffect(() => {
    refreshAll();

    const interval = setInterval(() => {
      fetchLiveStatus();
    }, 10000);

    return () => clearInterval(interval);
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

    if (diffSec < 60) return `${Math.max(0, diffSec)}s ago`;
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

    return (
      d.environment &&
      d.environment.toUpperCase() === envFilter.toUpperCase()
    );
  });

  const getLiveStatus = () => {
    if (!liveStatus) return 'UNKNOWN';

    if (liveStatus.status) {
      return liveStatus.status;
    }

    if (liveStatus.healthy === true) {
      return 'SUCCESS';
    }

    if (liveStatus.healthy === false) {
      return 'FAILED';
    }

    return 'UNKNOWN';
  };

  const liveDeploymentStatus = getLiveStatus();

  const githubStatus =
    liveStatus?.github?.status ||
    liveStatus?.github?.conclusion ||
    'UNKNOWN';

  const ecsHealthy =
    liveStatus?.ecs?.healthy === true;

  const albHealthy =
    liveStatus?.alb?.healthy === true;

  return (
    <div className="page-wrapper">

      {/* PAGE HEADER */}
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

        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center'
          }}
        >
          {/* Environment Filter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'var(--bg-card)',
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <Filter
              size={14}
              style={{ color: 'var(--text-muted)' }}
            />

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

          <button
            onClick={handleDeploy}
            className="btn btn-primary btn-sm"
            disabled={isDeploying || hasActiveDeployment}
            title={
              hasActiveDeployment
                ? 'A deployment is already in progress'
                : 'Trigger a new deploymnet'
            }
            >
              <Rocket
                size={14}
                className={isDeploying ? 'spin' : ''}
                />
                <span>
                  {isDeploying
                    ? 'Deploying...'
                    : hasActiveDeployment
                      ? 'Deployment Running'
                      : 'Deploy'}
                </span>
            </button>

          <button
            onClick={refreshAll}
            className="btn btn-secondary btn-sm"
            title="Refresh list"
          >
            <RefreshCw
              size={14}
              className={isLoading ? 'spin' : ''}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* REAL AWS / GITHUB STATUS */}
      <div
        style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.85rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Activity
              size={18}
              style={{ color: '#38BDF8' }}
            />

            <span
              style={{
                fontWeight: 600,
                color: '#FFFFFF'
              }}
            >
              Live Deployment Status
            </span>
          </div>

          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)'
            }}
          >
            Auto-refresh: 10s
          </span>
        </div>

        {isLiveLoading && !liveStatus ? (
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.85rem'
            }}
          >
            Checking GitHub, ECS and ALB status...
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem'
            }}
          >

            {/* Overall */}
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(255,255,255,0.03)'
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.3rem'
                }}
              >
                OVERALL
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                {liveDeploymentStatus === 'SUCCESS' ? (
                  <CheckCircle2
                    size={16}
                    style={{ color: '#22C55E' }}
                  />
                ) : (
                  <XCircle
                    size={16}
                    style={{ color: '#EF4444' }}
                  />
                )}

                <span
                  style={{
                    fontWeight: 600,
                    color:
                      liveDeploymentStatus === 'SUCCESS'
                        ? '#22C55E'
                        : '#E2E8F0'
                  }}
                >
                  {liveDeploymentStatus}
                </span>
              </div>
            </div>

            {/* GitHub */}
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(255,255,255,0.03)'
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.3rem'
                }}
              >
                GITHUB ACTIONS
              </div>

              <span
                style={{
                  fontWeight: 600,
                  color:
                    githubStatus === 'SUCCESS'
                      ? '#22C55E'
                      : githubStatus === 'FAILED'
                        ? '#EF4444'
                        : '#E2E8F0'
                }}
              >
                {githubStatus}
              </span>
            </div>

            {/* ECS */}
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(255,255,255,0.03)'
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.3rem'
                }}
              >
                AWS ECS
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                {ecsHealthy ? (
                  <CheckCircle2
                    size={15}
                    style={{ color: '#22C55E' }}
                  />
                ) : (
                  <XCircle
                    size={15}
                    style={{ color: '#EF4444' }}
                  />
                )}

                <span
                  style={{
                    fontWeight: 600,
                    color: ecsHealthy
                      ? '#22C55E'
                      : '#E2E8F0'
                  }}
                >
                  {ecsHealthy ? 'HEALTHY' : 'UNHEALTHY'}
                </span>
              </div>
            </div>

            {/* ALB */}
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(255,255,255,0.03)'
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.3rem'
                }}
              >
                ALB / TARGET
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                {albHealthy ? (
                  <CheckCircle2
                    size={15}
                    style={{ color: '#22C55E' }}
                  />
                ) : (
                  <XCircle
                    size={15}
                    style={{ color: '#EF4444' }}
                  />
                )}

                <span
                  style={{
                    fontWeight: 600,
                    color: albHealthy
                      ? '#22C55E'
                      : '#E2E8F0'
                  }}
                >
                  {albHealthy ? 'HEALTHY' : 'UNHEALTHY'}
                </span>
              </div>
            </div>

          </div>
        )}

        {liveStatus?.timestamp && (
          <div
            style={{
              marginTop: '0.75rem',
              fontSize: '0.7rem',
              color: 'var(--text-muted)'
            }}
          >
            Last checked:{' '}
            {new Date(liveStatus.timestamp).toLocaleString()}
          </div>
        )}
      </div>

      {/* DEPLOYMENT HISTORY */}
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
                <th style={{ textAlign: 'right' }}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredDeployments.map((dep) => (
                <tr key={dep.id}>

                  {/* Version */}
                  <td>
                    <span
                      style={{
                        fontWeight: 600,
                        color: '#38BDF8',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {dep.version}
                    </span>
                  </td>

                  {/* Commit */}
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <GitCommit size={13} />
                      {dep.commit_sha}
                    </span>
                  </td>

                  {/* Project */}
                  <td>
                    <span
                      style={{
                        fontWeight: 500,
                        color: '#FFFFFF'
                      }}
                    >
                      {dep.project_name ||
                        'Application Service'}
                    </span>
                  </td>

                  {/* Environment */}
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor:
                          'rgba(255, 255, 255, 0.05)',
                        fontSize: '0.8rem',
                        color: '#E2E8F0'
                      }}
                    >
                      {dep.environment}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    <StatusBadge status={dep.status} />
                  </td>

                  {/* Started */}
                  <td
                    style={{
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {formatRelativeTime(dep.started_at)}
                  </td>

                  {/* Duration */}
                  <td
                    style={{
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem'
                    }}
                  >
                    {calculateDuration(
                      dep.started_at,
                      dep.completed_at
                    )}
                  </td>

                  {/* Action */}
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      to={`/deployments/${dep.id}`}
                      className="btn btn-secondary btn-sm"
                      style={{
                        padding: '0.3rem 0.6rem'
                      }}
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