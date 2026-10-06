import React, { useState } from 'react';
import { Icons } from '../common/Icons';

interface AIAssistantPanelProps {
  currentFilePath: string;
  testRun: any;
  predictions: any[];
  currentUserRole?: string;
  onApplyFix: (filePath: string, proposedCode: string) => void;
  onRequestAnalysis: () => Promise<any>;
  onOpenReviewModal?: (fixData: {
    targetFile: string;
    description: string;
    proposedCode: string;
    diff: string;
  }) => void;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  currentFilePath,
  testRun,
  predictions,
  currentUserRole = 'Developer',
  onApplyFix,
  onRequestAnalysis,
  onOpenReviewModal
}) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAskAI = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await onRequestAnalysis();
      setAnalysis(res.analysis);
    } catch (err: any) {
      setErrorMsg(err.message || 'AI Contextual Diagnosis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewFix = (fixSuggestion: any) => {
    if (onOpenReviewModal) {
      onOpenReviewModal(fixSuggestion);
    } else {
      onApplyFix(fixSuggestion.targetFile, fixSuggestion.proposedCode);
    }
  };

  const highRiskPredictions = predictions.filter((p) => p.riskLevel === 'HIGH');
  const hasFailedTests = testRun && testRun.status === 'failed';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
      {/* Top Header Card */}
      <div style={{
        padding: '12px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '6px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc'
            }}>
              <Icons.Sparkles size={16} color="#c084fc" />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '13px' }}>
                Contextual Engineering Copilot
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Multi-Modal AST, ML & Traceability Reasoner
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleAskAI}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              border: 'none',
              padding: '6px 12px',
              gap: '6px'
            }}
          >
            <Icons.Sparkles size={13} color="#fff" />
            <span>{loading ? 'Synthesizing...' : 'Run Contextual Diagnosis'}</span>
          </button>
        </div>

        {/* AI Context Provenance Checklist */}
        <div style={{
          backgroundColor: '#090d16',
          borderRadius: '4px',
          padding: '8px 10px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          marginTop: '2px'
        }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Live Context Provenance Fed to Model:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', fontSize: '11px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-low)' }}>
              <Icons.Check size={12} color="var(--color-low)" />
              <span style={{ color: 'var(--text-main)' }}>Active Source: <code style={{ fontFamily: 'var(--font-mono)' }}>{currentFilePath.split('/').pop() || 'None'}</code></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-low)' }}>
              <Icons.Check size={12} color="var(--color-low)" />
              <span style={{ color: 'var(--text-main)' }}>TypeScript AST Graph</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: highRiskPredictions.length > 0 ? 'var(--color-high)' : 'var(--color-low)' }}>
              <Icons.Check size={12} color={highRiskPredictions.length > 0 ? 'var(--color-high)' : 'var(--color-low)'} />
              <span style={{ color: 'var(--text-main)' }}>ML Risk ({predictions.length} candidate artifacts)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: hasFailedTests ? 'var(--color-high)' : 'var(--color-low)' }}>
              <Icons.Check size={12} color={hasFailedTests ? 'var(--color-high)' : 'var(--color-low)'} />
              <span style={{ color: 'var(--text-main)' }}>Test Traces ({hasFailedTests ? 'Failures Active' : 'Clean'})</span>
            </div>
          </div>
        </div>

        {/* Quick Action Prompt Chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
          <button
            className="btn btn-sm"
            onClick={handleAskAI}
            style={{ fontSize: '10px', padding: '3px 8px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
          >
            Diagnose Test Failures
          </button>
          <button
            className="btn btn-sm"
            onClick={handleAskAI}
            style={{ fontSize: '10px', padding: '3px 8px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
          >
            Explain High Risk Impact
          </button>
          <button
            className="btn btn-sm"
            onClick={handleAskAI}
            style={{ fontSize: '10px', padding: '3px 8px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
          >
            Generate Safe Interface Fix
          </button>
        </div>
      </div>

      {/* Error Callout */}
      {errorMsg && (
        <div style={{
          padding: '10px 12px',
          backgroundColor: 'var(--color-high-bg)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--color-high)'
        }}>
          <Icons.TriangleAlert size={16} color="var(--color-high)" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Analysis Output */}
      {analysis ? (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: '13px', color: '#c084fc' }}>
              Diagnosis & Impact Guidance
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Provider: {analysis.provider || 'CodeSync Ensemble Engine'}
            </span>
          </div>

          {/* Root Cause */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-high)', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Icons.TriangleAlert size={12} color="var(--color-high)" />
              Root Cause Identification:
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-main)', lineHeight: 1.5 }}>
              {analysis.rootCause}
            </p>
          </div>

          {/* Dependency & ML Impact Breakdown */}
          <div style={{ backgroundColor: '#090d16', padding: '10px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Icons.Network size={12} color="var(--accent-blue)" />
              Dependency & ML Impact Breakdown:
            </div>
            <div style={{ fontSize: '12px', whiteSpace: 'pre-line', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {analysis.impactAnalysis}
            </div>
          </div>

          {/* Fix Suggestion & Patch Action */}
          {analysis.fixSuggestion && (
            <div style={{
              marginTop: '4px',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icons.Sparkles size={14} color="var(--color-low)" />
                  <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--color-low)' }}>
                    Proposed Verified Fix: <code style={{ fontFamily: 'var(--font-mono)' }}>{analysis.fixSuggestion.targetFile}</code>
                  </span>
                </div>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleReviewFix(analysis.fixSuggestion)}
                  style={{
                    backgroundColor: '#10b981',
                    gap: '4px'
                  }}
                >
                  <Icons.Check size={12} color="#fff" />
                  <span>Review & Apply Patch</span>
                </button>
              </div>

              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {analysis.fixSuggestion.description}
              </p>

              {/* Code Diff Preview */}
              <div style={{
                backgroundColor: '#090d16',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '10px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                whiteSpace: 'pre-wrap',
                maxHeight: '160px',
                overflowY: 'auto'
              }}>
                {analysis.fixSuggestion.diff}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '36px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            <Icons.Sparkles size={20} color="#a855f7" />
          </div>
          <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)', marginBottom: '4px' }}>
            Contextual Diagnosis Ready
          </p>
          <p style={{ fontSize: '12px', maxWidth: '300px', lineHeight: 1.5 }}>
            Click "Run Contextual Diagnosis" above or choose a prompt to analyze current test failures, investigate ML risk predictions, or generate a safe code fix.
          </p>
        </div>
      )}
    </div>
  );
};
