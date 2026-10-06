import React, { useState } from 'react';

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
}

export const GitPanel: React.FC<GitPanelProps> = ({ commits, onCreateCommit, onRefresh }) => {
  const [commitMsg, setCommitMsg] = useState('');
  const [committing, setCommitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMsg.trim()) return;
    setCommitting(true);
    try {
      await onCreateCommit(commitMsg);
      setCommitMsg('');
    } catch (err: any) {
      alert(`Commit error: ${err.message}`);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <strong style={{ color: '#a855f7' }}>🐙 Git & GitHub Synchronization</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
            Branch: <code>main</code> • Remote: <code>https://github.com/deva-harsha-v/CodeSync.git</code>
          </span>
        </div>
        <button className="btn btn-sm" onClick={onRefresh}>
          ↻ Refresh History
        </button>
      </div>

      {/* Commit Creation Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Commit message (e.g. fix(auth): restore compliant token contract)..."
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
          style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
          required
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={committing}>
          {committing ? 'Recording...' : '✓ Record Commit'}
        </button>
      </form>

      {/* Commit History List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {commits.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '16px' }}>
            No commits recorded yet. Create a commit to record verified changes in the Git history.
          </div>
        ) : (
          commits.map((c) => (
            <div
              key={c.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-blue)', fontSize: '12px' }}>
                  {c.commit_hash.slice(0, 10)}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  {new Date(c.created_at).toLocaleString()}
                </span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 500 }}>
                {c.message}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Author: <strong>{c.author_name}</strong> &lt;{c.author_email}&gt; • Branch: <code>{c.branch}</code>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
