import React from 'react';
import { IconGitBranch, IconTerminal, IconPanelRight } from '../common/Icons';

interface StatusBarProps {
  wsConnected: boolean;
  nodesCount: number;
  edgesCount: number;
  mlStatus: 'success' | 'unavailable' | 'idle';
  testRun: any;
  gitBranch?: string;
  cursorPos?: { line: number; col: number };
  activeLanguage?: string;
  onToggleConsole?: () => void;
  onToggleRightDock?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  wsConnected,
  nodesCount,
  edgesCount,
  mlStatus,
  testRun,
  gitBranch = 'main',
  cursorPos = { line: 1, col: 1 },
  activeLanguage = 'TypeScript',
  onToggleConsole,
  onToggleRightDock
}) => {
  const getTestStatusBadge = () => {
    if (!testRun) return <span className="status-item-text">Tests: Idle</span>;
    if (testRun.status === 'failed') {
      return (
        <span className="status-item-text text-danger">
          Tests: {testRun.failedTests}/{testRun.totalTests} failed
        </span>
      );
    }
    return (
      <span className="status-item-text text-success">
        Tests: {testRun.passedTests}/{testRun.totalTests} passed
      </span>
    );
  };

  const getMlStatusText = () => {
    switch (mlStatus) {
      case 'success':
        return <span className="status-item-text text-success">ML: Ready</span>;
      case 'unavailable':
        return <span className="status-item-text text-warning">ML: Offline</span>;
      default:
        return <span className="status-item-text">ML: Standby</span>;
    }
  };

  return (
    <footer className="ide-status-bar" role="contentinfo">
      {/* Left status items */}
      <div className="status-group-left">
        <div className="status-item">
          <span className={`status-indicator-dot ${wsConnected ? 'connected' : 'disconnected'}`} />
          <span className="status-item-text">{wsConnected ? 'Connected' : 'Reconnecting...'}</span>
        </div>

        <div className="status-item">
          <span className="status-item-text">OT: {wsConnected ? 'Synchronized' : 'Inactive'}</span>
        </div>

        <div className="status-item">
          <span className="status-item-text">
            AST: {nodesCount} nodes · {edgesCount} edges
          </span>
        </div>

        <div className="status-item">{getMlStatusText()}</div>

        <div className="status-item" onClick={onToggleConsole} style={{ cursor: onToggleConsole ? 'pointer' : 'default' }}>
          {getTestStatusBadge()}
        </div>

        <div className="status-item">
          <IconGitBranch size={13} />
          <span className="status-item-text">{gitBranch}</span>
        </div>
      </div>

      {/* Right status items */}
      <div className="status-group-right">
        <div className="status-item">
          <span className="status-item-text">
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
        </div>

        <div className="status-item">
          <span className="status-item-text">{activeLanguage}</span>
        </div>

        <div className="status-item">
          <span className="status-item-text">UTF-8</span>
        </div>

        {onToggleConsole && (
          <button className="status-btn" onClick={onToggleConsole} title="Toggle Console & Test Dock (Ctrl+`)">
            <IconTerminal size={13} />
          </button>
        )}

        {onToggleRightDock && (
          <button className="status-btn" onClick={onToggleRightDock} title="Toggle Right Intelligence Dock (Ctrl+Shift+I)">
            <IconPanelRight size={13} />
          </button>
        )}
      </div>
    </footer>
  );
};
