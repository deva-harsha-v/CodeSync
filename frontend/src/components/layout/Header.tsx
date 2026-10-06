import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../../types';
import {
  IconBolt,
  IconGitBranch,
  IconFlask,
  IconGitCommit,
  IconBell,
  IconMoreHorizontal,
  IconChevronDown,
  IconRefreshCw,
  IconUser,
  IconShield,
  IconHome
} from '../common/Icons';

interface HeaderProps {
  users: UserProfile[];
  currentUser: UserProfile | null;
  onSelectUser: (user: UserProfile) => void;
  wsConnected: boolean;
  collaboratorsCount?: number;
  onRunTests: () => void;
  onReindexGraph: () => void;
  onGitCommit: () => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onNavigateHome?: () => void;
  onSignOut?: () => void;
  onOpenOverview?: () => void;
  onOpenPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  users,
  currentUser,
  onSelectUser,
  wsConnected,
  collaboratorsCount = 3,
  onRunTests,
  onReindexGraph,
  onGitCommit,
  unreadNotificationsCount,
  onOpenNotifications,
  onNavigateHome,
  onSignOut,
  onOpenOverview,
  onOpenPalette
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const personaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
      if (personaRef.current && !personaRef.current.contains(e.target as Node)) {
        setShowPersonaMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="ide-header" role="banner">
      {/* Brand & Project Identity */}
      <div className="header-left">
        <div
          className="brand-logo"
          onClick={onNavigateHome}
          title={onNavigateHome ? 'CodeSync - Return to Landing Page' : undefined}
        >
          <div className="brand-icon-wrap">
            <IconBolt size={16} color="#fff" />
          </div>
          <span className="brand-name">CodeSync</span>
        </div>

        <div className="project-selector-pill" onClick={onOpenOverview} title="Click to view Project Overview">
          <span className="project-name">Smart Canteen</span>
          <span className="project-divider">/</span>
          <span className="branch-name">
            <IconGitBranch size={12} /> main
          </span>
        </div>

        {onOpenOverview && (
          <button
            className="btn btn-sm"
            onClick={onOpenOverview}
            style={{ fontSize: '11px', padding: '2px 8px', gap: '4px', backgroundColor: 'var(--bg-surface)' }}
            title="Return to Project Overview Dashboard"
          >
            <span>← Project Overview</span>
          </button>
        )}

        <div className="connection-pill">
          <span className={`status-dot ${wsConnected ? 'connected' : 'disconnected'}`} />
          <span className="connection-text">{wsConnected ? 'Connected' : 'Connecting'}</span>
          <span className="collaborators-badge" title="Active OT collaborators">
            {collaboratorsCount} collaborators
          </span>
        </div>
      </div>

      {/* Header Actions & User Management */}
      <div className="header-right">
        {/* Quick Operational Buttons */}
        <button className="btn btn-sm btn-ghost" onClick={onRunTests} title="Run Relevant Tests based on AST dependencies">
          <IconFlask size={14} color="var(--color-primary)" />
          <span>Run Tests</span>
        </button>

        <button className="btn btn-sm btn-ghost" onClick={onGitCommit} title="Record author-attributed Git commit">
          <IconGitCommit size={14} color="var(--color-warning)" />
          <span>Commit</span>
        </button>

        {/* Notifications Icon Button */}
        <button
          className="btn-icon notif-bell-btn"
          onClick={onOpenNotifications}
          title="Open Notifications Drawer"
          aria-label="Notifications"
        >
          <IconBell size={16} />
          {unreadNotificationsCount > 0 && (
            <span className="notif-badge-count">{unreadNotificationsCount}</span>
          )}
        </button>

        {/* Active Persona / User Selector Card */}
        <div className="persona-selector-container" ref={personaRef}>
          <button
            className="persona-btn"
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            title="Switch Active Persona"
          >
            <div className="persona-avatar">
              <IconUser size={13} color="var(--color-primary)" />
            </div>
            <div className="persona-info-col">
              <span className="persona-name">{currentUser?.full_name?.split(' ')[0] || 'User'}</span>
              <span className={`persona-role-tag role-${currentUser?.role?.toLowerCase()}`}>
                {currentUser?.role || 'Developer'}
              </span>
            </div>
            <IconChevronDown size={12} color="var(--text-muted)" />
          </button>

          {showPersonaMenu && (
            <div className="dropdown-menu persona-dropdown">
              <div className="dropdown-header">Switch Active Persona:</div>
              {users.map((u) => (
                <div
                  key={u.id}
                  className={`dropdown-item ${u.id === currentUser?.id ? 'active' : ''}`}
                  onClick={() => {
                    onSelectUser(u);
                    setShowPersonaMenu(false);
                  }}
                >
                  <div className="item-user-info">
                    <span className="item-user-name">{u.full_name}</span>
                    <span className="item-user-email">{u.email}</span>
                  </div>
                  <span className={`role-pill role-${u.role.toLowerCase()}`}>{u.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* More Options Dropdown (...) */}
        <div className="more-menu-container" ref={menuRef}>
          <button
            className="btn-icon"
            onClick={() => setShowMenu(!showMenu)}
            title="More Workspace Actions"
            aria-label="More options"
          >
            <IconMoreHorizontal size={16} />
          </button>

          {showMenu && (
            <div className="dropdown-menu more-dropdown">
              <div className="dropdown-section-title">Workspace Actions</div>
              <button
                className="dropdown-item"
                onClick={() => {
                  onRunTests();
                  setShowMenu(false);
                }}
              >
                <IconFlask size={14} /> Run Relevant Tests
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  onReindexGraph();
                  setShowMenu(false);
                }}
              >
                <IconRefreshCw size={14} /> Re-index AST Graph
              </button>
              {onOpenOverview && (
                <button
                  className="dropdown-item"
                  onClick={() => {
                    onOpenOverview();
                    setShowMenu(false);
                  }}
                >
                  <IconShield size={14} /> Project Overview
                </button>
              )}

              <div className="dropdown-divider" />
              <div className="dropdown-section-title">Git & Remote</div>
              <button
                className="dropdown-item"
                onClick={() => {
                  onGitCommit();
                  setShowMenu(false);
                }}
              >
                <IconGitCommit size={14} /> Create Verified Commit
              </button>

              <div className="dropdown-divider" />
              <div className="dropdown-section-title">Session</div>
              {onNavigateHome && (
                <button
                  className="dropdown-item"
                  onClick={() => {
                    onNavigateHome();
                    setShowMenu(false);
                  }}
                >
                  <IconHome size={14} /> Return to Landing Page
                </button>
              )}
              {onSignOut && (
                <button
                  className="dropdown-item text-danger"
                  onClick={() => {
                    onSignOut();
                    setShowMenu(false);
                  }}
                >
                  Sign Out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
