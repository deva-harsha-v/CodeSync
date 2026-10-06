import React from 'react';
import { TestExecutionResult } from '../../types';
import { Icons } from '../common/Icons';

interface TestResultPanelProps {
  testRun: TestExecutionResult | null;
  onRerun: () => void;
  onDiagnoseWithAI?: () => void;
}

export const TestResultPanel: React.FC<TestResultPanelProps> = ({
  testRun,
  onRerun,
  onDiagnoseWithAI
}) => {
  if (!testRun) {
    return (
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
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '10px'
        }}>
          <Icons.Flask size={20} color="var(--accent-blue)" />
        </div>
        <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)', marginBottom: '4px' }}>
          No Test Executions Recorded
        </p>
        <p style={{ fontSize: '12px', maxWidth: '300px', lineHeight: 1.5, marginBottom: '14px' }}>
          Save changes in the editor or run the automated test suite to verify regression safety.
        </p>
        <button className="btn btn-primary btn-sm" onClick={onRerun}>
          <Icons.Play size={12} color="#fff" />
          <span>Execute Test Suite</span>
        </button>
      </div>
    );
  }

  const isFailed = testRun.status === 'failed';
  const passRate = testRun.totalTests > 0
    ? Math.round((testRun.passedTests / testRun.totalTests) * 100)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
      {/* CI-Style Summary Header */}
      <div style={{
        padding: '12px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '6px',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${isFailed ? 'var(--color-high)' : 'var(--color-low)'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: 700,
              fontSize: '12px',
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: isFailed ? 'var(--color-high-bg)' : 'var(--color-low-bg)',
              color: isFailed ? 'var(--color-high)' : 'var(--color-low)',
              border: `1px solid ${isFailed ? 'var(--color-high)' : 'var(--color-low)'}44`
            }}>
              {isFailed ? <Icons.X size={12} color="var(--color-high)" /> : <Icons.Check size={12} color="var(--color-low)" />}
              {isFailed ? 'SUITE FAILED' : 'ALL TESTS PASSED'}
            </span>

            <span style={{ color: 'var(--text-main)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              Run #{testRun.testRunId ? testRun.testRunId.slice(-6) : 'LATEST'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {testRun.passedTests} passed • {testRun.failedTests} failed • {testRun.durationMs}ms
            </span>
            <button className="btn btn-sm" onClick={onRerun} style={{ gap: '4px' }}>
              <Icons.Activity size={12} color="var(--text-muted)" />
              <span>Re-run Suite</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ height: '4px', backgroundColor: '#090d16', borderRadius: '2px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${passRate}%`,
              backgroundColor: isFailed ? 'var(--color-high)' : 'var(--color-low)',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* Individual Test Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {testRun.results && testRun.results.map((res: any, index: number) => {
          const pass = res.status === 'passed';
          return (
            <div
              key={index}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${pass ? 'var(--color-low)' : 'var(--color-high)'}`,
                borderRadius: '6px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {pass ? (
                    <Icons.Check size={14} color="var(--color-low)" />
                  ) : (
                    <Icons.X size={14} color="var(--color-high)" />
                  )}
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '12px', color: 'var(--text-main)' }}>
                    {res.testName}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {res.filePath && (
                    <span style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)',
                      backgroundColor: '#090d16',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {res.filePath.split('/').pop()}
                    </span>
                  )}
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {res.durationMs}ms
                  </span>
                </div>
              </div>

              {/* Error & Stack Trace Callout */}
              {res.errorMessage && (
                <div style={{
                  backgroundColor: '#090d16',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ color: 'var(--color-high)', fontWeight: 600, fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                    {res.errorMessage}
                  </div>
                  {res.stackTrace && (
                    <pre style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '100px',
                      overflowY: 'auto'
                    }}>
                      {res.stackTrace}
                    </pre>
                  )}

                  {/* AI Bridge Diagnosis Button */}
                  {onDiagnoseWithAI && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={onDiagnoseWithAI}
                        style={{
                          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                          border: 'none',
                          padding: '3px 8px',
                          fontSize: '10px',
                          gap: '4px'
                        }}
                      >
                        <Icons.Sparkles size={11} color="#fff" />
                        <span>Diagnose Failure with AI</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
