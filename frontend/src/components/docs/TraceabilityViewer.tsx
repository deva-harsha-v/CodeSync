import React from 'react';
import { DocumentItem, DocumentLink } from '../../types';

interface TraceabilityViewerProps {
  documents: DocumentItem[];
  links: DocumentLink[];
  onSelectFileByPath?: (filePath: string) => void;
}

export const TraceabilityViewer: React.FC<TraceabilityViewerProps> = ({
  documents,
  links,
  onSelectFileByPath
}) => {
  return (
    <div className="sidebar-content" style={{ padding: '8px 14px' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
        Document-to-Code Traceability
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {documents.map((doc) => {
          const docLinks = links.filter((l) => l.document_id === doc.id);

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
              <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--accent-blue)', marginBottom: '4px' }}>
                📄 {doc.title}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                {doc.content.slice(0, 110)}...
              </p>

              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                  Linked Code Artifacts ({docLinks.length}):
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
            </div>
          );
        })}
      </div>
    </div>
  );
};
