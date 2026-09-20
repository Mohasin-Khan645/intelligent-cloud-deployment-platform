import React, { useState, useEffect } from 'react';
import { environmentsAPI } from '../services/api';
import EnvironmentCard from '../components/EnvironmentCard';
import LoadingSpinner, { EmptyState } from '../components/LoadingSpinner';
import { Layers, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

const Environments = () => {
  const [environments, setEnvironments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEnvironments = async () => {
    try {
      setIsLoading(true);
      const res = await environmentsAPI.getAll();
      setEnvironments(res.data.data || []);
    } catch (err) {
      console.error('Failed to load environments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvironments();
  }, []);

  const healthyCount = environments.filter(e => e.status === 'Healthy').length;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Layers size={26} style={{ color: '#38BDF8' }} />
            <span>Target Deployment Environments</span>
          </h1>
          <p className="page-subtitle">
            Isolated deployment rings (Development, Staging, Production)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.75rem',
            borderRadius: '6px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '0.8rem',
            color: '#34D399',
            fontWeight: 600
          }}>
            <ShieldCheck size={16} />
            <span>{healthyCount}/{environments.length} Targets Healthy</span>
          </div>

          <button onClick={fetchEnvironments} className="btn btn-secondary btn-sm" title="Refresh environments">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Querying target environment topology..." />
      ) : environments.length > 0 ? (
        <div className="grid-cols-3">
          {environments.map((env) => (
            <EnvironmentCard key={env.id} environment={env} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Layers}
          title="No environments configured"
          description="Environments are automatically spawned when projects are registered."
        />
      )}
    </div>
  );
};

export default Environments;

