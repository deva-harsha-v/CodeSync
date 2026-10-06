import React from 'react';
import { AuditLogItem } from '../../types';
import { Icons } from '../common/Icons';

interface AuditLogViewerProps {
  logs: AuditLogItem[];
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ logs }) => {
  return (
    <div className="sidebar-content" style={{ padding: '10px 14px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px'
      }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
          Audit Trail & Activity Log
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {logs.length} records
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {logs.map((log) => {
          const time = new Date(log.created_at).toLocaleTimeString();
          const initials = log.user_name
            ? log.user_name.split(' ').map((n) => n[0]).join('').slice(0, 2)
            : 'US';

          let actionColor = 'var(--accent-blue)';
          if (log.action.includes('SAVE') || log.action.includes('UPDATE')) actionColor = 'var(--color-low)';
          else if (log.action.includes('TEST')) actionColor = '#a855f7';
          else if (log.action.includes('ACCESS')) actionColor = 'var(--color-med)';
          else if (log.action.includes('FAIL') || log.action.includes('DENY')) actionColor = 'var(--color-high)';

          return (
            <div
              key={log.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontWeight: 700,
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: actionColor,
                  backgroundColor: '#090d16',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: `1px solid ${actionColor}33`
                }}>
                  {log.action}
                </span>
                <span style={{ color: 'var(--text-dim)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                  {time}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 600,
                  color: 'var(--text-muted)'
                }}>
                  {initials}
                </div>
                <span style={{ color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text-main)' }}>{log.user_name}</strong> ({log.user_role})
                </span>
              </div>

              {log.details && (
                <div style={{
                  color: 'var(--text-dim)',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
