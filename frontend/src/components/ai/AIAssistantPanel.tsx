import React, { useState } from 'react';

interface AIAssistantPanelProps {
  currentFilePath: string;
  testRun: any;
  predictions: any[];
  onApplyFix: (filePath: string, proposedCode: string) => void;
  onRequestAnalysis: () => Promise<any>;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  currentFilePath,
  testRun,
  predictions,
  onApplyFix,
  onRequestAnalysis
}) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAskAI = async () => {
    setLoading(true);
    try {
      const res = await onRequestAnalysis();
      setAnalysis(res.analysis);
    } catch (err: any) {
      alert(`AI analysis failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-panel-layout">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <strong style={{ color: 'var(--accent-blue)' }}>🤖 CodeSync Contextual AI</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
            Receives role, AST graph, ML risk scores, and test traces
          </span>
        </div>
        <button className="btn btn-sm btn-primary" onClick={handleAskAI} disabled={loading}>
          {loading ? 'Analyzing Context...' : '✨ Run Contextual Diagnosis'}
        </button>
      </div>

      {analysis ? (
        <div className="ai-bubble">
          <div className="ai-header">
            <span>Diagnosis & Impact Guidance</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{analysis.provider}</span>
          </div>

          <div>
            <h4 style={{ fontSize: '12px', color: 'var(--color-high)', marginBottom: '4px' }}>Root Cause:</h4>
            <p style={{ fontSize: '12px' }}>{analysis.rootCause}</p>
          </div>

          <div style={{ marginTop: '8px' }}>
            <h4 style={{ fontSize: '12px', color: 'var(--accent-blue)', marginBottom: '4px' }}>Dependency & ML Impact Breakdown:</h4>
            <div style={{ fontSize: '12px', whiteSpace: 'pre-line' }}>{analysis.impactAnalysis}</div>
          </div>

          {analysis.fixSuggestion && (
            <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--color-low)' }}>
                  Proposed Fix for {analysis.fixSuggestion.targetFile}:
                </span>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => onApplyFix(analysis.fixSuggestion.targetFile, analysis.fixSuggestion.proposedCode)}
                >
                  ✓ Review & Apply Suggestion
                </button>
              </div>

              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                {analysis.fixSuggestion.description}
              </p>

              <div className="diff-box">
                {analysis.fixSuggestion.diff}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)', padding: '16px', fontSize: '12px' }}>
          Click "Run Contextual Diagnosis" to investigate test failures, understand ML predictions, or receive verified fix recommendations.
        </div>
      )}
    </div>
  );
};
