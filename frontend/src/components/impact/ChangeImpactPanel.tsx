import React from 'react';
import { MLPrediction } from '../../types';

interface ChangeImpactPanelProps {
  changedFile: string | null;
  predictions: MLPrediction[];
  mlStatus: 'success' | 'unavailable' | 'idle';
}

export const ChangeImpactPanel: React.FC<ChangeImpactPanelProps> = ({
  changedFile,
  predictions,
  mlStatus
}) => {
  if (mlStatus === 'unavailable') {
    return (
      <div style={{ color: 'var(--color-med)', padding: '16px', fontStyle: 'italic' }}>
        ⚠️ ML impact prediction unavailable. (Running in dependency-only mode)
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', padding: '16px', fontSize: '12px' }}>
        {changedFile ? (
          <>
            No downstream candidate files impacted by recent edits to <code>{changedFile}</code>.
          </>
        ) : (
          'Modify and save a file to trigger change detection and dynamic ML risk evaluation.'
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Source Change Artifact:
          </span>{' '}
          <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>{changedFile}</strong>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Model: <code>RandomForestClassifier (v1.0)</code> • {predictions.length} candidate artifacts scored
        </div>
      </div>

      <div className="impact-grid">
        {predictions.map((p) => {
          const percent = Math.round(p.impactProbability * 100);
          return (
            <div key={p.targetFile} className={`impact-card risk-${p.riskLevel}`}>
              <div className="impact-header">
                <span className="impact-file">{p.targetFile}</span>
                <span className={`impact-badge badge-${p.riskLevel}`}>
                  {p.riskLevel} • {percent}%
                </span>
              </div>

              <div className="impact-prob-bar">
                <div
                  className="impact-prob-fill"
                  style={{
                    width: `${percent}%`,
                    backgroundColor:
                      p.riskLevel === 'HIGH'
                        ? 'var(--color-high)'
                        : p.riskLevel === 'MEDIUM'
                        ? 'var(--color-med)'
                        : 'var(--color-low)'
                  }}
                />
              </div>

              {p.explanationFactors && p.explanationFactors.length > 0 && (
                <ul className="impact-explanations">
                  {p.explanationFactors.map((exp, idx) => (
                    <li key={idx}>{exp}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
