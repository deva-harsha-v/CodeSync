import React, { useState } from 'react';
import { ProjectFile } from '../../types';

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
  const [reason, setReason] = useState('Need to update function signature to support student wallet balance');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(reason);
      onClose();
    } catch (err: any) {
      alert(`Error submitting access request: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3 className="modal-title">🔒 Controlled Artifact Access Request</h3>
        <p className="modal-desc">
          File <strong>`{file.path}`</strong> is actively owned by <strong>{file.owner_name || 'Another Developer'}</strong> ({file.owner_role || 'Developer'}).
          To edit this module, you must submit a formal access request.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Justification / Modification Reason:
          </label>
          <textarea
            className="modal-input"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why you need write access to this module..."
            required
          />

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
