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
          Save changes in the editor or execute the automated test runner to verify regression safety.
        </p>
        <button className="btn btn-primary btn-sm" onClick={onRerun} style={{ gap: '6px' }}>
          <Icons.Play size={12} color="#fff" />
          <span>Execute Test Suite</span>
        </button>
      </div>
    );
  }

  const isFailed = testRun.status === 'failed';
  const passedCount = testRun.passedTests;
  const failedCount = testRun.failedTests;
  const skippedCount = 0;

  // Group results by file
  const resultsByFile = new Map<string, any[]>();
  (testRun.results || []).forEach((r) => {
    const file = r.filePath ? r.filePath.split('/').pop() || r.filePath : 'suite.test.ts';
    if (!resultsByFile.has(file)) resultsByFile.set(file, []);
    resultsByFile.get(file)!.push(r);
  });

  const failedResult = testRun.results?.find((r) => r.status === 'failed');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
      {/* CI Summary Bar */}
      <div style={{
        padding: '10px 14px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '6px',
        border: '1px solid var(--border-color)',
        borderLeft: `4px solid ${isFailed ? 'var(--color-high)' : 'var(--color-low)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-main)' }}>
            TEST RESULTS
          </span>
          <div style={{ display: 'flex', gap: '10px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--color-low)', fontWeight: 600 }}>{passedCount} passed</span>
            {failedCount > 0 && <span style={{ color: 'var(--color-high)', fontWeight: 600 }}>{failedCount} failed</span>}
            <span style={{ color: 'var(--text-dim)' }}>{skippedCount} skipped</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            {testRun.durationMs}ms
          </span>
          <button className="btn btn-sm" onClick={onRerun} style={{ gap: '4px', padding: '2px 8px' }}>
            <Icons.RefreshCw size={11} color="var(--text-muted)" />
            <span>Re-run Suite</span>
          </button>
        </div>
      </div>

      {/* Test Suites File Breakdown */}
      <div style={{
        backgroundColor: '#070a13',
        borderRadius: '6px',
        border: '1px solid var(--border-color)',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        {Array.from(resultsByFile.entries()).map(([fileName, tests]) => {
          const hasFail = tests.some((t) => t.status === 'failed');
          const passInFile = tests.filter((t) => t.status === 'passed').length;
          const totalInFile = tests.length;

          return (
            <div
              key={fileName}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {hasFail ? (
                  <Icons.X size={14} color="var(--color-high)" />
                ) : (
                  <Icons.Check size={14} color="var(--color-low)" />
                )}
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '12px', color: hasFail ? 'var(--color-high)' : 'var(--text-main)' }}>
                  {fileName}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: hasFail ? 'var(--color-high)' : 'var(--color-low)', fontWeight: 600 }}>
                  {passInFile}/{totalInFile}
                </span>
                <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>
                  {tests.reduce((acc, t) => acc + (t.durationMs || 0), 0)}ms
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Failure Callout & Actions */}
      {failedResult && (
        <div style={{
          backgroundColor: '#070a13',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderLeft: '4px solid var(--color-high)',
          borderRadius: '6px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '11px', color: 'var(--color-high)', textTransform: 'uppercase' }}>
              AssertionError in {failedResult.testName}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              exit 1
            </span>
          </div>

          <pre style={{
            fontSize: '11px',
            color: '#f87171',
            fontFamily: 'var(--font-mono)',
            whiteSpace: 'pre-wrap',
            margin: 0,
            lineHeight: 1.4
          }}>
            {failedResult.errorMessage}
          </pre>

          {failedResult.stackTrace && (
            <pre style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'pre-wrap',
              maxHeight: '90px',
              overflowY: 'auto',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              padding: '6px',
              borderRadius: '4px',
              margin: '2px 0 0 0'
            }}>
              {failedResult.stackTrace}
            </pre>
          )}

          {/* Action Bridges */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', justifyContent: 'flex-end' }}>
            <button className="btn btn-sm" onClick={onRerun} style={{ fontSize: '11px', padding: '3px 10px' }}>
              Re-run Failed
            </button>
            {onDiagnoseWithAI && (
              <button
                className="btn btn-sm btn-primary"
                onClick={onDiagnoseWithAI}
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  border: 'none',
                  fontSize: '11px',
                  padding: '3px 12px',
                  gap: '4px'
                }}
              >
                <Icons.Sparkles size={12} color="#fff" />
                <span>Explain with AI</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
