import React, { useState } from 'react';
import { ProjectFile } from '../../types';
import { Icons } from '../common/Icons';

interface AccessRequestModalProps {
  file: ProjectFile;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export const AccessRequestModal: React.FC<AccessRequestModalProps> = ({
  file,
  onClose,
  onSubmit
}) => {
  const [reason, setReason] = useState(
    'Need to update function signature to support student wallet balance'
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onSubmit(reason.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting access request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-med)'
            }}>
              <Icons.Lock size={16} color="var(--color-med)" />
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
              Artifact Access Request
            </h3>
          </div>
          <button className="btn btn-sm" onClick={onClose} style={{ padding: '2px 6px' }}>
            <Icons.X size={14} color="var(--text-muted)" />
          </button>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px' }}>
          File <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', backgroundColor: '#090d16', padding: '1px 5px', borderRadius: '4px' }}>{file.path}</code> is actively owned by <strong style={{ color: 'var(--text-main)' }}>{file.owner_name || 'Another Developer'}</strong> ({file.owner_role || 'Developer'}). Submit a formal modification request to gain write authorization.
        </p>

        {errorMsg && (
          <div style={{
            padding: '8px 10px',
            backgroundColor: 'var(--color-high-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '4px',
            color: 'var(--color-high)',
            fontSize: '11px',
            marginBottom: '12px'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Modification Justification:
          </label>
          <textarea
            className="modal-input"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why you require write access to this module..."
            required
            style={{ fontSize: '12px', lineHeight: 1.4 }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button type="button" className="btn btn-sm" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={submitting || !reason.trim()}
              style={{ gap: '4px' }}
            >
              <Icons.Check size={12} color="#fff" />
              <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
