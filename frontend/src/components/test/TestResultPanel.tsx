import React from 'react';
import { TestExecutionResult } from '../../types';

interface TestResultPanelProps {
  testRun: TestExecutionResult | null;
  onRerun: () => void;
}

export const TestResultPanel: React.FC<TestResultPanelProps> = ({ testRun, onRerun }) => {
  if (!testRun) {
    return (
      <div style={{ color: 'var(--text-muted)', padding: '16px', fontSize: '12px' }}>
        No test runs recorded for this session. Save a file or click "Run Relevant Tests" to execute tests.
      </div>
    );
  }

  const isFailed = testRun.status === 'failed';

  return (
    <div>
      <div className="test-summary-bar">
        <div>
          <strong style={{ fontSize: '14px' }}>
            Run #{testRun.testRunId.slice(-4)}:
          </strong>{' '}
          <span style={{ color: isFailed ? 'var(--color-high)' : 'var(--color-low)', fontWeight: 600 }}>
            {isFailed ? '✗ FAILED' : '✓ ALL TESTS PASSED'}
          </span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {testRun.passedTests} passed • {testRun.failedTests} failed • {testRun.durationMs}ms duration
        </div>
        <button className="btn btn-sm" onClick={onRerun} style={{ marginLeft: 'auto' }}>
          ↻ Re-run Test Suite
        </button>
      </div>

      <div>
        {testRun.results.map((res: any, index: number) => {
          const pass = res.status === 'passed';
          return (
            <div key={index} className={`test-card ${pass ? 'test-passed' : 'test-failed'}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '12px' }}>
                  {pass ? '✓' : '✗'} {res.testName}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{res.durationMs}ms</span>
              </div>

              {res.errorMessage && (
                <div className="test-error-box">
                  <strong>{res.errorMessage}</strong>
                  {res.stackTrace && <pre style={{ marginTop: '4px', fontSize: '10px' }}>{res.stackTrace}</pre>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
