import React from 'react';
import { DocumentItem, DocumentLink } from '../../types';

interface TraceabilityViewerProps {
  documents: DocumentItem[];
  links: DocumentLink[];
  currentUserRole?: string;
  onSelectFileByPath?: (filePath: string) => void;
  onVerifyDocument?: (docId: string) => void;
}

export const TraceabilityViewer: React.FC<TraceabilityViewerProps> = ({
  documents,
  links,
  currentUserRole,
  onSelectFileByPath,
  onVerifyDocument
}) => {
  const canVerify = currentUserRole === 'Admin' || currentUserRole === 'Reviewer';

  return (
    <div className="sidebar-content" style={{ padding: '8px 14px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
        Document-to-Code Traceability
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {documents.map((doc) => {
          const docLinks = links.filter((l) => l.document_id === doc.id);
          const status = doc.status || (doc.verified ? 'Verified' : 'Draft');

          let statusBg = 'var(--color-low-bg)';
          let statusColor = 'var(--color-low)';
          if (status === 'Draft') { statusBg = 'rgba(107, 114, 128, 0.2)'; statusColor = '#9ca3af'; }
          else if (status === 'Submitted') { statusBg = 'var(--color-info-bg)'; statusColor = 'var(--color-info)'; }
          else if (status === 'Reviewed') { statusBg = 'var(--color-med-bg)'; statusColor = 'var(--color-med)'; }

          return (
            <div
              key={doc.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--accent-blue)' }}>
                  📄 {doc.title}
                </span>
                <span
                  style={{
                    backgroundColor: statusBg,
                    color: statusColor,
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: '10px'
                  }}
                >
                  {status}
                </span>
              </div>

              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                {doc.content.slice(0, 100)}...
              </p>

              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                  Traceability Matrix ({docLinks.length} links):
                </div>
                {docLinks.map((link) => (
                  <div
                    key={link.id}
                    style={{
                      fontSize: '11px',
                      padding: '3px 0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onClick={() => onSelectFileByPath && onSelectFileByPath(link.file_path)}
                  >
                    <span style={{ color: 'var(--color-low)' }}>↳ {link.link_type}:</span>
                    <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                      {link.file_name} {link.target_symbol ? `:: ${link.target_symbol}()` : ''}
                    </code>
                  </div>
                ))}
              </div>

              {canVerify && status !== 'Verified' && onVerifyDocument && (
                <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '6px', textAlign: 'right' }}>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => onVerifyDocument(doc.id)}
                    style={{ fontSize: '10px', padding: '2px 8px' }}
                  >
                    ✓ Verify Document
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
