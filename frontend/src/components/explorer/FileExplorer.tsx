import React from 'react';
import { ProjectFile } from '../../types';

interface FileExplorerProps {
  files: ProjectFile[];
  selectedFileId: string | null;
  onSelectFile: (file: ProjectFile) => void;
  onRequestAccess: (file: ProjectFile) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFileId,
  onSelectFile,
  onRequestAccess
}) => {
  return (
    <div className="sidebar-content">
      <div style={{ padding: '0 14px 8px 14px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
        Project Files & Ownership
      </div>
      <ul className="file-list">
        {files.map((file) => {
          const isSelected = file.id === selectedFileId;
          const ownerInitials = file.owner_name
            ? file.owner_name.split(' ')[0]
            : 'Unassigned';

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
    </div>
  );
};
