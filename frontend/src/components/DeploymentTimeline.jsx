import React from 'react';
import { CheckCircle2, Circle, XCircle, Loader2, RefreshCw } from 'lucide-react';

const PIPELINE_STEPS = [
  { id: 1, title: 'Source Checkout', desc: 'Pull repository commit SHA from Git' },
  { id: 2, title: 'Install Dependencies', desc: 'Validate package-lock and run clean npm install' },
  { id: 3, title: 'Run Tests', desc: 'Execute automated unit and integration suites' },
  { id: 4, title: 'Build Application', desc: 'Compile ESBuild and generate optimized production bundle' },
  { id: 5, title: 'Docker Build', desc: 'Build local OCI container image (simulated)' },
  { id: 6, title: 'Push Image', desc: 'Publish container image to image registry (simulated)' },
  { id: 7, title: 'Deploy', desc: 'Rolling update workload on runtime cluster (simulated)' },
  { id: 8, title: 'Health Check', desc: 'Execute HTTP probe at /health on target instances' }
];

const DeploymentTimeline = ({ status }) => {
  const normalizedStatus = (status || 'QUEUED').toUpperCase();

  // Helper determining the state of each step given overall status
  const getStepState = (stepIndex) => {
    // 0-indexed (0 to 7)
    if (normalizedStatus === 'SUCCESS') {
      return 'completed';
    }

    if (normalizedStatus === 'FAILED') {
      if (stepIndex < 4) return 'completed';
      if (stepIndex === 4) return 'failed';
      return 'skipped';
    }

    if (normalizedStatus === 'ROLLED_BACK') {
      if (stepIndex < 7) return 'completed';
      if (stepIndex === 7) return 'failed';
      return 'skipped';
    }

    if (normalizedStatus === 'DEPLOYING') {
      if (stepIndex < 6) return 'completed';
      if (stepIndex === 6) return 'running';
      return 'pending';
    }

    if (normalizedStatus === 'BUILDING') {
      if (stepIndex < 3) return 'completed';
      if (stepIndex === 3) return 'running';
      return 'pending';
    }

    if (normalizedStatus === 'QUEUED') {
      if (stepIndex === 0) return 'running';
      return 'pending';
    }

    return 'pending';
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '10px',
      padding: '1.75rem'
    }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>Pipeline Stage Timeline</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(Simulated CI/CD Pipeline)</span>
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {PIPELINE_STEPS.map((step, idx) => {
          const state = getStepState(idx);

          return (
            <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', position: 'relative' }}>
              {/* Timeline Connector Line */}
              {idx < PIPELINE_STEPS.length - 1 && (
                <div style={{
                  position: 'absolute',
                  left: '14px',
                  top: '28px',
                  bottom: '-20px',
                  width: '2px',
                  backgroundColor: state === 'completed' ? '#10B981' : 'var(--border-subtle)',
                  zIndex: 1
                }} />
              )}

              {/* Step Icon */}
              <div style={{ zIndex: 2, backgroundColor: 'var(--bg-card)', borderRadius: '50%' }}>
                {state === 'completed' && (
                  <CheckCircle2 size={28} style={{ color: '#10B981' }} />
                )}
                {state === 'running' && (
                  <Loader2 size={28} className="animate-spin" style={{ color: '#38BDF8' }} />
                )}
                {state === 'failed' && (
                  <XCircle size={28} style={{ color: '#F43F5E' }} />
                )}
                {state === 'skipped' && (
                  <Circle size={28} style={{ color: 'var(--text-muted)' }} />
                )}
                {state === 'pending' && (
                  <Circle size={28} style={{ color: 'var(--border-light)' }} />
                )}
              </div>

              {/* Step Details */}
              <div style={{ flex: 1, paddingTop: '0.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: '0.95rem',
                    fontWeight: state === 'running' || state === 'completed' ? 600 : 500,
                    color: state === 'failed' ? '#FB7185' : state === 'running' ? '#38BDF8' : state === 'completed' ? '#FFFFFF' : 'var(--text-muted)'
                  }}>
                    {step.title}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    color: state === 'completed' ? '#10B981' : state === 'running' ? '#38BDF8' : state === 'failed' ? '#F43F5E' : 'var(--text-muted)'
                  }}>
                    {state}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DeploymentTimeline;

