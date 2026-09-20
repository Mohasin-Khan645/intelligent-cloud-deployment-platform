import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle token expiration or 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRoute = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
      if (!isAuthRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// Projects endpoints
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getDashboardStats: () => api.get('/projects/stats/dashboard')
};

// Deployments endpoints
export const deploymentsAPI = {
  getAll: (params) => api.get('/deployments', { params }),
  getById: (id) => api.get(`/deployments/${id}`),
  create: (data) => api.post('/deployments', data),
  getLogs: (id) => api.get(`/deployments/${id}/logs`)
};

// Environments endpoints
export const environmentsAPI = {
  getAll: (params) => api.get('/environments', { params }),
  getById: (id) => api.get(`/environments/${id}`),
  create: (data) => api.post('/environments', data),
  update: (id, data) => api.put(`/environments/${id}`, data)
};

// Monitoring endpoints
export const monitoringAPI = {
  getMetrics: () => api.get('/monitoring')
};

export default api;

