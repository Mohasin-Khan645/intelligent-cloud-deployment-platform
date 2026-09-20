import React from 'react';

const DashboardCard = ({ title, value, icon: Icon, color = 'cyan', subtitle, trend }) => {
  const colorMap = {
    cyan: { bg: 'rgba(6, 182, 212, 0.1)', text: '#06B6D4', border: 'rgba(6, 182, 212, 0.2)' },
    emerald: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981', border: 'rgba(16, 185, 129, 0.2)' },
    rose: { bg: 'rgba(244, 63, 94, 0.1)', text: '#F43F5E', border: 'rgba(244, 63, 94, 0.2)' },
    amber: { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.2)' },
    purple: { bg: 'rgba(168, 85, 247, 0.1)', text: '#A855F7', border: 'rgba(168, 85, 247, 0.2)' }
  };

  const scheme = colorMap[color] || colorMap.cyan;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </span>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#FFFFFF', marginTop: '0.35rem', letterSpacing: '-0.03em' }}>
            {value}
          </div>
        </div>
        <div style={{
          padding: '0.65rem',
          borderRadius: '8px',
          backgroundColor: scheme.bg,
          color: scheme.text,
          border: `1px solid ${scheme.border}`
        }}>
          {Icon && <Icon size={22} />}
        </div>
      </div>

      {(subtitle || trend) && (
        <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {subtitle && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</span>}
          {trend && <span style={{ fontSize: '0.75rem', fontWeight: 600, color: scheme.text }}>{trend}</span>}
        </div>
      )}
    </div>
  );
};

export default DashboardCard;

