import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import DashboardCard from '../components/DashboardCard';
import DeploymentCard from '../components/DeploymentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FolderGit2,
  Rocket,
  CheckCircle2,
  XCircle,
  Layers,
  Plus,
  ArrowRight,
  RefreshCw,
  Activity
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await projectsAPI.getDashboardStats();
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      setError('Unable to load deployment statistics. Please check if the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading && !stats) {
    return <LoadingSpinner text="Retrieving platform metrics..." />;
  }

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>Engineering Dashboard</span>
          </h1>
          <p className="page-subtitle">
            Continuous Integration & Delivery Overview across all active microservices
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchStats} className="btn btn-secondary btn-sm" title="Refresh metrics">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <Link to="/projects" className="btn btn-primary btn-sm">
            <Plus size={14} />
            <span>New Project</span>
          </Link>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '8px',
          color: '#FB7185',
          marginBottom: '1.5rem',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      {/* Primary KPI Metric Cards */}
      <div className="grid-stats">
        <DashboardCard
          title="Total Projects"
          value={stats?.totalProjects ?? 0}
          icon={FolderGit2}
          color="cyan"
          subtitle="Managed repositories"
        />
        <DashboardCard
          title="Total Deployments"
          value={stats?.totalDeployments ?? 0}
          icon={Rocket}
          color="purple"
          subtitle="All environments"
        />
        <DashboardCard
          title="Successful"
          value={stats?.successfulDeployments ?? 0}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Passing pipelines"
          trend="Healthy"
        />
        <DashboardCard
          title="Failed"
          value={stats?.failedDeployments ?? 0}
          icon={XCircle}
          color="rose"
          subtitle="Requires inspection"
        />
        <DashboardCard
          title="Active Environments"
          value={stats?.activeEnvironments ?? 0}
          icon={Layers}
          color="amber"
          subtitle="Online targets"
        />
      </div>

      {/* Split Section: Recent Deployments & System Status */}
      <div className="grid-cols-2">
        {/* Recent Deployments */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Rocket size={18} style={{ color: '#38BDF8' }} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FFFFFF' }}>Recent Deployments</h2>
            </div>
            <Link to="/deployments" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#38BDF8', textDecoration: 'none' }}>
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats?.recentDeployments && stats.recentDeployments.length > 0 ? (
              stats.recentDeployments.map((dep) => (
                <DeploymentCard key={dep.id} deployment={dep} />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No deployments triggered yet.
              </div>
            )}
          </div>
        </div>

        {/* Quick Launch & Platform Health */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Activity size={18} style={{ color: '#10B981' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FFFFFF' }}>Platform Readiness</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-main)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF' }}>CI/CD Pipeline Engine</span>
                <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>READY (Phase 1 Local)</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Local simulation mode active. PostgreSQL schema and models initialized. Ready for Phase 2 AWS integration.
              </p>
            </div>

            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-main)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF' }}>Target Demo Application</span>
                <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>:3000/health</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Located at <code>application/demo-app/</code>. Provides independent HTTP health and version endpoints.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Link to="/environments" className="btn btn-secondary" style={{ flex: 1 }}>
                <span>Environments</span>
              </Link>
              <Link to="/monitoring" className="btn btn-secondary" style={{ flex: 1 }}>
                <span>Telemetry</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

