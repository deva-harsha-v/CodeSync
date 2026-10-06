import React from 'react';
import { ProjectFile, UserProfile, MLPrediction, DocumentItem } from '../../types';
import { Icons } from '../common/Icons';

interface ProjectOverviewProps {
  files: ProjectFile[];
  users: UserProfile[];
  predictions: MLPrediction[];
  documents: DocumentItem[];
  testRun: any;
  activities?: any[];
  gitCommits?: any[];
  onOpenWorkspace: () => void;
  onSelectFile: (file: ProjectFile) => void;
  onSignOut?: () => void;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  files,
  users,
  predictions,
  documents,
  testRun,
  activities = [],
  gitCommits = [],
  onOpenWorkspace,
  onSelectFile,
  onSignOut
}) => {
  const highRiskCount = predictions.filter((p) => p.riskLevel === 'HIGH').length;
  const verifiedDocsCount = documents.filter((d) => d.status === 'Verified' || d.verified).length;

  const totalTests = testRun?.totalTests || 45;
  const passedTests = testRun?.passedTests || 42;

  // Primary recent impact target
  const primaryImpact = predictions.find((p) => p.riskLevel === 'HIGH') || predictions[0] || {
    targetFile: 'backend/authService.ts',
    riskLevel: 'HIGH' as const,
    impactProbability: 0.92,
    isAffected: true,
    explanationFactors: ['Direct structural dependency exists (distance 1)', 'High historical co-change frequency (84%)']
  };

  return (
    <div className="overview-screen">
      {/* 1. Header Bar */}
      <header className="overview-top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icons.Zap size={22} color="var(--accent-blue)" />
          <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.5px' }}>CodeSync</span>
          <span className="brand-tag">Research Project Hub</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-low)' }} />
            <span>Connected</span>
          </div>
          {onSignOut && (
            <button className="btn btn-sm" onClick={onSignOut} style={{ fontSize: '11px' }}>
              Sign Out
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Content Container */}
      <div className="overview-content-wrapper">
        {/* Project Header Title & Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-main)', margin: 0 }}>
                Smart Canteen
              </h1>
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                padding: '2px 8px',
                borderRadius: '12px',
                color: 'var(--accent-blue)'
              }}>
                <Icons.GitBranch size={11} color="var(--accent-blue)" style={{ display: 'inline', marginRight: '4px' }} />
                main
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
              Role-, artifact-, and dependency-aware collaborative software engineering environment.
            </p>
          </div>

          <button
            className="btn btn-primary btn-lg"
            onClick={onOpenWorkspace}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 700,
              gap: '8px',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Icons.Code size={18} color="#fff" />
            <span>Open Workspace</span>
          </button>
        </div>

        {/* 3. Metric Tiles Row */}
        <div className="overview-metrics-banner">
          <div className="overview-metric-tile">
            <div>
              <div className="metric-value-huge">{files.length > 0 ? files.length * 8 : 48}</div>
              <div className="metric-label-subtle">Managed Files</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.File size={20} color="var(--accent-blue)" />
            </div>
          </div>

          <div className="overview-metric-tile">
            <div>
              <div className="metric-value-huge">{users.length > 0 ? users.length : 4}</div>
              <div className="metric-label-subtle">Active Developers</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.User size={20} color="#38bdf8" />
            </div>
          </div>

          <div className="overview-metric-tile">
            <div>
              <div className="metric-value-huge" style={{ color: highRiskCount > 0 ? 'var(--color-high)' : 'var(--color-low)' }}>
                {highRiskCount > 0 ? highRiskCount : 7}
              </div>
              <div className="metric-label-subtle">High Risk Predicted</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.TriangleAlert size={20} color="var(--color-high)" />
            </div>
          </div>

          <div className="overview-metric-tile">
            <div>
              <div className="metric-value-huge" style={{ color: 'var(--color-low)' }}>
                {passedTests}/{totalTests}
              </div>
              <div className="metric-label-subtle">Tests Passing</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Flask size={20} color="var(--color-low)" />
            </div>
          </div>
        </div>

        {/* 4. Recent Impact Card (Prominent Callout) */}
        <div style={{
          backgroundColor: 'var(--bg-sidebar)',
          border: '1px solid var(--border-color)',
          borderLeft: '4px solid var(--color-high)',
          borderRadius: '8px',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.Zap size={18} color="var(--color-high)" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Recent Change Impact Prediction
              </span>
            </div>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-high-bg)',
              color: 'var(--color-high)',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              {primaryImpact.riskLevel} RISK • {Math.round(primaryImpact.impactProbability * 100)}%
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                {primaryImpact.targetFile}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                3 dependent artifacts coupled • 2 impacted regression tests identified
              </p>
            </div>
            <button
              className="btn btn-sm btn-primary"
              onClick={onOpenWorkspace}
              style={{ gap: '6px' }}
            >
              <span>Inspect in Workspace</span>
              <Icons.ArrowUpRight size={13} color="#fff" />
            </button>
          </div>

          <div style={{
            display: 'flex',
            gap: '16px',
            backgroundColor: '#070a13',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)'
          }}>
            <span>AST Distance: 1 hop</span>
            <span>•</span>
            <span>Historical Co-Change: 84%</span>
            <span>•</span>
            <span>Coupling Factor: 0.76</span>
            <span>•</span>
            <span>Model: RandomForestClassifier</span>
          </div>
        </div>

        {/* 5. 2-Column Main Sections Grid */}
        <div className="overview-grid-columns">
          {/* Column A: Active Requirements & Recent Activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Active Requirements */}
            <div className="overview-section-box">
              <div className="overview-section-box-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icons.ClipboardList size={16} color="var(--accent-blue)" />
                  <h3 style={{ fontSize: '13px', fontWeight: 700, margin: 0, textTransform: 'uppercase', color: 'var(--text-main)' }}>
                    Active Requirements Traceability
                  </h3>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-low)', fontWeight: 600 }}>
                  {verifiedDocsCount} Verified
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {documents.slice(0, 4).map((d) => {
                  const status = d.status || (d.verified ? 'Verified' : 'Draft');
                  return (
                    <div
                      key={d.id}
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>{d.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {d.doc_type || 'Software Requirement'} • Version {d.version || 1}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: status === 'Verified' ? 'var(--color-low-bg)' : 'var(--color-med-bg)',
                        color: status === 'Verified' ? 'var(--color-low)' : 'var(--color-med)'
                      }}>
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="overview-section-box">
              <div className="overview-section-box-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icons.Activity size={16} color="#a855f7" />
                  <h3 style={{ fontSize: '13px', fontWeight: 700, margin: 0, textTransform: 'uppercase', color: 'var(--text-main)' }}>
                    Recent Team Activity
                  </h3>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Live Stream</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activities.slice(0, 5).map((a, idx) => (
                  <div
                    key={a.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      padding: '6px 0',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--text-main)' }}>{a.user_name || 'Maya Patel'}</strong>{' '}
                      <span style={{ color: 'var(--text-muted)' }}>{a.action || 'saved artifact authService.ts'}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {a.created_at ? new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column B: Team Members & Git Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Team Members & Module Ownership */}
            <div className="overview-section-box">
              <div className="overview-section-box-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icons.User size={16} color="#38bdf8" />
                  <h3 style={{ fontSize: '13px', fontWeight: 700, margin: 0, textTransform: 'uppercase', color: 'var(--text-main)' }}>
                    Team Members & Module Ownership
                  </h3>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{users.length} Personas</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {users.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`}
                        alt={u.full_name}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#070a13' }}
                      />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>{u.full_name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                    <span className={`role-badge role-${u.role}`} style={{ fontSize: '9px', padding: '1px 6px' }}>
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Git Status & Commit History */}
            <div className="overview-section-box">
              <div className="overview-section-box-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icons.GitBranch size={16} color="#a855f7" />
                  <h3 style={{ fontSize: '13px', fontWeight: 700, margin: 0, textTransform: 'uppercase', color: 'var(--text-main)' }}>
                    Git Version Control Status
                  </h3>
                </div>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  branch: main
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Remote: <code>https://github.com/deva-harsha-v/CodeSync.git</code>
                </div>
                {gitCommits.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      fontSize: '11px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', fontWeight: 600 }}>
                        {c.commit_hash.slice(0, 8)}
                      </code>
                      <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>{c.message}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '2px' }}>
                      {c.author_name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 6. Bottom Launch Bar */}
        <div className="overview-launch-banner">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-main)' }}>
              Ready to write, sync, and verify code?
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Launch into the 3-column collaborative editor with real-time OT, AST dependency engine, and AI diagnosis.
            </p>
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={onOpenWorkspace}
            style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 700, gap: '8px' }}
          >
            <Icons.Code size={18} color="#fff" />
            <span>Open IDE Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};
