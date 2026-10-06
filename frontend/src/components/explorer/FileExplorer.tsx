import React, { useState } from 'react';
import { ProjectFile, MLPrediction } from '../../types';

interface FileExplorerProps {
  files: ProjectFile[];
  selectedFileId: string | null;
  predictions?: MLPrediction[];
  onSelectFile: (file: ProjectFile) => void;
  onRequestAccess: (file: ProjectFile) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFileId,
  predictions = [],
  onSelectFile,
  onRequestAccess
}) => {
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  // Group files by top-level directory
  const groups: Record<string, ProjectFile[]> = {};
  for (const f of files) {
    const parts = f.path.split('/');
    const folder = parts.length > 1 ? parts[0] + '/' : 'root/';
    if (!groups[folder]) groups[folder] = [];
    groups[folder].push(f);
  }

  const toggleFolder = (folder: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  return (
    <div className="sidebar-content">
      <div style={{ padding: '0 14px 8px 14px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
        Project Files & Ownership
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {Object.entries(groups).map(([folder, groupFiles]) => {
          const isCollapsed = collapsedFolders[folder];

          return (
            <div key={folder} style={{ marginBottom: '6px' }}>
              <div
                style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  userSelect: 'none'
                }}
                onClick={() => toggleFolder(folder)}
              >
                <span>{isCollapsed ? '▸' : '▾'}</span>
                <span>📁 {folder}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>({groupFiles.length})</span>
              </div>

              {!isCollapsed && (
                <ul className="file-list" style={{ paddingLeft: '8px' }}>
                  {groupFiles.map((file) => {
                    const isSelected = file.id === selectedFileId;
                    const ownerInitials = file.owner_name ? file.owner_name.split(' ')[0] : 'Unassigned';

                    // Check if file is predicted as impacted by ML
                    const pred = predictions.find((p) => p.targetFile === file.path);

                    return (
                      <li
                        key={file.id}
                        className={`file-item ${isSelected ? 'active' : ''}`}
                        onClick={() => onSelectFile(file)}
                      >
                        <div className="file-info">
                          <span>{file.path.endsWith('.tsx') ? '⚛' : file.path.includes('.test.') ? '🧪' : '📄'}</span>
                          <span className="file-name" title={file.path}>
                            {file.name}
                          </span>
                        </div>

                        <div className="file-badges">
                          {pred && (
                            <span
                              className={`impact-badge badge-${pred.riskLevel}`}
                              style={{ fontSize: '9px', padding: '1px 4px' }}
                              title={`Predicted Impact: ${pred.riskLevel} (${Math.round(pred.impactProbability * 100)}%)`}
                            >
                              {pred.riskLevel[0]}
                            </span>
                          )}

                          <span
                            className="owner-badge"
                            title={`Owner: ${file.owner_name || 'Unassigned'} (${file.owner_role || 'Developer'})`}
                          >
                            {ownerInitials}
                          </span>

                          {!file.canEdit && (
                            <span
                              className="lock-badge"
                              title={`Restricted file: ${file.editRestrictionReason || 'Access request required'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onRequestAccess(file);
                              }}
                            >
                              🔒
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
