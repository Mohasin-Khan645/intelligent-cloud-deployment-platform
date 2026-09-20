import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectsAPI, deploymentsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import DeploymentCard from '../components/DeploymentCard';
import EnvironmentCard from '../components/EnvironmentCard';
import {
  FolderGit2,
  Github,
  GitBranch,
  Rocket,
  ArrowLeft,
  Calendar,
  Layers,
  Globe,
  Trash2,
  X
} from 'lucide-react';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [deployEnv, setDeployEnv] = useState('Production');
  const [deployVersion, setDeployVersion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjectDetails = async () => {
    try {
      setIsLoading(true);
      const res = await projectsAPI.getById(id);
      setProject(res.data.data);
      setDeployVersion(`v1.0.${Math.floor(Math.random() * 90 + 10)}`);
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const handleTriggerDeploy = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await deploymentsAPI.create({
        project_id: project.id,
        version: deployVersion,
        environment: deployEnv,
        simulate: true
      });
      setIsDeployModalOpen(false);
      navigate(`/deployments/${res.data.data.id}`);
    } catch (err) {
      alert('Deployment trigger failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`Are you sure you want to delete project "${project.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await projectsAPI.delete(project.id);
      navigate('/projects');
    } catch (err) {
      alert('Failed to delete project: ' + (err.response?.data?.error || err.message));
    }
  };

  if (isLoading || !project) {
    return <LoadingSpinner text="Retrieving project specifications..." />;
  }

  return (
    <div className="page-wrapper">
      {/* Back button & Header */}
      <Link to="/projects" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        fontSize: '0.85rem',
        marginBottom: '1rem'
      }}>
        <ArrowLeft size={16} />
        <span>Back to Projects</span>
      </Link>

      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="page-title">{project.name}</h1>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              backgroundColor: 'var(--bg-elevated)',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              color: '#38BDF8'
            }}>
              ID #{project.id}
            </span>
          </div>
          <p className="page-subtitle">{project.description || 'No description provided.'}</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleDeleteProject} className="btn btn-danger btn-sm" title="Delete project">
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
          <button onClick={() => setIsDeployModalOpen(true)} className="btn btn-primary">
            <Rocket size={16} />
            <span>Deploy</span>
          </button>
        </div>
      </div>

      {/* Project Overview Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '1rem' }}>
          Configuration & Repository Metadata
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          backgroundColor: 'var(--bg-main)',
          padding: '1.25rem',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>GitHub Repository</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', color: '#FFFFFF' }}>
              <Github size={16} style={{ color: '#94A3B8' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{project.github_repository}</span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Branch</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', color: '#38BDF8' }}>
              <GitBranch size={16} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{project.github_branch || 'main'}</span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Created Timestamp</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', color: '#FFFFFF' }}>
              <Calendar size={16} style={{ color: '#94A3B8' }} />
              <span style={{ fontSize: '0.85rem' }}>{new Date(project.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Environments</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', color: '#10B981' }}>
              <Layers size={16} />
              <span style={{ fontSize: '0.85rem' }}>{project.environments?.length || 3} Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Environments Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '1rem' }}>
          Environments & Target URLs
        </h2>
        <div className="grid-cols-3">
          {project.environments && project.environments.map((env) => (
            <EnvironmentCard key={env.id} environment={{ ...env, project_name: project.name }} />
          ))}
        </div>
      </div>

      {/* Recent Deployments History for this project */}
      <div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '1rem' }}>
          Deployment Execution History
        </h2>
        {project.recent_deployments && project.recent_deployments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {project.recent_deployments.map((dep) => (
              <DeploymentCard key={dep.id} deployment={{ ...dep, project_name: project.name }} />
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No deployments executed yet for this project. Click the "Deploy" button to initiate a simulated run.
          </div>
        )}
      </div>

      {/* Deploy Modal */}
      {isDeployModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Rocket size={18} style={{ color: '#38BDF8' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#FFFFFF' }}>
                  Deploy: {project.name}
                </h3>
              </div>
              <button
                onClick={() => setIsDeployModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTriggerDeploy}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Target Environment</label>
                  <select
                    className="form-select"
                    value={deployEnv}
                    onChange={(e) => setDeployEnv(e.target.value)}
                  >
                    <option value="Development">Development</option>
                    <option value="Staging">Staging</option>
                    <option value="Production">Production</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Version Tag</label>
                  <input
                    type="text"
                    className="form-input"
                    value={deployVersion}
                    onChange={(e) => setDeployVersion(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsDeployModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  <Rocket size={14} />
                  <span>{isSubmitting ? 'Dispatching...' : 'Deploy Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;

