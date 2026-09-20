import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, User, GitBranch, Bell, Shield, Save, Check } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();

  const [profileName, setProfileName] = useState(user?.name || 'DevOps Admin');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'admin@clouddeploy.local');
  const [defaultEnv, setDefaultEnv] = useState('Production');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [notifyDeploySuccess, setNotifyDeploySuccess] = useState(true);
  const [notifyDeployFailure, setNotifyDeployFailure] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <SettingsIcon size={26} style={{ color: '#38BDF8' }} />
            <span>Platform Configuration & Settings</span>
          </h1>
          <p className="page-subtitle">
            Manage your developer profile, default deployment preferences, and notifications
          </p>
        </div>

        <button onClick={handleSave} className="btn btn-primary btn-sm">
          {saved ? <Check size={14} /> : <Save size={14} />}
          <span>{saved ? 'Settings Saved' : 'Save Changes'}</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Profile Settings */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <User size={18} style={{ color: '#38BDF8' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FFFFFF' }}>User Profile</h2>
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Repository & Environment Defaults */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <GitBranch size={18} style={{ color: '#10B981' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FFFFFF' }}>Deployment Defaults</h2>
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Default Target Environment</label>
              <select
                className="form-select"
                value={defaultEnv}
                onChange={(e) => setDefaultEnv(e.target.value)}
              >
                <option value="Development">Development</option>
                <option value="Staging">Staging</option>
                <option value="Production">Production</option>
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                Pre-selected target when creating new releases.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Default Source Git Branch</label>
              <input
                type="text"
                className="form-input"
                value={defaultBranch}
                onChange={(e) => setDefaultBranch(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                Primary branch checked out for automated builds.
              </span>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Bell size={18} style={{ color: '#F59E0B' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FFFFFF' }}>Notification Preferences</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={notifyDeploySuccess}
                onChange={(e) => setNotifyDeploySuccess(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#0284C7' }}
              />
              <div>
                <span style={{ color: '#FFFFFF', fontWeight: 500 }}>Notify on Pipeline Success</span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Send notification when deployment pipeline successfully cuts over traffic</p>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={notifyDeployFailure}
                onChange={(e) => setNotifyDeployFailure(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#0284C7' }}
              />
              <div>
                <span style={{ color: '#FFFFFF', fontWeight: 500 }}>Alert on Pipeline Failure & Rollback</span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Immediate critical alert on build errors or failed health checks</p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

