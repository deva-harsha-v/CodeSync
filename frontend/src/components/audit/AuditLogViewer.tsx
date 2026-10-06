import React from 'react';
import { AuditLogItem } from '../../types';

interface AuditLogViewerProps {
  logs: AuditLogItem[];
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ logs }) => {
  return (
    <div className="sidebar-content" style={{ padding: '8px 14px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
        Audit Trail & Activity Timeline
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {logs.map((log) => {
          const time = new Date(log.created_at).toLocaleTimeString();
          return (
            <div
              key={log.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '6px 8px',
                fontSize: '11px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <strong style={{ color: 'var(--accent-blue)' }}>{log.action}</strong>
                <span style={{ color: 'var(--text-dim)' }}>{time}</span>
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                {log.user_name} ({log.user_role})
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
