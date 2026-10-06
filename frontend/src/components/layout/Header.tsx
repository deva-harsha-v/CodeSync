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
  onNavigateHome?: () => void;
  onSignOut?: () => void;
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
  onOpenNotifications,
  onNavigateHome,
  onSignOut
}) => {
  return (
    <header className="ide-header">
      <div className="brand-section">
        <div
          className="brand-logo"
          onClick={onNavigateHome}
          title={onNavigateHome ? 'Click to visit Landing Page' : undefined}
          style={{ cursor: onNavigateHome ? 'pointer' : 'default' }}
        >
          <span>⚡ CodeSync</span>
          <span className="brand-tag">Research Platform</span>
        </div>

        <div className="header-status">
          <div className={`status-dot ${wsConnected ? '' : 'disconnected'}`} />
          <span>{wsConnected ? 'Live OT Synchronized' : 'Connecting to Server...'}</span>
        </div>
      </div>

      <div className="header-actions">
        {onNavigateHome && (
          <button className="btn btn-sm" onClick={onNavigateHome} title="Return to Landing Page">
            🏠 Home
          </button>
        )}

        {/* Quick Demo Role Switcher */}
        <div className="role-picker">
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--color-info)',
              background: 'rgba(88, 166, 255, 0.12)',
              border: '1px solid rgba(88, 166, 255, 0.3)',
              borderRadius: '4px',
              padding: '1px 5px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            Demo Mode
          </span>
          <label>Active User:</label>
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

        {onSignOut && (
          <button className="btn btn-sm" onClick={onSignOut} title="Sign Out to Login Page">
            🚪 Sign Out
          </button>
        )}
      </div>
    </header>
  );
};
