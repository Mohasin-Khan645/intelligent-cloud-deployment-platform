import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI, deploymentsAPI } from '../services/api';
import ProjectCard from '../components/ProjectCard';
import LoadingSpinner, { EmptyState } from '../components/LoadingSpinner';
import { Plus, Search, FolderGit2, X, Rocket, Check } from 'lucide-react';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // New Project form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    github_repository: '',
    github_branch: 'main'
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Deploy form state
  const [deployEnv, setDeployEnv] = useState('Production');
  const [deployVersion, setDeployVersion] = useState('v1.0.5');

  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const res = await projectsAPI.getAll();
      setProjects(res.data.data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.github_repository) {
      setFormError('Project Name and GitHub Repository are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await projectsAPI.create(formData);
      setIsModalOpen(false);
      setFormData({ name: '', description: '', github_repository: '', github_branch: 'main' });
      await fetchProjects();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeployModal = (project) => {
    setSelectedProject(project);
    setDeployVersion(`v1.0.${Math.floor(Math.random() * 90 + 10)}`);
    setIsDeployModalOpen(true);
  };

  const handleTriggerDeploy = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      setIsSubmitting(true);
      const res = await deploymentsAPI.create({
        project_id: selectedProject.id,
        version: deployVersion,
        environment: deployEnv,
        simulate: true
      });
      setIsDeployModalOpen(false);
      navigate(`/deployments/${res.data.data.id}`);
    } catch (err) {
      alert('Failed to trigger deployment: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.github_repository.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FolderGit2 size={26} style={{ color: '#38BDF8' }} />
            <span>Managed Projects</span>
          </h1>
          <p className="page-subtitle">
            Configure applications, manage GitHub branches, and deploy versioned containers
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>New Project</span>
        </button>
      </div>

      {/* Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        backgroundColor: 'var(--bg-card)',
        padding: '0.65rem 1rem',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        marginBottom: '2rem'
      }}>
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Filter projects by name or repository..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#FFFFFF',
            fontSize: '0.9rem',
            width: '100%'
          }}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner text="Fetching projects from database..." />
      ) : filteredProjects.length > 0 ? (
        <div className="grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDeployClick={handleOpenDeployModal}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderGit2}
          title="No projects configured"
          description="Register a new application repository to initiate continuous delivery."
          action={
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={14} />
              <span>Create Project</span>
            </button>
          }
        />
      )}

      {/* Modal: Create New Project */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#FFFFFF' }}>Add New Project</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProject}>
              <div className="modal-body">
                {formError && (
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    borderRadius: '6px',
                    color: '#FB7185',
                    fontSize: '0.85rem',
                    marginBottom: '1rem'
                  }}>
                    {formError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Project Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Order Processing Service"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    rows="2"
                    placeholder="Brief description of the microservice..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">GitHub Repository *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="github.com/organization/repo-name"
                    value={formData.github_repository}
                    onChange={(e) => setFormData({ ...formData, github_repository: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Default Branch</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="main"
                    value={formData.github_branch}
                    onChange={(e) => setFormData({ ...formData, github_branch: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  {isSubmitting ? 'Creating...' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Deploy */}
      {isDeployModalOpen && selectedProject && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Rocket size={18} style={{ color: '#38BDF8' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#FFFFFF' }}>
                  Deploy: {selectedProject.name}
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
                <div style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '6px',
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem',
                  color: '#CBD5E1'
                }}>
                  Triggering a deployment will initiate the simulated 8-stage delivery timeline from source checkout to health check.
                </div>

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
                  <label className="form-label">Release Version Tag</label>
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
                  <span>{isSubmitting ? 'Dispatching...' : 'Initiate Deployment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;

