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
  RefreshCw,
  RotateCcw,
  ExternalLink,
  Github,
  Cloud,
  ListChecks
} from 'lucide-react';

const DeploymentDetails = () => {
  const { id } = useParams();

  const [deployment, setDeployment] = useState(null);
  const [githubLogs, setGithubLogs] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchDetails = async () => {
    try {
      const res = await deploymentsAPI.getById(id);
      setDeployment(res.data.data);
    } catch (err) {
      console.error('Failed to load deployment details:', err);
      setActionError('Failed to load deployment details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setActionMessage('');
      setActionError('');

      await deploymentsAPI.syncStatus(id);

      setActionMessage('Deployment status synchronized successfully.');

      await fetchDetails();
    } catch (err) {
      console.error('Failed to synchronize deployment:', err);

      setActionError(
        err.response?.data?.error ||
        'Failed to synchronize deployment status.'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGitHubLogs = async () => {
    try {
      setIsLoadingLogs(true);
      setActionMessage('');
      setActionError('');

      const res = await deploymentsAPI.getGitHubLogs(id);

      setGithubLogs(res.data.data);

      setActionMessage('GitHub Actions logs loaded successfully.');
    } catch (err) {
      console.error('Failed to load GitHub logs:', err);

      setActionError(
        err.response?.data?.error ||
        'Unable to load GitHub Actions logs.'
      );
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleRollback = async () => {
    if (deployment.status !== 'SUCCESS') {
      setActionError(
        'Only a successful deployment can be rolled back.'
      );
      return;
    }

    const confirmed = window.confirm(
      `Rollback deployment #${deployment.id} (${deployment.version})?\n\n` +
      'This will update the ECS service to the previous task definition revision.'
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsRollingBack(true);
      setActionMessage('');
      setActionError('');

      const res = await deploymentsAPI.rollback(id);

      setActionMessage(
        res.data.message ||
        'Deployment rolled back successfully.'
      );

      await fetchDetails();
    } catch (err) {
      console.error('Rollback failed:', err);

      const errorMessage =
        err.response?.data?.error ||
        'Rollback failed. Check AWS ECS status and backend logs.';

      setActionError(errorMessage);

      /*
       * The backend may successfully update ECS but lose the HTTP
       * response while waiting for AWS ECS to become stable.
       *
       * Refresh the deployment state after a rollback error so the
       * UI can still show the latest database state.
       */
      await fetchDetails();
    } finally {
      setIsRollingBack(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  useEffect(() => {
    if (
      !deployment ||
      !['QUEUED', 'BUILDING', 'DEPLOYING', 'HEALTH_CHECK'].includes(
        deployment.status
      )
    ) {
      return undefined;
    }

    const interval = setInterval(() => {
      fetchDetails();
    }, 5000);

    return () => clearInterval(interval);
  }, [id, deployment?.status]);

  if (isLoading || !deployment) {
    return (
      <LoadingSpinner text="Loading pipeline inspection details..." />
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Pending...';

    const d = new Date(dateStr);

    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const github = deployment.github || null;

  return (
    <div className="page-wrapper">

      {/* Back button */}
      <Link
        to="/deployments"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          fontSize: '0.85rem',
          marginBottom: '1rem'
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Deployments</span>
      </Link>

      {/* Header */}
      <div className="page-header">
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}
          >
            <h1 className="page-title">
              Deployment #{deployment.id}
            </h1>

            <span
              style={{
                fontSize: '1.25rem',
                color: '#38BDF8',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600
              }}
            >
              {deployment.version}
            </span>

            <StatusBadge status={deployment.status} />
          </div>

          <p className="page-subtitle">
            Project:{' '}
            <strong style={{ color: '#FFFFFF' }}>
              {deployment.project_name || 'Service'}
            </strong>
            {' • '}
            Target:{' '}
            <strong style={{ color: '#FFFFFF' }}>
              {deployment.environment}
            </strong>
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={fetchDetails}
            className="btn btn-secondary btn-sm"
            disabled={isSyncing || isRollingBack}
          >
            <RefreshCw
              size={14}
              className={isLoading ? 'spin' : ''}
            />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleSync}
            className="btn btn-secondary btn-sm"
            disabled={isSyncing || isRollingBack}
          >
            <RefreshCw
              size={14}
              className={isSyncing ? 'spin' : ''}
            />
            <span>
              {isSyncing ? 'Syncing...' : 'Sync Status'}
            </span>
          </button>

          {deployment.status === 'SUCCESS' && (
            <button
              onClick={handleRollback}
              className="btn btn-secondary btn-sm"
              disabled={isRollingBack || isSyncing}
              style={{
                borderColor: 'rgba(245, 158, 11, 0.45)',
                color: '#FBBF24'
              }}
            >
              <RotateCcw
                size={14}
                className={isRollingBack ? 'spin' : ''}
              />
              <span>
                {isRollingBack ? 'Rolling Back...' : 'Rollback'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Action messages */}
      {actionMessage && (
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '0.85rem 1rem',
            backgroundColor: 'rgba(16, 185, 129, 0.10)',
            border: '1px solid rgba(16, 185, 129, 0.30)',
            borderRadius: '6px',
            color: '#34D399',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <CheckCircle2 size={16} />
          <span>{actionMessage}</span>
        </div>
      )}

      {actionError && (
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '0.85rem 1rem',
            backgroundColor: 'rgba(244, 63, 94, 0.10)',
            border: '1px solid rgba(244, 63, 94, 0.30)',
            borderRadius: '6px',
            color: '#FB7185',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <AlertTriangle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Overview Metadata Grid */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {/* Commit */}
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase'
              }}
            >
              Commit SHA
            </span>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginTop: '0.35rem',
                color: '#FFFFFF'
              }}
            >
              <GitCommit
                size={16}
                style={{ color: '#38BDF8' }}
              />

              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600
                }}
              >
                {deployment.commit_sha}
              </span>
            </div>
          </div>

          {/* Environment */}
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase'
              }}
            >
              Environment
            </span>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginTop: '0.35rem',
                color: '#FFFFFF'
              }}
            >
              <Layers
                size={16}
                style={{ color: '#10B981' }}
              />

              <span style={{ fontWeight: 600 }}>
                {deployment.environment}
              </span>
            </div>
          </div>

          {/* Started */}
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase'
              }}
            >
              Started At
            </span>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginTop: '0.35rem',
                color: '#FFFFFF'
              }}
            >
              <Clock
                size={16}
                style={{ color: '#94A3B8' }}
              />

              <span style={{ fontSize: '0.85rem' }}>
                {formatDate(deployment.started_at)}
              </span>
            </div>
          </div>

          {/* Completed */}
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase'
              }}
            >
              Completed At
            </span>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginTop: '0.35rem',
                color: '#FFFFFF'
              }}
            >
              <CheckCircle2
                size={16}
                style={{
                  color: deployment.completed_at
                    ? '#10B981'
                    : '#64748B'
                }}
              />

              <span style={{ fontSize: '0.85rem' }}>
                {formatDate(deployment.completed_at)}
              </span>
            </div>
          </div>

          {/* Duration */}
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase'
              }}
            >
              Duration
            </span>

            <div
              style={{
                marginTop: '0.35rem',
                color: '#FFFFFF',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600
              }}
            >
              {deployment.duration || '-'}
            </div>
          </div>

          {/* GitHub Run */}
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase'
              }}
            >
              GitHub Actions
            </span>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.35rem'
              }}
            >
              <Github
                size={16}
                style={{ color: '#E2E8F0' }}
              />

              {github?.url ? (
                <a
                  href={github.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#38BDF8',
                    textDecoration: 'none',
                    fontSize: '0.85rem'
                  }}
                >
                  Run #{github.runNumber || '-'}
                </a>
              ) : (
                <span
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem'
                  }}
                >
                  Not linked
                </span>
              )}
            </div>
          </div>
        </div>

        {deployment.error_message && (
          <div
            style={{
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
            }}
          >
            <AlertTriangle
              size={16}
              style={{ flexShrink: 0 }}
            />

            <span>
              Error: {deployment.error_message}
            </span>
          </div>
        )}
      </div>

      {/* GitHub Actions controls */}
      {github && (
        <div
          className="card"
          style={{ marginBottom: '2rem' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}
            >
              <Github size={19} />

              <span
                style={{
                  fontWeight: 600,
                  color: '#FFFFFF'
                }}
              >
                GitHub Actions Run
              </span>

              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: '#38BDF8',
                  fontSize: '0.8rem'
                }}
              >
                #{github.runNumber || '-'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}
            >
              {github.url && (
                <a
                  href={github.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  <ExternalLink size={14} />
                  <span>Open Run</span>
                </a>
              )}

              <button
                onClick={handleGitHubLogs}
                className="btn btn-secondary btn-sm"
                disabled={isLoadingLogs}
              >
                <ListChecks
                  size={14}
                  className={isLoadingLogs ? 'spin' : ''}
                />

                <span>
                  {isLoadingLogs
                    ? 'Loading...'
                    : 'Load GitHub Logs'}
                </span>
              </button>
            </div>
          </div>

          {/* GitHub jobs */}
          {githubLogs?.github?.jobs?.length > 0 && (
            <div>
              <div
                style={{
                  display: 'grid',
                  gap: '0.65rem'
                }}
              >
                {githubLogs.github.jobs.map((job) => (
                  <div
                    key={job.id}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '6px',
                      backgroundColor:
                        'rgba(255,255,255,0.03)',
                      border:
                        '1px solid var(--border-subtle)'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        {job.conclusion === 'success' ? (
                          <CheckCircle2
                            size={15}
                            style={{ color: '#22C55E' }}
                          />
                        ) : (
                          <AlertTriangle
                            size={15}
                            style={{ color: '#FBBF24' }}
                          />
                        )}

                        <span
                          style={{
                            color: '#FFFFFF',
                            fontWeight: 600
                          }}
                        >
                          {job.name}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          color:
                            job.conclusion === 'success'
                              ? '#22C55E'
                              : '#FBBF24'
                        }}
                      >
                        {job.conclusion ||
                          job.status ||
                          'unknown'}
                      </span>
                    </div>

                    {job.steps?.length > 0 && (
                      <div
                        style={{
                          marginTop: '0.75rem',
                          display: 'grid',
                          gap: '0.35rem'
                        }}
                      >
                        {job.steps.map((step, index) => (
                          <div
                            key={`${job.id}-${index}`}
                            style={{
                              display: 'flex',
                              justifyContent:
                                'space-between',
                              alignItems: 'center',
                              gap: '1rem',
                              fontSize: '0.75rem',
                              color:
                                'var(--text-secondary)'
                            }}
                          >
                            <span>
                              {index + 1}. {step.name}
                            </span>

                            <span
                              style={{
                                fontFamily:
                                  'var(--font-mono)',
                                color:
                                  step.conclusion ===
                                  'success'
                                    ? '#34D399'
                                    : step.conclusion ===
                                      'failure'
                                      ? '#F43F5E'
                                      : '#94A3B8'
                              }}
                            >
                              {step.conclusion ||
                                step.status ||
                                'pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {githubLogs &&
            (!githubLogs.github?.jobs ||
              githubLogs.github.jobs.length === 0) && (
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}
              >
                No GitHub Actions jobs were returned.
              </div>
            )}
        </div>
      )}

      {/* Pipeline Stepper & Live Execution Logs */}
      <div className="grid-cols-2">

        {/* Timeline */}
        <DeploymentTimeline
          status={deployment.status}
        />

        {/* Live Execution Logs */}
        <div className="terminal-window">
          <div className="terminal-header">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <div className="terminal-dots">
                <span
                  className="terminal-dot"
                  style={{
                    backgroundColor: '#EF4444'
                  }}
                />

                <span
                  className="terminal-dot"
                  style={{
                    backgroundColor: '#F59E0B'
                  }}
                />

                <span
                  className="terminal-dot"
                  style={{
                    backgroundColor: '#10B981'
                  }}
                />
              </div>

              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)'
                }}
              >
                build-deploy-stream.log
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981'
                }}
              />

              <span
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)'
                }}
              >
                STREAM READY
              </span>
            </div>
          </div>

          <div className="terminal-body">
            {deployment.logs &&
            deployment.logs.length > 0 ? (
              deployment.logs.map((line, index) => {
                const isError =
                  line.includes('[ERROR]');

                const isWarn =
                  line.includes('[WARN]');

                const isSuccess =
                  line.includes('[SUCCESS]');

                return (
                  <div
                    key={index}
                    className="log-line"
                  >
                    <span
                      style={{
                        color: isError
                          ? '#F43F5E'
                          : isWarn
                            ? '#FBBF24'
                            : isSuccess
                              ? '#34D399'
                              : '#CBD5E1'
                      }}
                    >
                      {line}
                    </span>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  color: 'var(--text-muted)'
                }}
              >
                Waiting for container stream logs...
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default DeploymentDetails;