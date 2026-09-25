import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

/* =========================================================
   AUTH API
========================================================= */

export const authAPI = {
  login: (credentials) =>
    api.post('/auth/login', credentials),

  register: (userData) =>
    api.post('/auth/register', userData),

  getMe: () =>
    api.get('/auth/me')
};

/* =========================================================
   PROJECT API
========================================================= */

export const projectsAPI = {
  getAll: () =>
    api.get('/projects'),

  getById: (id) =>
    api.get(`/projects/${id}`),

  create: (projectData) =>
    api.post('/projects', projectData),

  update: (id, projectData) =>
    api.put(`/projects/${id}`, projectData),

  delete: (id) =>
    api.delete(`/projects/${id}`),

  getDashboardStats: () =>
    api.get('/projects/stats/dashboard')
};

/* =========================================================
   DEPLOYMENT API
========================================================= */

// Deployments endpoints
export const deploymentsAPI = {
  getAll: (params) =>
    api.get('/deployments', { params }),

  getById: (id) =>
    api.get(`/deployments/${id}`),

  create: (data) =>
    api.post('/deployments', data),

  getLogs: (id) =>
    api.get(`/deployments/${id}/logs`),

  getGitHubLogs: (id) =>
    api.get(`/deployments/${id}/github-logs`),

  syncStatus: (id) =>
    api.post(`/deployments/${id}/sync`),

  rollback: (id) =>
    api.post(`/deployments/${id}/rollback`),

  getLiveStatus: () =>
    api.get('/deployments/live-status')
};


export const githubAPI = {
  triggerDeployment: (data) =>
    api.post('/github/trigger', data)
};


/* =========================================================
   GITHUB ACTIONS API
========================================================= */

export const githubActionsAPI = {
  getRuns: (limit = 10) =>
    api.get('/github/runs', {
      params: { limit }
    }),

  getLatest: () =>
    api.get('/github/latest'),

  getRun: (runId) =>
    api.get(`/github/runs/${runId}`),

  getRunJobs: (runId) =>
    api.get(`/github/runs/${runId}/jobs`),

  triggerDeployment: ({
    workflowId,
    branch = 'main'
  } = {}) =>
    api.post('/github/trigger', {
      workflowId,
      branch
    })
};

/* =========================================================
   ENVIRONMENT API
========================================================= */

export const environmentsAPI = {
  getAll: () =>
    api.get('/environments'),

  getById: (id) =>
    api.get(`/environments/${id}`),

  create: (environmentData) =>
    api.post('/environments', environmentData),

  update: (id, environmentData) =>
    api.put(`/environments/${id}`, environmentData)
};

/* =========================================================
   MONITORING API
========================================================= */

export const monitoringAPI = {
  getMetrics: () =>
    api.get('/monitoring'),

  getCloudWatchMetrics: () =>
    api.get('/aws/cloudwatch/metrics')
};

/* =========================================================
   AWS API
========================================================= */

export const awsAPI = {

  /*
   * ECS service status
   */
  getECSStatus: () =>
    api.get('/aws/ecs/status'),

  /*
   * Application Load Balancer status
   */
  getALBStatus: () =>
    api.get('/aws/alb/status'),

  /*
   * CloudWatch metrics
   */
  getCloudWatchMetrics: () =>
    api.get('/aws/cloudwatch/metrics'),

  /*
   * ECS CloudWatch container logs
   */
  getCloudWatchLogs: (limit = 100) =>
    api.get('/aws/logs', {
      params: {
        limit
      }
    })
};

export default api;