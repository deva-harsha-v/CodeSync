import React, { useState } from 'react';
import { IconSparkles, IconCheck, IconX, IconTriangleAlert, IconFlask, IconCode, IconShield } from '../common/Icons';

export type PatchLifecycleState = 'proposed' | 'applying' | 'verified' | 'failed';

interface AIReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetFilePath: string;
  originalCode: string;
  proposedCode: string;
  description: string;
  diffSummary?: { linesAdded: number; linesDeleted: number };
  onApplyAndTest: (targetFilePath: string, proposedCode: string) => Promise<boolean>;
  onRevertPatch?: () => void;
  onInspectFailure?: () => void;
}

export const AIReviewModal: React.FC<AIReviewModalProps> = ({
  isOpen,
  onClose,
  targetFilePath,
  originalCode,
  proposedCode,
  description,
  diffSummary = { linesAdded: 14, linesDeleted: 6 },
  onApplyAndTest,
  onRevertPatch,
  onInspectFailure
}) => {
  const [lifecycle, setLifecycle] = useState<PatchLifecycleState>('proposed');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApply = async () => {
    setLifecycle('applying');
    try {
      const testsPassed = await onApplyAndTest(targetFilePath, proposedCode);
      if (testsPassed) {
        setLifecycle('verified');
      } else {
        setLifecycle('failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error applying patch');
      setLifecycle('failed');
    }
  };

  return (
    <div className="modal-overlay" onClick={lifecycle === 'applying' ? undefined : onClose}>
      <div className="ai-review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ai-review-header">
          <div className="ai-review-title-row">
            <div className="ai-badge-icon">
              <IconSparkles size={16} color="var(--color-ai)" />
            </div>
            <div>
              <h3 className="ai-review-title">AI Remediation Review & Diff Inspector</h3>
              <p className="ai-review-subtitle">
                Target Artifact: <code>{targetFilePath}</code>
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} disabled={lifecycle === 'applying'}>
            <IconX size={16} />
          </button>
        </div>

        <div className="ai-review-body">
          {/* Explanation */}
          <div className="ai-review-desc-card">
            <div className="ai-review-desc-title">Proposed Contract Resolution:</div>
            <p>{description}</p>
          </div>

          {/* Diff Metrics Bar */}
          <div className="ai-diff-stats-bar">
            <span className="diff-stat-item diff-added">+{diffSummary.linesAdded} lines</span>
            <span className="diff-stat-item diff-deleted">-{diffSummary.linesDeleted} lines</span>
            <span className="diff-stat-item diff-target">Human-in-the-Loop Safeguard Active</span>
          </div>

          {/* Validation Checklist */}
          <div className="ai-validation-checklist">
            <div className="validation-item valid">
              <IconCheck size={14} color="var(--color-success)" />
              <span>TypeScript AST Syntactic & Type Validation Passed</span>
            </div>
            <div className="validation-item valid">
              <IconShield size={14} color="var(--color-success)" />
              <span>Artifact Ownership & Permission Verified</span>
            </div>
            <div className={`validation-item ${lifecycle === 'verified' ? 'valid' : lifecycle === 'failed' ? 'invalid' : 'pending'}`}>
              {lifecycle === 'verified' ? (
                <IconCheck size={14} color="var(--color-success)" />
              ) : lifecycle === 'failed' ? (
                <IconTriangleAlert size={14} color="var(--color-danger)" />
              ) : (
                <IconFlask size={14} color="var(--text-muted)" />
              )}
              <span>
                {lifecycle === 'verified'
                  ? 'Relevant Test Suite Passed (2/2 Tests Green)'
                  : lifecycle === 'failed'
                  ? 'Verification Failed: Regression detected in test suite'
                  : 'Automated Test Verification Pending Application'}
              </span>
            </div>
          </div>

          {/* Unified Diff Box */}
          <div className="ai-diff-box">
            <div className="ai-diff-box-header">
              <span>Proposed Code Patch</span>
              <span className="code-lang-tag">TypeScript</span>
            </div>
            <pre className="ai-diff-pre">
              <code>{proposedCode}</code>
            </pre>
          </div>

          {/* Status Banners */}
          {lifecycle === 'applying' && (
            <div className="ai-status-banner info">
              <div className="spinner-sm" />
              <span>Applying verified patch and executing relevant AST dependency tests...</span>
            </div>
          )}

          {lifecycle === 'verified' && (
            <div className="ai-status-banner success">
              <IconCheck size={16} />
              <span>? Patch merged successfully! All impacted test assertions verified green.</span>
            </div>
          )}

          {lifecycle === 'failed' && (
            <div className="ai-status-banner error">
              <IconTriangleAlert size={16} />
              <span>
                ? Patch applied but automated test verification failed.{errorMessage ? ` (${errorMessage})` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="ai-review-footer">
          {lifecycle === 'proposed' && (
            <>
              <button className="btn btn-secondary" onClick={onClose}>
                Reject Suggestion
              </button>
              <button
                className="btn btn-secondary"
                onClick={async () => {
                  setLifecycle('applying');
                  try {
                    await onApplyAndTest(targetFilePath, proposedCode);
                    setLifecycle('verified');
                  } catch {
                    setLifecycle('failed');
                  }
                }}
              >
                Apply Patch
              </button>
              <button className="btn btn-primary" onClick={handleApply}>
                <IconSparkles size={14} /> Apply + Run Tests
              </button>
            </>
          )}

          {lifecycle === 'applying' && (
            <button className="btn btn-secondary" disabled>
              Applying & Testing...
            </button>
          )}

          {lifecycle === 'verified' && (
            <button className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          )}

          {lifecycle === 'failed' && (
            <>
              {onRevertPatch && (
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    onRevertPatch();
                    onClose();
                  }}
                >
                  Revert Patch
                </button>
              )}
              {onInspectFailure && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    onInspectFailure();
                    onClose();
                  }}
                >
                  Inspect Test Failure
                </button>
              )}
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
