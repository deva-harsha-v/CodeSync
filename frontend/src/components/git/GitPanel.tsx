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
}

export const GitPanel: React.FC<GitPanelProps> = ({ commits, onCreateCommit, onRefresh }) => {
  const [commitMsg, setCommitMsg] = useState('');
  const [committing, setCommitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      {/* Header */}
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
              Git Version Control
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              branch: <code>main</code> • remote: GitHub
            </div>
          </div>
        </div>
        <button className="btn btn-sm" onClick={onRefresh} style={{ padding: '2px 8px', fontSize: '11px', gap: '4px' }}>
          <Icons.Activity size={12} color="var(--text-muted)" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Commit Input Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Commit message (e.g. fix(auth): restore compliant token contract)..."
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
          style={{ padding: '6px 10px', fontSize: '12px' }}
          required
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={committing || !commitMsg.trim()}
            style={{ backgroundColor: '#a855f7', gap: '4px' }}
          >
            <Icons.GitCommit size={13} color="#fff" />
            <span>{committing ? 'Recording Commit...' : 'Commit & Sync'}</span>
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

      {/* Commits History List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Commit History ({commits.length}):
        </div>
        {commits.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '11px', padding: '16px 0', textAlign: 'center' }}>
            No commits recorded in current session.
          </div>
        ) : (
          commits.map((c) => (
            <div
              key={c.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  color: 'var(--accent-blue)',
                  fontSize: '11px',
                  backgroundColor: '#090d16',
                  padding: '1px 5px',
                  borderRadius: '4px'
                }}>
                  {c.commit_hash.slice(0, 8)}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(c.created_at).toLocaleTimeString()}
                </span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-main)' }}>
                {c.message}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {c.author_name} &lt;{c.author_email}&gt;
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
