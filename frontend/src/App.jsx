import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Deployments from './pages/Deployments';
import DeploymentDetails from './pages/DeploymentDetails';
import Environments from './pages/Environments';
import Logs from './pages/Logs';
import Monitoring from './pages/Monitoring';
import Settings from './pages/Settings';

// Protected layout wrapper
const ProtectedLayout = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
        <LoadingSpinner text="Checking authentication session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

// Public route wrapper (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
        <LoadingSpinner text="Initializing..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected Dashboard & CI/CD Platform Routes */}
      <Route
        path="/"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedLayout>
            <Projects />
          </ProtectedLayout>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ProtectedLayout>
            <ProjectDetails />
          </ProtectedLayout>
        }
      />
      <Route
        path="/deployments"
        element={
          <ProtectedLayout>
            <Deployments />
          </ProtectedLayout>
        }
      />
      <Route
        path="/deployments/:id"
        element={
          <ProtectedLayout>
            <DeploymentDetails />
          </ProtectedLayout>
        }
      />
      <Route
        path="/environments"
        element={
          <ProtectedLayout>
            <Environments />
          </ProtectedLayout>
        }
      />
      <Route
        path="/logs"
        element={
          <ProtectedLayout>
            <Logs />
          </ProtectedLayout>
        }
      />
      <Route
        path="/monitoring"
        element={
          <ProtectedLayout>
            <Monitoring />
          </ProtectedLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedLayout>
            <Settings />
          </ProtectedLayout>
        }
      />

      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

