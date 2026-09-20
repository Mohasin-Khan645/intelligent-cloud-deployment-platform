import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  Rocket,
  Layers,
  TerminalSquare,
  Activity,
  Settings,
  Server
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Projects', path: '/projects', icon: FolderGit2 },
  { name: 'Deployments', path: '/deployments', icon: Rocket },
  { name: 'Environments', path: '/environments', icon: Layers },
  { name: 'Logs', path: '/logs', icon: TerminalSquare },
  { name: 'Monitoring', path: '/monitoring', icon: Activity },
  { name: 'Settings', path: '/settings', icon: Settings }
];

const Sidebar = () => {
  return (
    <aside style={{
      width: '240px',
      backgroundColor: '#0D131F',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '1.25rem 0.75rem',
      flexShrink: 0
    }}>
      <div>
        <div style={{
          padding: '0.5rem 0.75rem 1rem',
          fontSize: '0.7rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.075em'
        }}>
          Control Plane
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: 'none',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                  borderLeft: isActive ? '3px solid #38BDF8' : '3px solid transparent',
                  transition: 'all 0.15s ease'
                })}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Local System Status Card */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '0.85rem',
        margin: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <Server size={14} style={{ color: '#10B981' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FFFFFF' }}>Local Node Agent</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Backend: <span style={{ color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>:5000</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          DB: <span style={{ color: '#10B981' }}>PostgreSQL</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

