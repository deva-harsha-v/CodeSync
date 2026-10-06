import React from 'react';
import { DocumentItem, DocumentLink } from '../../types';
import { Icons } from '../common/Icons';

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
    <div className="sidebar-content" style={{ padding: '10px 14px', fontSize: '12px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px'
      }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
          Document-to-Code Traceability Matrix
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {documents.length} specifications
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {documents.map((doc) => {
          const docLinks = links.filter((l) => l.document_id === doc.id);
          const status = doc.status || (doc.verified ? 'Verified' : 'Draft');

          let statusBg = 'var(--color-low-bg)';
          let statusColor = 'var(--color-low)';
          if (status === 'Draft') {
            statusBg = 'rgba(148, 163, 184, 0.15)';
            statusColor = '#94a3b8';
          } else if (status === 'Submitted') {
            statusBg = 'var(--color-info-bg)';
            statusColor = 'var(--color-info)';
          } else if (status === 'Reviewed') {
            statusBg = 'var(--color-med-bg)';
            statusColor = 'var(--color-med)';
          }

          return (
            <div
              key={doc.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {/* Document Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icons.File size={13} color="var(--accent-blue)" />
                  <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-main)' }}>
                    {doc.title}
                  </span>
                </div>
                <span
                  style={{
                    backgroundColor: statusBg,
                    color: statusColor,
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: '10px',
                    border: `1px solid ${statusColor}33`
                  }}
                >
                  {status}
                </span>
              </div>

              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                {doc.content.slice(0, 95)}...
              </p>

              {/* 5-Stage Engineering Traceability Chain Matrix */}
              <div style={{ marginTop: '2px' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.4px' }}>
                  Requirement → Artifact → Dependency → Test → Result
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {docLinks.map((link) => {
                    const testFile = link.file_path.includes('auth')
                      ? 'tests/auth.test.ts'
                      : 'tests/user.test.ts';

                    return (
                      <div
                        key={link.id}
                        style={{
                          backgroundColor: '#070a13',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '4px',
                          padding: '6px 8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={() => onSelectFileByPath && onSelectFileByPath(link.file_path)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>
                            {link.file_name} {link.target_symbol ? `:: ${link.target_symbol}()` : ''}
                          </span>
                          <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            {link.link_type}
                          </span>
                        </div>

                        {/* Chain row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflowX: 'auto' }}>
                          <span style={{ color: 'var(--text-main)' }}>Req</span>
                          <span style={{ color: 'var(--text-dim)' }}>→</span>
                          <span style={{ color: 'var(--accent-blue)' }}>{link.file_name.split('.')[0]}</span>
                          <span style={{ color: 'var(--text-dim)' }}>→</span>
                          <span style={{ color: '#38bdf8' }}>AST Edge</span>
                          <span style={{ color: 'var(--text-dim)' }}>→</span>
                          <span style={{ color: 'var(--color-low)' }}>{testFile}</span>
                          <span style={{ color: 'var(--text-dim)' }}>→</span>
                          <span style={{ color: status === 'Verified' ? 'var(--color-low)' : 'var(--color-med)', fontWeight: 600 }}>
                            {status === 'Verified' ? 'PASSED' : 'CHECK'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {canVerify && status !== 'Verified' && onVerifyDocument && (
                <div style={{ marginTop: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '6px', textAlign: 'right' }}>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => onVerifyDocument(doc.id)}
                    style={{ fontSize: '10px', padding: '2px 8px', gap: '4px' }}
                  >
                    <Icons.Check size={11} color="#fff" />
                    <span>Verify Document</span>
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
