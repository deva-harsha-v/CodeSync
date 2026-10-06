import React from 'react';
import { ProjectFile, UserProfile, MLPrediction, DocumentItem } from '../../types';
import {
  IconCode,
  IconUser,
  IconTriangleAlert,
  IconFlask,
  IconClipboardList,
  IconGitBranch,
  IconArrowUpRight,
  IconCheck,
  IconSparkles
} from '../common/Icons';

interface ProjectOverviewProps {
  files: ProjectFile[];
  users: UserProfile[];
  predictions: MLPrediction[];
  documents: DocumentItem[];
  testRun: any;
  onOpenWorkspace: () => void;
  onSelectFile: (file: ProjectFile) => void;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  files,
  users,
  predictions,
  documents,
  testRun,
  onOpenWorkspace,
  onSelectFile
}) => {
  const highRiskCount = predictions.filter((p) => p.riskLevel === 'HIGH').length;
  const verifiedDocsCount = documents.filter((d) => d.status === 'Verified').length;

  return (
    <div className="overview-container">
      {/* Overview Header */}
      <div className="overview-header">
        <div>
          <div className="overview-breadcrumb">
            <span className="project-badge">Smart Canteen</span>
            <span className="separator">/</span>
            <span className="branch-badge">
              <IconGitBranch size={13} /> main
            </span>
          </div>
          <h1 className="overview-title">Smart Canteen Collaborative Project Overview</h1>
          <p className="overview-subtitle">
            Role-, artifact-, and dependency-aware collaborative development environment with AST-guided change analysis.
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={onOpenWorkspace}>
          Open Collaborative Workspace <IconArrowUpRight size={16} />
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="overview-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrap icon-primary">
            <IconCode size={20} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{files.length}</div>
            <div className="metric-label">Managed Source Artifacts</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap icon-info">
            <IconUser size={20} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{users.length}</div>
            <div className="metric-label">Active Team Personas</div>
          </div>
        </div>

        <div className="metric-card">
          <div className={`metric-icon-wrap ${highRiskCount > 0 ? 'icon-danger' : 'icon-success'}`}>
            <IconTriangleAlert size={20} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{highRiskCount}</div>
            <div className="metric-label">High-Risk Impacted Artifacts</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap icon-success">
            <IconClipboardList size={20} />
          </div>
          <div className="metric-content">
            <div className="metric-value">
              {verifiedDocsCount} / {documents.length}
            </div>
            <div className="metric-label">Requirements Verified</div>
          </div>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="overview-sections-grid">
        {/* Left Column: Recent Change Impact & Test Health */}
        <div className="overview-col">
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title-wrap">
                <IconTriangleAlert size={16} color="var(--color-warning)" />
                <h3 className="panel-title">Recent Change Impact Predictions</h3>
              </div>
              <span className="badge badge-info">Random Forest Inference</span>
            </div>
            <div className="panel-body">
              {predictions.length === 0 ? (
                <div className="empty-state-sm">
                  <p>No active change event. Save a source file in the workspace to trigger AST traversal and ML risk scoring.</p>
                </div>
              ) : (
                <div className="impact-overview-list">
                  {predictions.slice(0, 4).map((p, idx) => (
                    <div key={idx} className={`impact-overview-card risk-${p.riskLevel.toLowerCase()}`}>
                      <div className="impact-card-top">
                        <span className="impact-file-name">{p.targetFile}</span>
                        <span className={`risk-badge risk-${p.riskLevel.toLowerCase()}`}>
                          {Math.round(p.impactProbability * 100)}% {p.riskLevel}
                        </span>
                      </div>
                      <p className="impact-card-factor">
                        {p.explanationFactors && p.explanationFactors[0] ? p.explanationFactors[0] : 'Downstream AST closure dependency'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="panel" style={{ marginTop: '16px' }}>
            <div className="panel-header">
              <div className="panel-title-wrap">
                <IconFlask size={16} color="var(--color-primary)" />
                <h3 className="panel-title">Dependency-Guided Test Health</h3>
              </div>
              {testRun && (
                <span className={`badge ${testRun.status === 'passed' ? 'badge-success' : 'badge-danger'}`}>
                  {testRun.status.toUpperCase()}
                </span>
              )}
            </div>
            <div className="panel-body">
              {testRun ? (
                <div className="test-overview-summary">
                  <div className="test-stat-row">
                    <span>Passed Assertions:</span>
                    <strong className="text-success">{testRun.passedTests}</strong>
                  </div>
                  <div className="test-stat-row">
                    <span>Failed Assertions:</span>
                    <strong className={testRun.failedTests > 0 ? 'text-danger' : 'text-muted'}>
                      {testRun.failedTests}
                    </strong>
                  </div>
                  <div className="test-stat-row">
                    <span>Total Relevant Tests:</span>
                    <strong>{testRun.totalTests}</strong>
                  </div>
                </div>
              ) : (
                <div className="empty-state-sm">
                  <p>Tests run automatically when files with dependent test suites are modified.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Key Source Files & Requirements Matrix */}
        <div className="overview-col">
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title-wrap">
                <IconCode size={16} color="var(--color-primary)" />
                <h3 className="panel-title">Project Source Modules</h3>
              </div>
              <span className="badge">{files.length} Files</span>
            </div>
            <div className="panel-body">
              <div className="source-modules-list">
                {files.slice(0, 6).map((f) => (
                  <div
                    key={f.id}
                    className="source-module-item"
                    onClick={() => {
                      onSelectFile(f);
                      onOpenWorkspace();
                    }}
                  >
                    <div className="source-item-info">
                      <span className="source-item-path">{f.path}</span>
                      <span className="source-item-owner">Owner: {f.owner_name || 'System'}</span>
                    </div>
                    <span className="btn-link">Open in Editor ?</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="panel" style={{ marginTop: '16px' }}>
            <div className="panel-header">
              <div className="panel-title-wrap">
                <IconClipboardList size={16} color="var(--color-success)" />
                <h3 className="panel-title">Requirements Traceability Matrix</h3>
              </div>
              <span className="badge badge-success">{verifiedDocsCount} Verified</span>
            </div>
            <div className="panel-body">
              <div className="trace-overview-table">
                {documents.slice(0, 4).map((d) => {
                  const status = d.status || (d.verified ? 'Verified' : 'Draft');
                  return (
                    <div key={d.id} className="trace-overview-row">
                      <span className="trace-row-title">{d.title}</span>
                      <span className={`status-pill pill-${status.toLowerCase()}`}>
                        <IconCheck size={11} /> {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
