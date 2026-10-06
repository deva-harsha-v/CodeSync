import React, { useState } from 'react';
import { Icons } from '../common/Icons';

interface GitCommitItem {
  id: string;
  commit_hash: string;
  message: string;
  author_name: string;
  author_email: string;
  branch: string;
  created_at: string;
}

interface GitPanelProps {
  commits: GitCommitItem[];
  onCreateCommit: (message: string) => Promise<void>;
  onRefresh: () => void;
  activeFilePath?: string;
}

export const GitPanel: React.FC<GitPanelProps> = ({
  commits,
  onCreateCommit,
  onRefresh,
  activeFilePath = 'backend/authService.ts'
}) => {
  const [commitMsg, setCommitMsg] = useState('');
  const [committing, setCommitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<GitCommitItem | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMsg.trim()) return;
    setCommitting(true);
    setErrorMsg(null);
    try {
      await onCreateCommit(commitMsg.trim());
      setCommitMsg('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record Git commit.');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px', padding: '10px 14px', fontSize: '12px' }}>
      {/* 1. Header & Branch Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '8px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.GitBranch size={16} color="#a855f7" />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '12px' }}>
              Source Control (Git)
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              branch: <code>main</code> • <span style={{ color: 'var(--color-low)' }}>✓ Up to date</span>
            </div>
          </div>
        </div>
        <button className="btn btn-sm" onClick={onRefresh} style={{ padding: '2px 8px', fontSize: '11px', gap: '4px' }}>
          <Icons.RefreshCw size={11} color="var(--text-muted)" />
          <span>Sync</span>
        </button>
      </div>

      {/* 2. Working Tree Changes (Staged / Unstaged) */}
      <div style={{
        backgroundColor: '#070a13',
        borderRadius: '6px',
        border: '1px solid var(--border-color)',
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          <span>Working Tree Changes (Staged)</span>
          <span style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>M 1 file</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px', backgroundColor: 'var(--bg-surface)', borderRadius: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <span style={{ color: 'var(--color-low)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>M</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeFilePath}
            </span>
          </div>
          <span style={{ color: 'var(--color-low)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
            +14 / -6
          </span>
        </div>
      </div>

      {/* 3. Commit Input Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Commit message (e.g. fix(auth): restore compliant token contract)..."
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
          style={{ padding: '7px 10px', fontSize: '12px' }}
          required
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={committing || !commitMsg.trim()}
            style={{ backgroundColor: '#a855f7', gap: '5px', padding: '5px 12px' }}
          >
            <Icons.GitCommit size={13} color="#fff" />
            <span>{committing ? 'Recording...' : 'Commit & Push'}</span>
          </button>
        </div>
      </form>

      {errorMsg && (
        <div style={{
          padding: '8px 10px',
          backgroundColor: 'var(--color-high-bg)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '4px',
          color: 'var(--color-high)',
          fontSize: '11px'
        }}>
          {errorMsg}
        </div>
      )}

      {/* 4. Commits History Stream */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>
          Verified Commit Log ({commits.length}):
        </div>

        {commits.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '11px', padding: '16px 0', textAlign: 'center' }}>
            No commits recorded in current session.
          </div>
        ) : (
          commits.map((c) => {
            const isExpanded = selectedCommit?.id === c.id;
            return (
              <div
                key={c.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedCommit(isExpanded ? null : c)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--accent-blue)',
                    fontSize: '11px',
                    backgroundColor: '#070a13',
                    padding: '1px 6px',
                    borderRadius: '4px'
                  }}>
                    {c.commit_hash.slice(0, 8)}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-main)' }}>
                  {c.message}
                </div>

                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Author: <strong style={{ color: 'var(--text-main)' }}>{c.author_name}</strong>
                </div>

                {isExpanded && (
                  <div style={{
                    marginTop: '4px',
                    paddingTop: '6px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '10px',
                    color: 'var(--text-dim)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    Full Hash: {c.commit_hash}<br />
                    Author Email: {c.author_email}<br />
                    Branch: {c.branch}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
