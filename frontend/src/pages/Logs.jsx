import React, { useState, useEffect } from 'react';
import { awsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  TerminalSquare,
  RefreshCw,
  Copy,
  Check,
  Download,
  Cloud,
  Server
} from 'lucide-react';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [logData, setLogData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [error, setError] = useState('');

  /*
   * Load real ECS logs from AWS CloudWatch
   */
  const loadLogs = async () => {
    try {
      setError('');

      const res = await awsAPI.getCloudWatchLogs(100);

      const data = res.data.data;

      setLogData(data);

      const events = data?.events || [];

      /*
       * Convert CloudWatch events into strings
       * for the existing terminal UI.
       */
      const formattedLogs = events.map((event) => {
        const timestamp = event.timestamp
          ? new Date(event.timestamp).toLocaleString()
          : '';

        return `[INFO] [${timestamp}] ${event.message || ''}`;
      });

      setLogs(formattedLogs);
    } catch (err) {
      console.error(
        'Failed to fetch AWS CloudWatch logs:',
        err
      );

      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to retrieve AWS CloudWatch logs.'
      );

      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  /*
   * Initial load + automatic refresh every 5 seconds
   */
  useEffect(() => {
    loadLogs();

    const interval = setInterval(
      loadLogs,
      5000
    );

    return () => clearInterval(interval);
  }, []);

  /*
   * Filter logs
   */
  const filteredLogs = logs.filter((line) => {
    if (filterLevel === 'ALL') {
      return true;
    }

    return line.includes(`[${filterLevel}]`);
  });

  /*
   * Copy logs
   */
  const handleCopyLogs = () => {
    navigator.clipboard.writeText(
      logs.join('\n')
    );

    setCopied(true);

    setTimeout(
      () => setCopied(false),
      2000
    );
  };

  /*
   * Download logs
   */
  const handleDownloadLogs = () => {
    const element =
      document.createElement('a');

    const file = new Blob(
      [logs.join('\n')],
      {
        type: 'text/plain'
      }
    );

    element.href =
      URL.createObjectURL(file);

    element.download =
      'ecs-cloudwatch-logs.txt';

    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);

    URL.revokeObjectURL(element.href);
  };

  /*
   * Determine log level
   */
  const getLogType = (log) => {
    if (log.includes('[ERROR]')) {
      return 'ERROR';
    }

    if (log.includes('[WARN]')) {
      return 'WARN';
    }

    if (log.includes('[SUCCESS]')) {
      return 'SUCCESS';
    }

    return 'INFO';
  };

  return (
    <div className="page-wrapper">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="page-header">

        <div>

          <h1 className="page-title">

            <TerminalSquare
              size={26}
              style={{
                color: '#38BDF8'
              }}
            />

            <span>
              Deployment Log Stream
            </span>

          </h1>

          <p className="page-subtitle">
            Real-time ECS container logs
            retrieved from AWS CloudWatch
          </p>

        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.5rem'
          }}
        >

          <button
            onClick={loadLogs}
            className="btn btn-secondary btn-sm"
            title="Refresh logs"
          >
            <RefreshCw size={14} />

            <span>
              Refresh
            </span>
          </button>

          <button
            onClick={handleCopyLogs}
            className="btn btn-secondary btn-sm"
            title="Copy to clipboard"
            disabled={logs.length === 0}
          >
            {copied ? (
              <Check
                size={14}
                style={{
                  color: '#10B981'
                }}
              />
            ) : (
              <Copy size={14} />
            )}

            <span>
              {copied
                ? 'Copied'
                : 'Copy'}
            </span>
          </button>

          <button
            onClick={handleDownloadLogs}
            className="btn btn-secondary btn-sm"
            title="Download log file"
            disabled={logs.length === 0}
          >
            <Download size={14} />

            <span>
              Export
            </span>
          </button>

        </div>

      </div>

      {/* =====================================================
          AWS CLOUDWATCH INFORMATION
      ====================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >

        {/* AWS Region */}

        <div className="card">

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >

            <Cloud
              size={22}
              style={{
                color: '#38BDF8'
              }}
            />

            <div>

              <div
                style={{
                  fontSize: '0.75rem',
                  color:
                    'var(--text-muted)',
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '0.05em'
                }}
              >
                AWS Region
              </div>

              <div
                style={{
                  marginTop: '0.3rem',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: '#FFFFFF'
                }}
              >
                {logData?.region ||
                  'Connecting...'}
              </div>

            </div>

          </div>

        </div>

        {/* Log Group */}

        <div className="card">

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >

            <Server
              size={22}
              style={{
                color: '#10B981'
              }}
            />

            <div>

              <div
                style={{
                  fontSize: '0.75rem',
                  color:
                    'var(--text-muted)',
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '0.05em'
                }}
              >
                CloudWatch Log Group
              </div>

              <div
                style={{
                  marginTop: '0.3rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#FFFFFF'
                }}
              >
                {logData?.logGroup ||
                  'Connecting...'}
              </div>

            </div>

          </div>

        </div>

        {/* Log Stream */}

        <div className="card">

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >

            <TerminalSquare
              size={22}
              style={{
                color: '#A855F7'
              }}
            />

            <div>

              <div
                style={{
                  fontSize: '0.75rem',
                  color:
                    'var(--text-muted)',
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '0.05em'
                }}
              >
                Log Stream
              </div>

              <div
                style={{
                  marginTop: '0.3rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  wordBreak:
                    'break-word'
                }}
              >
                {logData?.logStream ||
                  'Connecting...'}
              </div>

            </div>

          </div>

        </div>

        {/* Event count */}

        <div className="card">

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >

            <div>

              <div
                style={{
                  fontSize: '0.75rem',
                  color:
                    'var(--text-muted)',
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '0.05em'
                }}
              >
                CloudWatch Events
              </div>

              <div
                style={{
                  marginTop: '0.3rem',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: '#FFFFFF'
                }}
              >
                {logs.length}
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          FILTER TOOLBAR
      ====================================================== */}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor:
            'var(--bg-card)',
          padding:
            '0.85rem 1.25rem',
          borderRadius: '8px',
          border:
            '1px solid var(--border-subtle)',
          marginBottom: '1.5rem'
        }}
      >

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >

          <span
            style={{
              fontSize: '0.85rem',
              color:
                'var(--text-secondary)',
              fontWeight: 500
            }}
          >
            Source:
          </span>

          <span
            style={{
              color: '#38BDF8',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            AWS CloudWatch
          </span>

          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor:
                '#10B981'
            }}
          />

          <span
            style={{
              color: '#10B981',
              fontSize: '0.75rem'
            }}
          >
            Connected
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
              fontSize: '0.8rem',
              color:
                'var(--text-muted)'
            }}
          >
            Level:
          </span>

          {[
            'ALL',
            'INFO',
            'WARN',
            'ERROR',
            'SUCCESS'
          ].map((level) => (

            <button
              key={level}
              onClick={() =>
                setFilterLevel(level)
              }
              style={{
                background:
                  filterLevel === level
                    ? 'var(--bg-elevated)'
                    : 'transparent',

                color:
                  filterLevel === level
                    ? '#38BDF8'
                    : 'var(--text-muted)',

                border:
                  filterLevel === level
                    ? '1px solid var(--border-light)'
                    : '1px solid transparent',

                borderRadius: '4px',
                padding:
                  '0.2rem 0.5rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {level}
            </button>

          ))}

        </div>

      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (

        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            border:
              '1px solid rgba(239, 68, 68, 0.4)',
            backgroundColor:
              'rgba(239, 68, 68, 0.05)',
            color: '#F87171'
          }}
        >
          AWS CloudWatch Logs Error:
          {' '}
          {error}
        </div>

      )}

      {/* =====================================================
          TERMINAL VIEW
      ====================================================== */}

      {isLoading ? (

        <LoadingSpinner
          text="Connecting to AWS CloudWatch Logs..."
        />

      ) : (

        <div className="terminal-window">

          {/* Terminal header */}

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
                    backgroundColor:
                      '#EF4444'
                  }}
                />

                <span
                  className="terminal-dot"
                  style={{
                    backgroundColor:
                      '#F59E0B'
                  }}
                />

                <span
                  className="terminal-dot"
                  style={{
                    backgroundColor:
                      '#10B981'
                  }}
                />

              </div>

              <span
                style={{
                  fontSize: '0.8rem',
                  color: '#94A3B8'
                }}
              >
                ecs-cloudwatch.log
              </span>

            </div>

            <div
              style={{
                fontSize: '0.75rem',
                color:
                  'var(--text-muted)'
              }}
            >
              {filteredLogs.length}
              {' '}
              entries
            </div>

          </div>

          {/* Terminal body */}

          <div
            className="terminal-body"
            style={{
              minHeight: '380px'
            }}
          >

            {filteredLogs.length > 0 ? (

              filteredLogs.map(
                (log, index) => {

                  const logType =
                    getLogType(log);

                  const isError =
                    logType === 'ERROR';

                  const isWarn =
                    logType === 'WARN';

                  const isSuccess =
                    logType === 'SUCCESS';

                  const isInfo =
                    logType === 'INFO';

                  return (

                    <div
                      key={`${index}-${log}`}
                      className="log-line"
                    >

                      <span
                        style={{
                          color:
                            'var(--text-muted)',
                          userSelect:
                            'none',
                          minWidth: '28px',
                          textAlign:
                            'right'
                        }}
                      >
                        {index + 1}
                      </span>

                      <span
                        style={{
                          color:
                            isError
                              ? '#F43F5E'
                              : isWarn
                              ? '#FBBF24'
                              : isSuccess
                              ? '#34D399'
                              : isInfo
                              ? '#38BDF8'
                              : '#CBD5E1'
                        }}
                      >
                        {log}
                      </span>

                    </div>

                  );
                }
              )

            ) : (

              <div
                style={{
                  color:
                    'var(--text-muted)',
                  fontStyle:
                    'italic'
                }}
              >
                No CloudWatch log
                entries available.
              </div>

            )}

          </div>

        </div>

      )}

      {/* =====================================================
          AWS INTEGRATION STATUS
      ====================================================== */}

      <div
        className="card"
        style={{
          marginTop: '1.5rem',
          border:
            '1px dashed #0284C7',
          backgroundColor:
            'rgba(2, 132, 199, 0.04)'
        }}
      >

        <div
          style={{
            display: 'flex',
            alignItems:
              'flex-start',
            gap: '1rem'
          }}
        >

          <div
            style={{
              padding: '0.65rem',
              borderRadius: '8px',
              backgroundColor:
                'rgba(2, 132, 199, 0.1)',
              color: '#38BDF8'
            }}
          >

            <Cloud size={24} />

          </div>

          <div>

            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                color: '#FFFFFF'
              }}
            >
              AWS CloudWatch Logs
              Integration Active
            </h3>

            <p
              style={{
                fontSize: '0.875rem',
                color:
                  'var(--text-secondary)',
                marginTop: '0.35rem',
                lineHeight: 1.5
              }}
            >
              This log viewer is connected
              directly to the ECS CloudWatch
              log group
              {' '}
              <strong>
                {logData?.logGroup ||
                  '/ecs/intelligent-cloud-demo-app'}
              </strong>
              . Logs are automatically
              refreshed every 5 seconds.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Logs;