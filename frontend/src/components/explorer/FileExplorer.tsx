import React, { useState } from 'react';
import { ProjectFile, MLPrediction, UserProfile } from '../../types';
import {
  IconFolder,
  IconFolderOpen,
  IconFile,
  IconLock,
  IconChevronRight,
  IconChevronDown,
  IconSearch,
  IconMoreHorizontal,
  IconCheck
} from '../common/Icons';

interface FileExplorerProps {
  files: ProjectFile[];
  selectedFileId: string | null;
  onSelectFile: (file: ProjectFile) => void;
  onRequestAccess: (file: ProjectFile) => void;
  predictions?: MLPrediction[];
  currentUser?: UserProfile | null;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFileId,
  onSelectFile,
  onRequestAccess,
  predictions = [],
  currentUser
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderName: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  // Group files by root directory (backend, frontend, tests, root)
  const grouped: Record<string, ProjectFile[]> = {};
  files.forEach((f) => {
    const parts = f.path.split('/');
    const folder = parts.length > 1 ? parts[0] : 'root';
    if (!grouped[folder]) grouped[folder] = [];
    grouped[folder].push(f);
  });

  const getPredictionForFile = (path: string): MLPrediction | undefined => {
    return predictions.find((p) => p.targetFile === path || p.targetFile.endsWith(path.split('/').pop() || ''));
  };

  const renderImpactIndicator = (file: ProjectFile) => {
    const pred = getPredictionForFile(file.path);
    if (!pred) return null;

    const probPct = Math.round(pred.impactProbability * 100);
    const risk = pred.riskLevel?.toUpperCase();

    if (risk === 'HIGH') {
      return (
        <span className="file-impact-badge impact-high" title={`ML Prediction: ${probPct}% High Risk`}>
          <span className="impact-dot dot-high" /> {probPct}%
        </span>
      );
    }
    if (risk === 'MEDIUM') {
      return (
        <span className="file-impact-badge impact-med" title={`ML Prediction: ${probPct}% Medium Risk`}>
          <span className="impact-dot dot-med" /> {probPct}%
        </span>
      );
    }
    return (
      <span className="file-impact-badge impact-low" title={`ML Prediction: ${probPct}% Low Risk`}>
        <span className="impact-dot dot-low" /> {probPct}%
      </span>
    );
  };

  const ownedCount = files.filter((f) => f.owner_id === currentUser?.id || f.canEdit).length;
  const impactedCount = files.filter((f) => getPredictionForFile(f.path) !== undefined).length;

  return (
    <div className="file-explorer-container">
      {/* Explorer Header */}
      <div className="explorer-header">
        <span className="explorer-title">EXPLORER</span>
        <div className="explorer-header-actions">
          <span className="project-root-tag">SMART-CANTEEN</span>
        </div>
      </div>

      {/* Filter Input */}
      <div className="explorer-search-bar">
        <IconSearch size={13} color="var(--text-muted)" />
        <input
          type="text"
          className="explorer-search-input"
          placeholder="Filter files..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
        />
      </div>

      {/* File Tree */}
      <div className="explorer-tree">
        {Object.keys(grouped).map((folderKey) => {
          const folderFiles = grouped[folderKey].filter((f) =>
            searchFilter ? f.path.toLowerCase().includes(searchFilter.toLowerCase()) : true
          );

          if (folderFiles.length === 0) return null;
          const isCollapsed = !!collapsedFolders[folderKey];

          return (
            <div key={folderKey} className="explorer-folder-group">
              <div
                className="folder-header-row"
                onClick={() => toggleFolder(folderKey)}
              >
                {isCollapsed ? <IconChevronRight size={13} /> : <IconChevronDown size={13} />}
                {isCollapsed ? <IconFolder size={14} color="var(--color-primary)" /> : <IconFolderOpen size={14} color="var(--color-primary)" />}
                <span className="folder-name">{folderKey}</span>
                <span className="folder-count">{folderFiles.length}</span>
              </div>

              {!isCollapsed && (
                <div className="folder-files-list">
                  {folderFiles.map((file) => {
                    const isSelected = file.id === selectedFileId;
                    const isLocked = file.canEdit === false;

                    return (
                      <div
                        key={file.id}
                        className={`tree-file-row ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
                        onClick={() => onSelectFile(file)}
                        title={`${file.path} (Owner: ${file.owner_name || 'System'})`}
                      >
                        <div className="tree-file-left">
                          <IconFile size={13} color="var(--text-muted)" />
                          <span className="tree-file-name">{file.name}</span>
                        </div>

                        <div className="tree-file-right">
                          {renderImpactIndicator(file)}
                          {isLocked && (
                            <button
                              className="lock-icon-btn"
                              title="Locked by ownership gate - click to request edit access"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRequestAccess(file);
                              }}
                            >
                              <IconLock size={12} color="var(--color-warning)" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Explorer Summary Footer */}
      <div className="explorer-footer">
        <span>{files.length} files</span>
        <span>·</span>
        <span>{ownedCount} owned</span>
        <span>·</span>
        <span className={impactedCount > 0 ? 'text-warning' : ''}>{impactedCount} impacted</span>
      </div>
    </div>
  );
};
