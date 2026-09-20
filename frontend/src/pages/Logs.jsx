import React, { useState, useEffect } from 'react';
import { deploymentsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { TerminalSquare, RefreshCw, Copy, Check, Filter, Download } from 'lucide-react';

const Logs = () => {
  const [deployments, setDeployments] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [filterLevel, setFilterLevel] = useState('ALL');

  useEffect(() => {
    const loadDeployments = async () => {
      try {
        setIsLoading(true);
        const res = await deploymentsAPI.getAll();
        const list = res.data.data || [];
        setDeployments(list);
        if (list.length > 0) {
          setSelectedId(list[0].id.toString());
        }
      } catch (err) {
        console.error('Failed to load deployments for log viewer:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDeployments();
  }, []);

  useEffect(() => {
    const loadLogs = async () => {
      if (!selectedId) return;
      try {
        const res = await deploymentsAPI.getLogs(selectedId);
        setLogs(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch deployment logs:', err);
        setLogs([`[ERROR] Failed to fetch logs for deployment #${selectedId}`]);
      }
    };

    loadLogs();
  }, [selectedId]);

  const activeDeployment = deployments.find(d => d.id.toString() === selectedId);

  const filteredLogs = logs.filter(line => {
    if (filterLevel === 'ALL') return true;
    return line.includes(`[${filterLevel}]`);
  });

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    const element = document.createElement('a');
    const file = new Blob([logs.join('\n')], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `deployment-${selectedId}-logs.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <TerminalSquare size={26} style={{ color: '#38BDF8' }} />
            <span>Deployment Log Stream</span>
          </h1>
          <p className="page-subtitle">
            Structured build execution streams and container pipeline logs
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleCopyLogs} className="btn btn-secondary btn-sm" title="Copy to clipboard">
            {copied ? <Check size={14} style={{ color: '#10B981' }} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button onClick={handleDownloadLogs} className="btn btn-secondary btn-sm" title="Download log file">
            <Download size={14} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Selector Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        backgroundColor: 'var(--bg-card)',
        padding: '0.85rem 1.25rem',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Select Deployment:
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="form-select"
            style={{ width: 'auto', minWidth: '280px', padding: '0.45rem 0.75rem' }}
          >
            {deployments.map((d) => (
              <option key={d.id} value={d.id}>
                #{d.id} • {d.version} ({d.environment}) - {d.status}
              </option>
            ))}
          </select>
          {activeDeployment && <StatusBadge status={activeDeployment.status} />}
        </div>

        {/* Level filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Level:</span>
          {['ALL', 'INFO', 'WARN', 'ERROR', 'SUCCESS'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              style={{
                background: filterLevel === lvl ? 'var(--bg-elevated)' : 'transparent',
                color: filterLevel === lvl ? '#38BDF8' : 'var(--text-muted)',
                border: filterLevel === lvl ? '1px solid var(--border-light)' : '1px solid transparent',
                borderRadius: '4px',
                padding: '0.2rem 0.5rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal View */}
      {isLoading ? (
        <LoadingSpinner text="Connecting to log stream buffer..." />
      ) : (
        <div className="terminal-window">
          <div className="terminal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="terminal-dots">
                <span className="terminal-dot" style={{ backgroundColor: '#EF4444' }}></span>
                <span className="terminal-dot" style={{ backgroundColor: '#F59E0B' }}></span>
                <span className="terminal-dot" style={{ backgroundColor: '#10B981' }}></span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                deployment-{selectedId}.log
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {filteredLogs.length} entries
            </div>
          </div>

          <div className="terminal-body" style={{ minHeight: '380px' }}>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, idx) => {
                const isError = log.includes('[ERROR]');
                const isWarn = log.includes('[WARN]');
                const isSuccess = log.includes('[SUCCESS]');
                const isInfo = log.includes('[INFO]');

                return (
                  <div key={idx} className="log-line">
                    <span style={{ color: 'var(--text-muted)', userSelect: 'none', minWidth: '28px', textAlign: 'right' }}>
                      {idx + 1}
                    </span>
                    <span style={{
                      color: isError ? '#F43F5E' : isWarn ? '#FBBF24' : isSuccess ? '#34D399' : isInfo ? '#38BDF8' : '#CBD5E1'
                    }}>
                      {log}
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No log entries match the selected filter.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Logs;

