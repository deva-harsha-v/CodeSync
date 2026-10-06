import React from 'react';
import { UserProfile } from '../../types';

interface HeaderProps {
  users: UserProfile[];
  currentUser: UserProfile | null;
  onSelectUser: (user: UserProfile) => void;
  wsConnected: boolean;
  onRunTests: () => void;
  onReindexGraph: () => void;
  onGitCommit: () => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  users,
  currentUser,
  onSelectUser,
  wsConnected,
  onRunTests,
  onReindexGraph,
  onGitCommit,
  unreadNotificationsCount,
  onOpenNotifications
}) => {
  return (
    <header className="ide-header">
      <div className="brand-section">
        <div className="brand-logo">
          <span>⚡ CodeSync</span>
          <span className="brand-tag">Research Platform</span>
        </div>

        <div className="header-status">
          <div className={`status-dot ${wsConnected ? '' : 'disconnected'}`} />
          <span>{wsConnected ? 'Live OT Synchronized' : 'Connecting to Server...'}</span>
        </div>
      </div>

      <div className="header-actions">
        {/* Quick Demo Role Switcher */}
        <div className="role-picker">
          <label>Active User / Role:</label>
          <select
            value={currentUser?.id || ''}
            onChange={(e) => {
              const u = users.find((x) => x.id === e.target.value);
              if (u) onSelectUser(u);
            }}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.role})
              </option>
            ))}
          </select>
          {currentUser && (
            <span className={`role-badge role-${currentUser.role}`}>
              {currentUser.role}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <button className="btn btn-sm" onClick={onRunTests} title="Execute relevant tests using AST dependency information">
          ▶ Run Relevant Tests
        </button>

        <button className="btn btn-sm" onClick={onReindexGraph} title="Trigger full TypeScript Compiler AST re-indexing">
          ⟳ Re-Index AST Graph
        </button>

        <button className="btn btn-sm btn-primary" onClick={onGitCommit} title="Record Git commit with author metadata">
          ✓ Git Commit
        </button>

        {/* Notifications Button */}
        <button className="btn btn-sm" onClick={onOpenNotifications} style={{ position: 'relative' }}>
          🔔 Notifications
          {unreadNotificationsCount > 0 && (
            <span
              style={{
                marginLeft: '4px',
                background: 'var(--color-high)',
                color: '#fff',
                borderRadius: '8px',
                padding: '0 5px',
                fontSize: '10px',
                fontWeight: '700'
              }}
            >
              {unreadNotificationsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
