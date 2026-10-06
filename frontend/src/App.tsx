import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { FileExplorer } from './components/explorer/FileExplorer';
import { CollaborativeEditor } from './components/editor/CollaborativeEditor';
import { DependencyGraphVisualizer } from './components/graph/DependencyGraphVisualizer';
import { ChangeImpactPanel } from './components/impact/ChangeImpactPanel';
import { TestResultPanel } from './components/test/TestResultPanel';
import { AIAssistantPanel } from './components/ai/AIAssistantPanel';
import { TraceabilityViewer } from './components/docs/TraceabilityViewer';
import { AuditLogViewer } from './components/audit/AuditLogViewer';
import { ActivityFeed } from './components/activity/ActivityFeed';
import { GitPanel } from './components/git/GitPanel';
import { AccessRequestModal } from './components/requests/AccessRequestModal';
import { LandingPage } from './components/landing/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { ApiClient } from './services/api';
import {
  UserProfile,
  ProjectFile,
  DependencyGraphData,
  MLPrediction,
  DocumentItem,
  DocumentLink,
  AuditLogItem
} from './types';

type Route = 'landing' | 'login' | 'workspace';

export const App: React.FC = () => {
  const projectId = 'proj_smart_canteen';

  // Routing
  const getInitialRoute = (): Route => {
    const p = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (p === '/login' || hash.includes('login')) return 'login';
    if (p === '/workspace' || hash.includes('workspace')) return 'workspace';
    return 'landing';
  };

  const [route, setRoute] = useState<Route>(getInitialRoute());

  const navigate = (newRoute: Route) => {
    const path = newRoute === 'landing' ? '/' : `/${newRoute}`;
    window.history.pushState({}, '', path);
    setRoute(newRoute);
  };

  useEffect(() => {
    const handlePopState = () => {
      setRoute(getInitialRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'files' | 'traceability' | 'audit' | 'activity' | 'git'>('files');
  const [dockTab, setDockTab] = useState<'impact' | 'tests' | 'ai' | 'graph'>('impact');

  // Real-time WebSocket
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  // Analysis & Pipeline State
  const [predictions, setPredictions] = useState<MLPrediction[]>([]);
  const [mlStatus, setMlStatus] = useState<'success' | 'unavailable' | 'idle'>('idle');
  const [testRun, setTestRun] = useState<any>(null);
  const [graphData, setGraphData] = useState<DependencyGraphData>({ nodes: [], edges: [] });
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [docLinks, setDocLinks] = useState<DocumentLink[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [gitCommits, setGitCommits] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Modals
  const [accessModalFile, setAccessModalFile] = useState<ProjectFile | null>(null);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // 1. Initial Data Fetch
  useEffect(() => {
    loadInitialData();
    connectWebSocket();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const userData = await ApiClient.getUsers();
      setUsers(userData.users || []);

      let active: UserProfile | null = null;
      const savedUserStr = localStorage.getItem('codesync_user');
      if (savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          active = (userData.users || []).find((u: any) => u.id === parsed.id) || null;
        } catch {}
      }

      if (!active) {
        active = (userData.users || []).find((u: any) => u.id === 'user_dev_a') || userData.users?.[0] || null;
      }

      if (active) {
        setCurrentUser(active);
        ApiClient.setCurrentUser(active.id);
        await refreshFilesAndGraph(active.id);
      }

      await refreshDocsAndLogs();
      await refreshNotifications();
      await refreshActivities();
      await refreshGitCommits();
    } catch (err: any) {
      console.error('Failed to load initial project data:', err.message);
    }
  };

  const refreshFilesAndGraph = async (userId: string) => {
    try {
      const filesData = await ApiClient.getFiles(projectId);
      setFiles(filesData.files);

      if (!activeFile && filesData.files.length > 0) {
        // Open authService.ts by default
        const authFile = filesData.files.find((f: any) => f.path.includes('authService.ts')) || filesData.files[0];
        const fullFile = await ApiClient.getFile(authFile.id);
        setActiveFile(fullFile.file);
      }

      const graph = await ApiClient.getDependencies(projectId);
      setGraphData(graph);
    } catch (err) {
      console.error('Error refreshing files/graph', err);
    }
  };

  const refreshDocsAndLogs = async () => {
    try {
      const docsRes = await ApiClient.getDocuments(projectId);
      setDocuments(docsRes.documents);
      setDocLinks(docsRes.links);

      const logsRes = await ApiClient.getAuditLogs(projectId);
      setAuditLogs(logsRes.auditLogs);
    } catch (err) {
      console.error('Error refreshing docs/logs', err);
    }
  };

  const refreshNotifications = async () => {
    try {
      const notifsRes = await ApiClient.getNotifications();
      setNotifications(notifsRes.notifications || []);
    } catch (err) {
      console.error('Error refreshing notifications', err);
    }
  };

  const refreshActivities = async () => {
    try {
      const actRes = await ApiClient.getActivity(projectId);
      setActivities(actRes.activities || []);
    } catch (err) {
      console.error('Error refreshing activities', err);
    }
  };

  const refreshGitCommits = async () => {
    try {
      const gitRes = await ApiClient.getGitHistory();
      setGitCommits(gitRes.commits || []);
    } catch (err) {
      console.error('Error refreshing git history', err);
    }
  };

  // 2. WebSocket Connection
  const connectWebSocket = () => {
    const socket = new WebSocket('ws://localhost:5000/ws/collaborate');

    socket.onopen = () => {
      setWsConnected(true);
      setWs(socket);
    };

    socket.onclose = () => {
      setWsConnected(false);
      setWs(null);
      // Reconnect after 3s
      setTimeout(connectWebSocket, 3000);
    };

    socket.onerror = (err) => {
      console.warn('WebSocket error', err);
    };
  };

  // 3. User / Role Switching
  const handleSelectUser = async (user: UserProfile) => {
    setCurrentUser(user);
    ApiClient.setCurrentUser(user.id);
    await refreshFilesAndGraph(user.id);
    await refreshNotifications();

    // Refresh active file permissions for new user
    if (activeFile) {
      const full = await ApiClient.getFile(activeFile.id);
      setActiveFile(full.file);
    }
  };

  // 4. File Selection
  const handleSelectFile = async (file: ProjectFile) => {
    try {
      const full = await ApiClient.getFile(file.id);
      setActiveFile(full.file);
    } catch (err: any) {
      alert(`Could not open file: ${err.message}`);
    }
  };

  // 5. Saving and Triggering CodeSync Pipeline
  const handleSaveFile = async (content: string) => {
    if (!activeFile) return;

    try {
      const res = await ApiClient.saveFile(activeFile.id, content);
      const pipeline = res.pipeline;

      if (pipeline) {
        setPredictions(pipeline.mlPredictions || []);
        setMlStatus(pipeline.mlStatus);
        setTestRun(pipeline.testRun);
        setDockTab('impact');

        // Refresh graph, logs, notifications
        await refreshFilesAndGraph(currentUser?.id || '');
        await refreshDocsAndLogs();
        await refreshNotifications();
      }
    } catch (err: any) {
      if (err.response?.requiresAccessRequest) {
        setAccessModalFile(activeFile);
      } else {
        alert(`Error saving file: ${err.message}`);
      }
    }
  };

  // 6. Access Request Submission
  const handleSubmitAccessRequest = async (reason: string) => {
    if (!accessModalFile) return;
    await ApiClient.createAccessRequest(projectId, accessModalFile.id, reason);
    alert('Access request submitted successfully! Artifact owner has been notified.');
    await refreshDocsAndLogs();
  };

  // 7. Manual Run Tests
  const handleRunTests = async () => {
    try {
      const targetPath = activeFile?.path || 'backend/authService.ts';
      const res = await ApiClient.runTests(projectId, targetPath);
      setTestRun(res);
      setDockTab('tests');
      await refreshDocsAndLogs();
    } catch (err: any) {
      alert(`Test run error: ${err.message}`);
    }
  };

  // 8. Re-index AST Graph
  const handleReindexGraph = async () => {
    try {
      const res = await ApiClient.reindexDependencies(projectId);
      setGraphData(res.graphData);
      setDockTab('graph');
      alert('TypeScript AST Compiler successfully re-indexed the dependency graph.');
    } catch (err: any) {
      alert(`Re-index error: ${err.message}`);
    }
  };

  // 9. Git Commit
  const handleGitCommit = async () => {
    const msg = prompt('Enter Git commit message:', 'Refactor: Update authentication token issuance contract and test suite');
    if (!msg) return;

    try {
      const res = await ApiClient.createCommit(projectId, msg);
      alert(`Commit created successfully!\nHash: ${res.commitHash}`);
      await refreshDocsAndLogs();
      await refreshActivities();
      await refreshGitCommits();
    } catch (err: any) {
      alert(`Git commit error: ${err.message}`);
    }
  };

  const handleCreateGitCommitFromPanel = async (message: string) => {
    const res = await ApiClient.createCommit(projectId, message);
    alert(`Commit created successfully!\nHash: ${res.commitHash}`);
    await refreshDocsAndLogs();
    await refreshActivities();
    await refreshGitCommits();
  };

  // 10. AI Diagnosis Request
  const handleRequestAIAnalysis = async () => {
    return ApiClient.analyzeAI({
      projectId,
      currentFilePath: activeFile?.path || 'backend/authService.ts',
      diffContent: activeFile?.content,
      testResults: testRun,
      mlImpacts: predictions
    });
  };

  // 11. Apply AI Fix Suggestion
  const handleApplyFix = async (targetFilePath: string, proposedCode: string) => {
    const targetFile = files.find((f) => f.path === targetFilePath);
    if (!targetFile) {
      alert(`Target file ${targetFilePath} not found`);
      return;
    }

    try {
      await ApiClient.saveFile(targetFile.id, proposedCode, 'Applied fix suggested by CodeSync Contextual AI');
      alert(`Fix applied successfully to ${targetFilePath}! Re-running pipeline...`);

      const full = await ApiClient.getFile(targetFile.id);
      setActiveFile(full.file);
      await refreshFilesAndGraph(currentUser?.id || '');
      await refreshDocsAndLogs();
      await refreshActivities();

      // Automatically re-run tests to confirm resolution
      const res = await ApiClient.runTests(projectId, targetFilePath);
      setTestRun(res);
      setDockTab('tests');
    } catch (err: any) {
      alert(`Could not apply fix: ${err.message}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ROUTE 1: Landing Page
  if (route === 'landing') {
    return (
      <LandingPage
        onEnterWorkspace={() => navigate('workspace')}
        onGoToLogin={() => navigate('login')}
      />
    );
  }

  // ROUTE 2: Login Page
  if (route === 'login') {
    return (
      <LoginPage
        users={users}
        onLoginSuccess={(user) => {
          handleSelectUser(user);
          navigate('workspace');
        }}
        onBackToLanding={() => navigate('landing')}
      />
    );
  }

  // ROUTE 3: Collaborative Workspace IDE
  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        users={users}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        wsConnected={wsConnected}
        onRunTests={handleRunTests}
        onReindexGraph={handleReindexGraph}
        onGitCommit={handleGitCommit}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setShowNotifications(true)}
        onNavigateHome={() => navigate('landing')}
        onSignOut={() => {
          localStorage.removeItem('codesync_token');
          localStorage.removeItem('codesync_user');
          navigate('login');
        }}
      />

      {/* Main IDE Split Layout */}
      <div className="ide-body">
        {/* Left Sidebar */}
        <aside className="ide-sidebar">
          <div className="sidebar-tabs">
            <div
              className={`sidebar-tab ${sidebarTab === 'files' ? 'active' : ''}`}
              onClick={() => setSidebarTab('files')}
              title="Project Files"
            >
              Files
            </div>
            <div
              className={`sidebar-tab ${sidebarTab === 'traceability' ? 'active' : ''}`}
              onClick={() => setSidebarTab('traceability')}
              title="Requirements Traceability"
            >
              Trace
            </div>
            <div
              className={`sidebar-tab ${sidebarTab === 'audit' ? 'active' : ''}`}
              onClick={() => setSidebarTab('audit')}
              title="Audit Log"
            >
              Audit
            </div>
            <div
              className={`sidebar-tab ${sidebarTab === 'activity' ? 'active' : ''}`}
              onClick={() => setSidebarTab('activity')}
              title="Real-Time Activity Feed"
            >
              Activity
            </div>
            <div
              className={`sidebar-tab ${sidebarTab === 'git' ? 'active' : ''}`}
              onClick={() => setSidebarTab('git')}
              title="Git History & Commits"
            >
              Git
            </div>
          </div>

          {sidebarTab === 'files' && (
            <FileExplorer
              files={files}
              selectedFileId={activeFile?.id || null}
              onSelectFile={handleSelectFile}
              onRequestAccess={(file) => setAccessModalFile(file)}
            />
          )}

          {sidebarTab === 'traceability' && (
            <TraceabilityViewer
              documents={documents}
              links={docLinks}
              onSelectFileByPath={(p) => {
                const target = files.find((f) => f.path === p);
                if (target) handleSelectFile(target);
              }}
            />
          )}

          {sidebarTab === 'audit' && <AuditLogViewer logs={auditLogs} />}

          {sidebarTab === 'activity' && (
            <ActivityFeed activities={activities} onRefresh={refreshActivities} />
          )}

          {sidebarTab === 'git' && (
            <GitPanel
              commits={gitCommits}
              onCreateCommit={handleCreateGitCommitFromPanel}
              onRefresh={refreshGitCommits}
            />
          )}
        </aside>

        {/* Central Workspace */}
        <main className="ide-workspace">
          <div style={{ flex: 1, minHeight: 0 }}>
            <CollaborativeEditor
              file={activeFile}
              currentUser={currentUser}
              ws={ws}
              onSave={handleSaveFile}
              onRequestAccess={(file) => setAccessModalFile(file)}
            />
          </div>

          {/* Bottom Dock */}
          <div className="ide-dock">
            <div className="dock-header">
              <div className="dock-tabs">
                <div
                  className={`dock-tab ${dockTab === 'impact' ? 'active' : ''}`}
                  onClick={() => setDockTab('impact')}
                >
                  ⚡ Change Impact (ML)
                  {predictions.length > 0 && (
                    <span style={{ fontSize: '10px', background: 'var(--bg-surface)', padding: '1px 5px', borderRadius: '4px' }}>
                      {predictions.length}
                    </span>
                  )}
                </div>

                <div
                  className={`dock-tab ${dockTab === 'tests' ? 'active' : ''}`}
                  onClick={() => setDockTab('tests')}
                >
                  🧪 Test Results
                  {testRun && (
                    <span style={{ fontSize: '10px', color: testRun.status === 'failed' ? 'var(--color-high)' : 'var(--color-low)' }}>
                      ({testRun.status})
                    </span>
                  )}
                </div>

                <div
                  className={`dock-tab ${dockTab === 'ai' ? 'active' : ''}`}
                  onClick={() => setDockTab('ai')}
                >
                  🤖 Contextual AI
                </div>

                <div
                  className={`dock-tab ${dockTab === 'graph' ? 'active' : ''}`}
                  onClick={() => setDockTab('graph')}
                >
                  🕸 Dependency Graph
                </div>
              </div>
            </div>

            <div className="dock-content">
              {dockTab === 'impact' && (
                <ChangeImpactPanel
                  changedFile={activeFile?.path || null}
                  predictions={predictions}
                  mlStatus={mlStatus}
                />
              )}

              {dockTab === 'tests' && (
                <TestResultPanel testRun={testRun} onRerun={handleRunTests} />
              )}

              {dockTab === 'ai' && (
                <AIAssistantPanel
                  currentFilePath={activeFile?.path || ''}
                  testRun={testRun}
                  predictions={predictions}
                  onApplyFix={handleApplyFix}
                  onRequestAnalysis={handleRequestAIAnalysis}
                />
              )}

              {dockTab === 'graph' && (
                <DependencyGraphVisualizer
                  graphData={graphData}
                  activeFilePath={activeFile?.path}
                  predictions={predictions}
                  onSelectNodeFile={(p) => {
                    const target = files.find((f) => f.path === p);
                    if (target) handleSelectFile(target);
                  }}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Controlled Editing Access Request Modal */}
      {accessModalFile && (
        <AccessRequestModal
          file={accessModalFile}
          onClose={() => setAccessModalFile(null)}
          onSubmit={handleSubmitAccessRequest}
        />
      )}

      {/* Notifications Drawer */}
      {showNotifications && (
        <div className="modal-overlay" onClick={() => setShowNotifications(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className="modal-title">🔔 Targeted Artifact Notifications</h3>
              <button className="btn btn-sm" onClick={() => setShowNotifications(false)}>✕</button>
            </div>
            <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No notifications for current user.</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      padding: '10px',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-main)', marginBottom: '3px' }}>
                      {n.title}
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
