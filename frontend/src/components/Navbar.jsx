import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cloud, User as UserIcon, LogOut, ShieldCheck, Terminal } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{
      height: '64px',
      backgroundColor: '#0A0E18',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.75rem',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      {/* Brand & Platform Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0284C7, #06B6D4)',
            padding: '0.45rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <Cloud size={20} />
          </div>
          <div>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              Intelligent Cloud
            </span>
            <span style={{ fontSize: '0.75rem', color: '#38BDF8', marginLeft: '0.4rem', fontWeight: 600, textTransform: 'uppercase' }}>
              CI/CD Platform
            </span>
          </div>
        </Link>
        <span style={{
          fontSize: '0.7rem',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          color: '#38BDF8',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '0.15rem 0.5rem',
          borderRadius: '4px',
          fontFamily: 'var(--font-mono)'
        }}>
          PHASE 1 • LOCAL
        </span>
      </div>

      {/* User Section & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38BDF8'
          }}>
            <UserIcon size={16} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF' }}>
              {user ? user.name : 'DevOps Engineer'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {user ? user.email : 'local@cluster'}
            </span>
          </div>
        </div>

        <Link to="/settings" className="btn btn-secondary btn-sm" title="Profile & Settings">
          Profile
        </Link>

        <button onClick={handleLogout} className="btn btn-danger btn-sm" title="Log Out">
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;

