import React, { useState, useEffect } from 'react';
import { monitoringAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

import {
  Activity,
  Cpu,
  HardDrive,
  ShieldCheck,
  RefreshCw,
  Cloud,
  Network,
  AlertTriangle,
  Server
} from 'lucide-react';

const Monitoring = () => {
  const [cloudWatch, setCloudWatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /*
   * =========================================================
   * FETCH ONLY AWS CLOUDWATCH METRICS
   * =========================================================
   */

  const fetchCloudWatchMetrics = async () => {
    try {
      const response =
        await monitoringAPI.getCloudWatchMetrics();

      if (response.data?.success) {
        setCloudWatch(response.data.data);
        setError(null);
      } else {
        throw new Error(
          'CloudWatch API returned an unsuccessful response.'
        );
      }
    } catch (err) {
      console.error(
        'Failed to load AWS CloudWatch metrics:',
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Unable to retrieve AWS CloudWatch metrics.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /*
   * =========================================================
   * AUTO REFRESH EVERY 5 SECONDS
   * =========================================================
   */

  useEffect(() => {
    fetchCloudWatchMetrics();

    const interval = setInterval(
      fetchCloudWatchMetrics,
      5000
    );

    return () => clearInterval(interval);
  }, []);

  /*
   * =========================================================
   * INITIAL LOADING
   * =========================================================
   */

  if (isLoading && !cloudWatch) {
    return (
      <LoadingSpinner
        text="Connecting to AWS CloudWatch telemetry..."
      />
    );
  }

  /*
   * =========================================================
   * AWS ECS CLOUDWATCH METRICS
   * =========================================================
   */

  const cpuValue =
    cloudWatch?.ecs?.cpuUtilization?.value;

  const memoryValue =
    cloudWatch?.ecs?.memoryUtilization?.value;

  const cpuPercent =
    cpuValue !== null &&
    cpuValue !== undefined
      ? Number(cpuValue)
      : null;

  const memoryPercent =
    memoryValue !== null &&
    memoryValue !== undefined
      ? Number(memoryValue)
      : null;

  /*
   * =========================================================
   * AWS ALB CLOUDWATCH METRICS
   * =========================================================
   */

  const requestCount =
    cloudWatch?.alb?.requestCount?.value ?? 0;

  const responseTime =
    cloudWatch?.alb?.targetResponseTime?.value;

  const http5xx =
    cloudWatch?.alb?.http5xx?.value ?? 0;

  /*
   * =========================================================
   * AWS INFORMATION
   * =========================================================
   */

  const awsRegion =
    cloudWatch?.region || 'N/A';

  const ecsCluster =
    cloudWatch?.ecs?.cluster || 'N/A';

  const ecsService =
    cloudWatch?.ecs?.service || 'N/A';

  const lastUpdated =
    cloudWatch?.timestamp
      ? new Date(
          cloudWatch.timestamp
        ).toLocaleString()
      : 'N/A';

  /*
   * =========================================================
   * CLOUDWATCH CONNECTION STATUS
   * =========================================================
   */

  const cloudWatchConnected =
    Boolean(cloudWatch) && !error;

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="page-wrapper">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="page-header">

        <div>

          <h1 className="page-title">

            <Activity
              size={26}
              style={{
                color: '#10B981'
              }}
            />

            <span>
              Telemetry & System Monitoring
            </span>

          </h1>

          <p className="page-subtitle">
            Real-time AWS CloudWatch, ECS, and ALB telemetry
          </p>

        </div>

        <button
          onClick={fetchCloudWatchMetrics}
          className="btn btn-secondary btn-sm"
          title="Refresh AWS CloudWatch metrics"
        >

          <RefreshCw size={14} />

          <span>
            Auto-Refreshing (5s)
          </span>

        </button>

      </div>


      {/* =====================================================
          CLOUDWATCH ERROR
      ===================================================== */}

      {error && (
        <div
          className="card"
          style={{
            marginBottom: '2rem',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            backgroundColor:
              'rgba(245, 158, 11, 0.05)'
          }}
        >

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >

            <AlertTriangle
              size={20}
              style={{
                color: '#F59E0B'
              }}
            />

            <div>

              <h3
                style={{
                  color: '#FFFFFF',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                AWS CloudWatch Telemetry Error
              </h3>

              <p
                style={{
                  marginTop: '0.35rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem'
                }}
              >
                {error}
              </p>

            </div>

          </div>

        </div>
      )}


      {/* =====================================================
          AWS CLOUDWATCH KPI CARDS
      ===================================================== */}

      <div className="grid-stats">

        {/* -----------------------------------------------------
            CLOUDWATCH STATUS
        ----------------------------------------------------- */}

        <div className="card">

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}
          >

            <div>

              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                CLOUDWATCH STATUS
              </div>

              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginTop: '0.75rem'
                }}
              >
                {cloudWatchConnected
                  ? 'Connected'
                  : 'Unavailable'}
              </div>

            </div>

            <div
              style={{
                padding: '0.65rem',
                borderRadius: '8px',
                backgroundColor:
                  'rgba(16, 185, 129, 0.1)',
                color: '#10B981'
              }}
            >
              <ShieldCheck size={24} />
            </div>

          </div>

          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '0.85rem',
              borderTop:
                '1px solid var(--border-color)'
            }}
          >

            <span
              style={{
                color: '#10B981',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              {cloudWatchConnected
                ? 'AWS TELEMETRY ONLINE'
                : 'CHECK AWS CONNECTION'}
            </span>

          </div>

        </div>


        {/* -----------------------------------------------------
            CPU UTILIZATION
        ----------------------------------------------------- */}

        <div className="card">

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}
          >

            <div>

              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                CPU UTILIZATION
              </div>

              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginTop: '0.75rem'
                }}
              >
                {cpuPercent !== null
                  ? `${cpuPercent.toFixed(2)}%`
                  : 'No data'}
              </div>

            </div>

            <div
              style={{
                padding: '0.65rem',
                borderRadius: '8px',
                backgroundColor:
                  'rgba(14, 165, 233, 0.1)',
                color: '#38BDF8'
              }}
            >
              <Cpu size={24} />
            </div>

          </div>

          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '0.85rem',
              borderTop:
                '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              fontSize: '0.8rem'
            }}
          >
            AWS ECS CloudWatch
          </div>

        </div>


        {/* -----------------------------------------------------
            MEMORY UTILIZATION
        ----------------------------------------------------- */}

        <div className="card">

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}
          >

            <div>

              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                MEMORY UTILIZATION
              </div>

              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginTop: '0.75rem'
                }}
              >
                {memoryPercent !== null
                  ? `${memoryPercent.toFixed(2)}%`
                  : 'No data'}
              </div>

            </div>

            <div
              style={{
                padding: '0.65rem',
                borderRadius: '8px',
                backgroundColor:
                  'rgba(168, 85, 247, 0.1)',
                color: '#A855F7'
              }}
            >
              <HardDrive size={24} />
            </div>

          </div>

          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '0.85rem',
              borderTop:
                '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              fontSize: '0.8rem'
            }}
          >
            AWS ECS CloudWatch
          </div>

        </div>


        {/* -----------------------------------------------------
            HTTP 5XX
        ----------------------------------------------------- */}

        <div className="card">

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}
          >

            <div>

              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                HTTP 5XX ERRORS
              </div>

              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginTop: '0.75rem'
                }}
              >
                {http5xx}
              </div>

            </div>

            <div
              style={{
                padding: '0.65rem',
                borderRadius: '8px',
                backgroundColor:
                  'rgba(245, 158, 11, 0.1)',
                color: '#F59E0B'
              }}
            >
              <AlertTriangle size={24} />
            </div>

          </div>

          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '0.85rem',
              borderTop:
                '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              fontSize: '0.8rem'
            }}
          >
            AWS Application Load Balancer
          </div>

        </div>

      </div>


      {/* =====================================================
          ECS RESOURCE UTILIZATION
      ===================================================== */}

      <div
        className="grid-cols-2"
        style={{
          marginBottom: '2rem'
        }}
      >

        {/* ===================================================
            CPU
        =================================================== */}

        <div className="card">

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem'
            }}
          >

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >

              <Cpu
                size={18}
                style={{
                  color: '#38BDF8'
                }}
              />

              <h2
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#FFFFFF'
                }}
              >
                ECS Compute Load
              </h2>

            </div>

            <span
              style={{
                fontSize: '0.85rem',
                fontFamily:
                  'var(--font-mono)',
                color: '#38BDF8',
                fontWeight: 600
              }}
            >
              {cpuPercent !== null
                ? `${cpuPercent.toFixed(2)}%`
                : 'No data'}
            </span>

          </div>


          {/* CPU PROGRESS */}

          <div
            style={{
              height: '10px',
              backgroundColor:
                'var(--bg-main)',
              borderRadius: '5px',
              overflow: 'hidden',
              marginBottom: '1rem'
            }}
          >

            <div
              style={{
                width:
                  cpuPercent !== null
                    ? `${Math.min(
                        Math.max(
                          cpuPercent,
                          0
                        ),
                        100
                      )}%`
                    : '0%',
                height: '100%',
                background:
                  'linear-gradient(90deg, #0284C7, #38BDF8)',
                transition:
                  'width 0.4s ease'
              }}
            />

          </div>


          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}
          >

            <span>
              Source: AWS CloudWatch
            </span>

            <span>
              ECS Service
            </span>

          </div>

        </div>


        {/* ===================================================
            MEMORY
        =================================================== */}

        <div className="card">

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem'
            }}
          >

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >

              <HardDrive
                size={18}
                style={{
                  color: '#A855F7'
                }}
              />

              <h2
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#FFFFFF'
                }}
              >
                ECS Memory Pool
              </h2>

            </div>

            <span
              style={{
                fontSize: '0.85rem',
                fontFamily:
                  'var(--font-mono)',
                color: '#A855F7',
                fontWeight: 600
              }}
            >
              {memoryPercent !== null
                ? `${memoryPercent.toFixed(2)}%`
                : 'No data'}
            </span>

          </div>


          {/* MEMORY PROGRESS */}

          <div
            style={{
              height: '10px',
              backgroundColor:
                'var(--bg-main)',
              borderRadius: '5px',
              overflow: 'hidden',
              marginBottom: '1rem'
            }}
          >

            <div
              style={{
                width:
                  memoryPercent !== null
                    ? `${Math.min(
                        Math.max(
                          memoryPercent,
                          0
                        ),
                        100
                      )}%`
                    : '0%',
                height: '100%',
                background:
                  'linear-gradient(90deg, #9333EA, #C084FC)',
                transition:
                  'width 0.4s ease'
              }}
            />

          </div>


          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}
          >

            <span>
              Source: AWS CloudWatch
            </span>

            <span>
              ECS Fargate
            </span>

          </div>

        </div>

      </div>


      {/* =====================================================
          ALB CLOUDWATCH TELEMETRY
      ===================================================== */}

      <div
        className="grid-stats"
        style={{
          marginBottom: '2rem'
        }}
      >

        {/* -----------------------------------------------------
            REQUEST COUNT
        ----------------------------------------------------- */}

        <div className="card">

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}
          >

            <div>

              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                ALB REQUESTS
              </div>

              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginTop: '0.75rem'
                }}
              >
                {requestCount}
              </div>

            </div>

            <div
              style={{
                padding: '0.65rem',
                borderRadius: '8px',
                backgroundColor:
                  'rgba(14, 165, 233, 0.1)',
                color: '#38BDF8'
              }}
            >
              <Network size={24} />
            </div>

          </div>

          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '0.85rem',
              borderTop:
                '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              fontSize: '0.8rem'
            }}
          >
            AWS ApplicationELB
          </div>

        </div>


        {/* -----------------------------------------------------
            RESPONSE TIME
        ----------------------------------------------------- */}

        <div className="card">

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}
          >

            <div>

              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                TARGET RESPONSE TIME
              </div>

              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginTop: '0.75rem'
                }}
              >
                {responseTime !== null &&
                responseTime !== undefined
                  ? `${Number(
                      responseTime
                    ).toFixed(3)}s`
                  : 'No data'}
              </div>

            </div>

            <div
              style={{
                padding: '0.65rem',
                borderRadius: '8px',
                backgroundColor:
                  'rgba(168, 85, 247, 0.1)',
                color: '#A855F7'
              }}
            >
              <Activity size={24} />
            </div>

          </div>

          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '0.85rem',
              borderTop:
                '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              fontSize: '0.8rem'
            }}
          >
            AWS ApplicationELB
          </div>

        </div>


        {/* -----------------------------------------------------
            AWS REGION
        ----------------------------------------------------- */}

        <div className="card">

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}
          >

            <div>

              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                AWS REGION
              </div>

              <div
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginTop: '0.75rem'
                }}
              >
                {awsRegion}
              </div>

            </div>

            <div
              style={{
                padding: '0.65rem',
                borderRadius: '8px',
                backgroundColor:
                  'rgba(16, 185, 129, 0.1)',
                color: '#10B981'
              }}
            >
              <Cloud size={24} />
            </div>

          </div>

          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '0.85rem',
              borderTop:
                '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              fontSize: '0.8rem'
            }}
          >
            AWS deployment region
          </div>

        </div>


        {/* -----------------------------------------------------
            ECS SERVICE
        ----------------------------------------------------- */}

        <div className="card">

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}
          >

            <div>

              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                ECS SERVICE
              </div>

              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginTop: '0.75rem',
                  wordBreak: 'break-word'
                }}
              >
                {ecsService}
              </div>

            </div>

            <div
              style={{
                padding: '0.65rem',
                borderRadius: '8px',
                backgroundColor:
                  'rgba(16, 185, 129, 0.1)',
                color: '#10B981'
              }}
            >
              <Server size={24} />
            </div>

          </div>

          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '0.85rem',
              borderTop:
                '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              fontSize: '0.8rem'
            }}
          >
            Cluster: {ecsCluster}
          </div>

        </div>

      </div>


      {/* =====================================================
          AWS CLOUDWATCH STATUS
      ===================================================== */}

      <div
        className="card"
        style={{
          border: cloudWatchConnected
            ? '1px dashed #0284C7'
            : '1px dashed #F59E0B',

          backgroundColor:
            cloudWatchConnected
              ? 'rgba(2, 132, 199, 0.04)'
              : 'rgba(245, 158, 11, 0.04)'
        }}
      >

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem'
          }}
        >

          {/* ICON */}

          <div
            style={{
              padding: '0.65rem',
              borderRadius: '8px',

              backgroundColor:
                cloudWatchConnected
                  ? 'rgba(2, 132, 199, 0.1)'
                  : 'rgba(245, 158, 11, 0.1)',

              color:
                cloudWatchConnected
                  ? '#38BDF8'
                  : '#F59E0B'
            }}
          >

            {cloudWatchConnected ? (
              <Cloud size={24} />
            ) : (
              <AlertTriangle size={24} />
            )}

          </div>


          {/* CONTENT */}

          <div>

            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                color: '#FFFFFF'
              }}
            >
              {cloudWatchConnected
                ? 'AWS CloudWatch Integration Active'
                : 'AWS CloudWatch Integration Unavailable'}
            </h3>


            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginTop: '0.35rem',
                lineHeight: 1.5
              }}
            >
              {cloudWatchConnected
                ? `Live telemetry is being retrieved from AWS CloudWatch for ECS service ${ecsService} in ${awsRegion}. CPU, memory, Application Load Balancer requests, response time, and HTTP 5XX metrics are connected directly to AWS CloudWatch.`
                : 'The application could not retrieve telemetry from AWS CloudWatch. Check the backend service, AWS credentials, IAM permissions, and CloudWatch configuration.'}
            </p>


            {/* LAST UPDATE */}

            {cloudWatchConnected && (
              <div
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  flexWrap: 'wrap',
                  marginTop: '0.75rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  fontFamily:
                    'var(--font-mono)'
                }}
              >

                <span>
                  Region: {awsRegion}
                </span>

                <span>
                  Cluster: {ecsCluster}
                </span>

                <span>
                  Last update: {lastUpdated}
                </span>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

export default Monitoring;