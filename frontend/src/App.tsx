import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/layout/Header';
import { StatusBar } from './components/layout/StatusBar';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { CommandPalette } from './components/common/CommandPalette';
import { ToastContainer, ToastItem } from './components/common/Toast';
import { FileExplorer } from './components/explorer/FileExplorer';
import { CollaborativeEditor } from './components/editor/CollaborativeEditor';
import { ChangeImpactPanel } from './components/impact/ChangeImpactPanel';
import { AIAssistantPanel } from './components/ai/AIAssistantPanel';
import { AIReviewModal } from './components/ai/AIReviewModal';
import { DependencyGraphVisualizer } from './components/graph/DependencyGraphVisualizer';
import { TestResultPanel } from './components/test/TestResultPanel';
import { TraceabilityViewer } from './components/docs/TraceabilityViewer';
import { AuditLogViewer } from './components/audit/AuditLogViewer';
import { ActivityFeed } from './components/activity/ActivityFeed';
import { GitPanel } from './components/git/GitPanel';
import { AccessRequestModal } from './components/requests/AccessRequestModal';
import { ProjectOverview } from './components/dashboard/ProjectOverview';
import { LandingPage } from './components/landing/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { ApiClient } from './services/api';
import { Icons } from './components/common/Icons';
import {
  UserProfile,
  ProjectFile,
  DependencyGraphData,
  MLPrediction,
  DocumentItem,
  DocumentLink,
  AuditLogItem
} from './types';

type Route = 'landing' | 'login' | 'workspace' | 'overview';
type PipelinePhase = 'EDIT' | 'ANALYZE' | 'PREDICT' | 'TEST' | 'REVIEW' | 'COMMIT';

export const App: React.FC = () => {
  const projectId = 'proj_smart_canteen';

  // Routing
  const getInitialRoute = (): Route => {
    const p = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (p === '/login' || hash.includes('login')) return 'login';
    if (p === '/overview' || hash.includes('overview')) return 'overview';
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

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const addToast = (t: Omit<ToastItem, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { ...t, id }]);
  };
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // User & Files State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [openFiles, setOpenFiles] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });

  // Navigation & Docks Layout
  const [sidebarTab, setSidebarTab] = useState<'files' | 'traceability' | 'audit' | 'activity' | 'git'>('files');
  const [rightDockTab, setRightDockTab] = useState<'impact' | 'ai'>('impact');
  const [rightDockCollapsed, setRightDockCollapsed] = useState<boolean>(false);
  const [bottomDockTab, setBottomDockTab] = useState<'tests' | 'graph' | 'traceability' | 'audit' | 'git'>('tests');
  const [bottomDockHeight, setBottomDockHeight] = useState<number>(220);
  const [bottomDockCollapsed, setBottomDockCollapsed] = useState<boolean>(false);

  // 6-Stage Lifecycle Pipeline Progression
  const [pipelinePhase, setPipelinePhase] = useState<PipelinePhase>('EDIT');

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

  // Modals & Drawers
  const [accessModalFile, setAccessModalFile] = useState<ProjectFile | null>(null);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [aiReviewData, setAiReviewData] = useState<{
    targetFile: string;
    description: string;
    proposedCode: string;
    diff: string;
  } | null>(null);

  // Resize bottom dock reference
  const isDraggingDock = useRef(false);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K -> Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      // Ctrl+Shift+I -> Toggle Right Intelligence Dock
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setRightDockCollapsed((prev) => !prev);
      }
      // Ctrl+B -> Toggle Bottom Console Dock
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b' && !e.shiftKey) {
        e.preventDefault();
        setBottomDockCollapsed((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initial Data Fetch
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
      addToast({
        type: 'error',
        title: 'Initialization Error',
        message: err.message || 'Could not connect to backend service.'
      });
    }
  };

  const refreshFilesAndGraph = async (userId: string) => {
    try {
      const filesData = await ApiClient.getFiles(projectId);
      const loadedFiles = filesData.files || [];
      setFiles(loadedFiles);

      // Open authService.ts and login.tsx by default
      if (loadedFiles.length > 0) {
        const authFile = loadedFiles.find((f: any) => f.path.includes('authService.ts')) || loadedFiles[0];
        const loginFile = loadedFiles.find((f: any) => f.path.includes('login.tsx'));

        const fullAuth = await ApiClient.getFile(authFile.id);
        const openArr = [fullAuth.file];

        if (loginFile) {
          const fullLogin = await ApiClient.getFile(loginFile.id);
          openArr.push(fullLogin.file);
        }

        setOpenFiles(openArr);
        setActiveFile(fullAuth.file);
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
      setDocuments(docsRes.documents || []);
      setDocLinks(docsRes.links || []);

      const logsRes = await ApiClient.getAuditLogs(projectId);
      setAuditLogs(logsRes.auditLogs || []);
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

  // WebSocket Connection
  const connectWebSocket = () => {
    try {
      const socket = new WebSocket('ws://localhost:5000/ws/collaborate');

      socket.onopen = () => {
        setWsConnected(true);
        setWs(socket);
      };

      socket.onclose = () => {
        setWsConnected(false);
        setWs(null);
        setTimeout(connectWebSocket, 3000);
      };

      socket.onerror = (err) => {
        console.warn('WebSocket error', err);
      };
    } catch (e) {
      console.warn('WebSocket connection not supported in this runtime', e);
    }
  };

  // User / Persona Switching
  const handleSelectUser = async (user: UserProfile) => {
    setCurrentUser(user);
    ApiClient.setCurrentUser(user.id);
    localStorage.setItem('codesync_user', JSON.stringify(user));
    await refreshFilesAndGraph(user.id);
    await refreshNotifications();

    if (activeFile) {
      const full = await ApiClient.getFile(activeFile.id);
      setActiveFile(full.file);
    }

    addToast({
      type: 'info',
      title: 'Switched Active Persona',
      message: `Active user updated to ${user.full_name} (${user.role}). Permissions re-indexed.`
    });
  };

  // File Selection and Tab Management
  const handleSelectFile = async (file: ProjectFile) => {
    try {
      const full = await ApiClient.getFile(file.id);
      setActiveFile(full.file);

      // Add to open tabs if not present
      setOpenFiles((prev) => {
        if (prev.some((f) => f.id === full.file.id)) {
          return prev.map((f) => (f.id === full.file.id ? full.file : f));
        }
        return [...prev, full.file];
      });

      setPipelinePhase('EDIT');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Could not open artifact',
        message: err.message
      });
    }
  };

  const handleCloseFileTab = (fileId: string) => {
    setOpenFiles((prev) => {
      const remaining = prev.filter((f) => f.id !== fileId);
      if (activeFile?.id === fileId && remaining.length > 0) {
        setActiveFile(remaining[remaining.length - 1]);
      } else if (remaining.length === 0) {
        setActiveFile(null);
      }
      return remaining;
    });
  };

  // Save and Trigger CodeSync Pipeline
  const handleSaveFile = async (content: string) => {
    if (!activeFile) return;

    // 1. EDIT -> ANALYZE
    setPipelinePhase('ANALYZE');

    try {
      const res = await ApiClient.saveFile(activeFile.id, content);
      const pipeline = res.pipeline;

      // 2. ANALYZE -> PREDICT
      setPipelinePhase('PREDICT');

      if (pipeline) {
        setPredictions(pipeline.mlPredictions || []);
        setMlStatus(pipeline.mlStatus);
        setTestRun(pipeline.testRun);

        // Open intelligence dock to show impact
        setRightDockCollapsed(false);
        setRightDockTab('impact');

        // Refresh graph, logs, notifications
        await refreshFilesAndGraph(currentUser?.id || '');
        await refreshDocsAndLogs();
        await refreshNotifications();

        // 3. PREDICT -> TEST
        setPipelinePhase('TEST');

        const highCount = (pipeline.mlPredictions || []).filter((p: any) => p.riskLevel === 'HIGH').length;
        if (pipeline.testRun?.status === 'failed') {
          setPipelinePhase('REVIEW');
          addToast({
            type: 'error',
            title: 'Regression Tests Failed',
            message: `${pipeline.testRun.failedTests} test(s) failed. Contextual AI is ready to diagnose.`,
            actionLabel: 'Diagnose with AI',
            onAction: () => {
              setRightDockTab('ai');
              setRightDockCollapsed(false);
            }
          });
        } else {
          setPipelinePhase('COMMIT');
          addToast({
            type: 'success',
            title: 'Changes Saved & Verified',
            message: `AST graph re-indexed. ${highCount} high-risk artifact(s) predicted.`
          });
        }
      }
    } catch (err: any) {
      setPipelinePhase('EDIT');
      if (err.response?.requiresAccessRequest || err.requiresAccessRequest) {
        setAccessModalFile(activeFile);
        addToast({
          type: 'warning',
          title: 'Controlled Access Restricted',
          message: `This artifact is locked by its module owner. Please submit an access request.`
        });
      } else {
        addToast({
          type: 'error',
          title: 'Error Saving Artifact',
          message: err.message
        });
      }
    }
  };

  // Access Request Submission
  const handleSubmitAccessRequest = async (reason: string) => {
    if (!accessModalFile) return;
    try {
      await ApiClient.createAccessRequest(projectId, accessModalFile.id, reason);
      addToast({
        type: 'success',
        title: 'Access Request Submitted',
        message: `Owner ${accessModalFile.owner_name || 'Assigned Developer'} has received your request.`
      });
      await refreshDocsAndLogs();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Access Request Failed',
        message: err.message
      });
    }
  };

  // Run Tests
  const handleRunTests = async () => {
    try {
      setPipelinePhase('TEST');
      const targetPath = activeFile?.path || 'backend/authService.ts';
      const res = await ApiClient.runTests(projectId, targetPath);
      setTestRun(res);
      setBottomDockTab('tests');
      setBottomDockCollapsed(false);
      await refreshDocsAndLogs();

      if (res.status === 'failed') {
        setPipelinePhase('REVIEW');
        addToast({
          type: 'error',
          title: 'Test Suite Execution Failed',
          message: `${res.failedTests} test failure(s) detected in ${targetPath}.`,
          actionLabel: 'Diagnose AI',
          onAction: () => {
            setRightDockTab('ai');
            setRightDockCollapsed(false);
          }
        });
      } else {
        setPipelinePhase('COMMIT');
        addToast({
          type: 'success',
          title: 'Test Suite Passed',
          message: `All ${res.totalTests} tests passed in ${res.durationMs}ms.`
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Test Execution Error',
        message: err.message
      });
    }
  };

  // Re-index AST Graph
  const handleReindexGraph = async () => {
    try {
      const res = await ApiClient.reindexDependencies(projectId);
      setGraphData(res.graphData);
      setBottomDockTab('graph');
      setBottomDockCollapsed(false);
      addToast({
        type: 'success',
        title: 'AST Dependency Graph Re-Indexed',
        message: `Compiler parsed ${res.graphData.nodes.length} nodes and ${res.graphData.edges.length} directed edges.`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Re-indexing Failed',
        message: err.message
      });
    }
  };

  // Git Commit
  const handleGitCommitPrompt = async () => {
    setSidebarTab('git');
    addToast({
      type: 'info',
      title: 'Source Control (Git)',
      message: 'Switched to Git panel. Enter your message and record the commit.'
    });
  };

  const handleCreateGitCommitFromPanel = async (message: string) => {
    try {
      const res = await ApiClient.createCommit(projectId, message);
      addToast({
        type: 'success',
        title: 'Git Commit Created',
        message: `Commit ${res.commitHash.slice(0, 8)} recorded on branch main.`,
        actionLabel: 'Return to Overview',
        onAction: () => navigate('overview')
      });
      setPipelinePhase('EDIT');
      await refreshDocsAndLogs();
      await refreshActivities();
      await refreshGitCommits();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Git Commit Error',
        message: err.message
      });
    }
  };

  // Contextual AI Analysis
  const handleRequestAIAnalysis = async () => {
    return ApiClient.analyzeAI({
      projectId,
      currentFilePath: activeFile?.path || 'backend/authService.ts',
      diffContent: activeFile?.content,
      testResults: testRun,
      mlImpacts: predictions
    });
  };

  // Apply AI Fix & Verify Safeguard
  const handleApplyAndVerifyPatch = async (targetFilePath: string, proposedCode: string): Promise<boolean> => {
    const targetFile = files.find((f) => f.path === targetFilePath);
    if (!targetFile) {
      addToast({
        type: 'error',
        title: 'Target Artifact Not Found',
        message: `Could not locate ${targetFilePath} in current workspace.`
      });
      return false;
    }

    try {
      // 1. Apply patch
      await ApiClient.saveFile(targetFile.id, proposedCode, 'Applied verified fix from CodeSync Contextual AI');

      // Refresh file state
      const full = await ApiClient.getFile(targetFile.id);
      setActiveFile(full.file);
      await refreshFilesAndGraph(currentUser?.id || '');
      await refreshDocsAndLogs();

      // 2. Automated Test Verification Safeguard
      const testRes = await ApiClient.runTests(projectId, targetFilePath);
      setTestRun(testRes);

      if (testRes.status === 'passed') {
        setPipelinePhase('COMMIT');
        addToast({
          type: 'success',
          title: 'Patch Applied & Verified',
          message: `All regression tests passed successfully for ${targetFilePath}.`
        });
        return true;
      } else {
        setPipelinePhase('REVIEW');
        addToast({
          type: 'warning',
          title: 'Patch Verification Failed',
          message: `Tests failed post-patch application. You can revert or inspect failure details.`
        });
        return false;
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Patch Application Error',
        message: err.message
      });
      return false;
    }
  };

  // Console Resizing Handlers
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingDock.current = true;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingDock.current) return;
      const windowHeight = window.innerHeight;
      const newHeight = Math.max(120, Math.min(windowHeight - 200, windowHeight - moveEvent.clientY - 24));
      setBottomDockHeight(newHeight);
      setBottomDockCollapsed(false);
    };

    const handleMouseUp = () => {
      isDraggingDock.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ROUTE 1: Landing Page
  if (route === 'landing') {
    return (
      <>
        <LandingPage
          onEnterWorkspace={() => navigate('workspace')}
          onGoToLogin={() => navigate('login')}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // ROUTE 2: Login Page
  if (route === 'login') {
    return (
      <>
        <LoginPage
          users={users}
          onLoginSuccess={(user) => {
            handleSelectUser(user);
            navigate('overview');
          }}
          onBackToLanding={() => navigate('landing')}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // ROUTE 3: Project Overview Dashboard
  if (route === 'overview') {
    return (
      <div className="app-container">
        <Header
          users={users}
          currentUser={currentUser}
          onSelectUser={handleSelectUser}
          wsConnected={wsConnected}
          onRunTests={handleRunTests}
          onReindexGraph={handleReindexGraph}
          onGitCommit={handleGitCommitPrompt}
          unreadNotificationsCount={unreadCount}
          onOpenNotifications={() => setNotificationDrawerOpen(true)}
          onNavigateHome={() => navigate('landing')}
          onOpenOverview={() => navigate('overview')}
          onOpenPalette={() => setCommandPaletteOpen(true)}
          onSignOut={() => {
            localStorage.removeItem('codesync_token');
            localStorage.removeItem('codesync_user');
            navigate('login');
          }}
        />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ProjectOverview
            files={files}
            users={users}
            predictions={predictions}
            documents={documents}
            testRun={testRun}
            activities={activities}
            gitCommits={gitCommits}
            onOpenWorkspace={() => navigate('workspace')}
            onSelectFile={(f) => {
              handleSelectFile(f);
              navigate('workspace');
            }}
            onSignOut={() => {
              localStorage.removeItem('codesync_token');
              localStorage.removeItem('codesync_user');
              navigate('login');
            }}
          />
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  // ROUTE 4: Collaborative Workspace 3-Column IDE
  return (
    <div className="app-container">
      {/* 1. Header */}
      <Header
        users={users}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        wsConnected={wsConnected}
        onRunTests={handleRunTests}
        onReindexGraph={handleReindexGraph}
        onGitCommit={handleGitCommitPrompt}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setNotificationDrawerOpen(true)}
        onNavigateHome={() => navigate('landing')}
        onOpenOverview={() => navigate('overview')}
        onOpenPalette={() => setCommandPaletteOpen(true)}
        onSignOut={() => {
          localStorage.removeItem('codesync_token');
          localStorage.removeItem('codesync_user');
          navigate('login');
        }}
      />

      {/* 2. 6-Stage Lifecycle Pipeline Banner */}
      <div className="lifecycle-bar">
        <div className="lifecycle-steps-wrapper">
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '6px' }}>
            Pipeline Lifecycle:
          </span>

          <div className={`lifecycle-step ${pipelinePhase === 'EDIT' ? 'active' : 'completed'}`}>
            <Icons.Code size={11} color={pipelinePhase === 'EDIT' ? '#818cf8' : 'var(--color-low)'} />
            <span>1. EDIT</span>
          </div>
          <span className="lifecycle-arrow">→</span>

          <div className={`lifecycle-step ${pipelinePhase === 'ANALYZE' ? 'active' : ['PREDICT', 'TEST', 'REVIEW', 'COMMIT'].includes(pipelinePhase) ? 'completed' : ''}`}>
            <Icons.Network size={11} color={pipelinePhase === 'ANALYZE' ? '#818cf8' : 'var(--text-muted)'} />
            <span>2. ANALYZE</span>
          </div>
          <span className="lifecycle-arrow">→</span>

          <div className={`lifecycle-step ${pipelinePhase === 'PREDICT' ? 'active' : ['TEST', 'REVIEW', 'COMMIT'].includes(pipelinePhase) ? 'completed' : ''}`}>
            <Icons.Zap size={11} color={pipelinePhase === 'PREDICT' ? '#818cf8' : 'var(--text-muted)'} />
            <span>3. PREDICT</span>
          </div>
          <span className="lifecycle-arrow">→</span>

          <div className={`lifecycle-step ${pipelinePhase === 'TEST' ? 'active' : ['REVIEW', 'COMMIT'].includes(pipelinePhase) ? 'completed' : ''}`}>
            <Icons.Flask size={11} color={pipelinePhase === 'TEST' ? '#818cf8' : 'var(--text-muted)'} />
            <span>4. TEST</span>
          </div>
          <span className="lifecycle-arrow">→</span>

          <div className={`lifecycle-step ${pipelinePhase === 'REVIEW' ? 'active' : pipelinePhase === 'COMMIT' ? 'completed' : ''}`}>
            <Icons.Sparkles size={11} color={pipelinePhase === 'REVIEW' ? '#c084fc' : 'var(--text-muted)'} />
            <span>5. REVIEW</span>
          </div>
          <span className="lifecycle-arrow">→</span>

          <div className={`lifecycle-step ${pipelinePhase === 'COMMIT' ? 'active' : ''}`}>
            <Icons.GitCommit size={11} color={pipelinePhase === 'COMMIT' ? '#818cf8' : 'var(--text-muted)'} />
            <span>6. COMMIT</span>
          </div>
        </div>

        {/* Intelligence Dock Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn-sm"
            onClick={() => setRightDockCollapsed((prev) => !prev)}
            style={{ fontSize: '10px', padding: '2px 8px', gap: '4px' }}
            title="Toggle Right Intelligence Dock (Ctrl+Shift+I)"
          >
            <Icons.Sparkles size={11} color="var(--accent-blue)" />
            <span>{rightDockCollapsed ? 'Show Intelligence Dock' : 'Hide Intelligence'}</span>
          </button>
        </div>
      </div>

      {/* 3. 3-Column IDE Body */}
      <div className="ide-body-3col">
        {/* COLUMN 1: Left Pane (Explorer & Sidebars) */}
        <aside className="ide-left-pane">
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

          <div style={{ flex: 1, overflowY: 'auto' }}>
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
                currentUserRole={currentUser?.role}
                onSelectFileByPath={(p) => {
                  const target = files.find((f) => f.path === p);
                  if (target) handleSelectFile(target);
                }}
                onVerifyDocument={async (docId) => {
                  try {
                    await ApiClient.verifyDocument(docId);
                    addToast({
                      type: 'success',
                      title: 'Document Verified',
                      message: `Requirements specification verified.`
                    });
                    await refreshDocsAndLogs();
                  } catch (e: any) {
                    addToast({ type: 'error', title: 'Verification Error', message: e.message });
                  }
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
          </div>
        </aside>

        {/* COLUMN 2: Center Pane (Open Tabs + Editor + Resizable Console Dock) */}
        <main className="ide-center-pane">
          {/* Monaco Editor with Tab Bar & Breadcrumbs */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <CollaborativeEditor
              file={activeFile}
              openFiles={openFiles}
              activeFileId={activeFile?.id}
              currentUser={currentUser}
              ws={ws}
              onSave={handleSaveFile}
              onRequestAccess={(file) => setAccessModalFile(file)}
              onSelectFile={handleSelectFile}
              onCloseFileTab={handleCloseFileTab}
              onCursorChange={(pos) => setCursorPos(pos)}
            />
          </div>

          {/* Draggable Divider Handle */}
          <div
            className={`dock-resize-handle ${isDraggingDock.current ? 'active' : ''}`}
            onMouseDown={handleMouseDownResize}
            title="Drag to resize bottom console dock"
          />

          {/* Resizable Bottom Console Dock */}
          <div
            className={`ide-bottom-console ${bottomDockCollapsed ? 'collapsed' : ''}`}
            style={{ height: bottomDockCollapsed ? '36px' : `${bottomDockHeight}px` }}
          >
            {/* Dock Header with Tabs & Controls */}
            <div className="dock-header">
              <div className="dock-tabs">
                <div
                  className={`dock-tab ${bottomDockTab === 'tests' ? 'active' : ''}`}
                  onClick={() => {
                    setBottomDockTab('tests');
                    setBottomDockCollapsed(false);
                  }}
                >
                  <Icons.Flask size={13} color={testRun?.status === 'failed' ? 'var(--color-high)' : 'var(--accent-blue)'} />
                  <span>Tests</span>
                  {testRun && (
                    <span style={{
                      fontSize: '10px',
                      color: testRun.status === 'failed' ? 'var(--color-high)' : 'var(--color-low)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      ({testRun.passedTests}/{testRun.totalTests})
                    </span>
                  )}
                </div>

                <div
                  className={`dock-tab ${bottomDockTab === 'graph' ? 'active' : ''}`}
                  onClick={() => {
                    setBottomDockTab('graph');
                    setBottomDockCollapsed(false);
                  }}
                >
                  <Icons.Network size={13} color="var(--accent-blue)" />
                  <span>Dependency Graph</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    ({graphData.nodes.length} nodes)
                  </span>
                </div>

                <div
                  className={`dock-tab ${bottomDockTab === 'traceability' ? 'active' : ''}`}
                  onClick={() => {
                    setBottomDockTab('traceability');
                    setBottomDockCollapsed(false);
                  }}
                >
                  <Icons.File size={13} color="var(--accent-blue)" />
                  <span>Traceability</span>
                </div>

                <div
                  className={`dock-tab ${bottomDockTab === 'audit' ? 'active' : ''}`}
                  onClick={() => {
                    setBottomDockTab('audit');
                    setBottomDockCollapsed(false);
                  }}
                >
                  <Icons.ClipboardList size={13} color="var(--accent-blue)" />
                  <span>Audit Trail</span>
                </div>

                <div
                  className={`dock-tab ${bottomDockTab === 'git' ? 'active' : ''}`}
                  onClick={() => {
                    setBottomDockTab('git');
                    setBottomDockCollapsed(false);
                  }}
                >
                  <Icons.GitBranch size={13} color="#a855f7" />
                  <span>Git History</span>
                </div>
              </div>

              {/* Console Minimize / Toggle Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  className="btn btn-sm"
                  onClick={() => setBottomDockCollapsed((prev) => !prev)}
                  style={{ padding: '2px 6px', fontSize: '10px' }}
                  title="Toggle console collapsed state (Ctrl+B)"
                >
                  {bottomDockCollapsed ? '▲ Expand' : '▼ Collapse'}
                </button>
              </div>
            </div>

            {/* Dock Content */}
            {!bottomDockCollapsed && (
              <div className="dock-content">
                {bottomDockTab === 'tests' && (
                  <TestResultPanel
                    testRun={testRun}
                    onRerun={handleRunTests}
                    onDiagnoseWithAI={() => {
                      setRightDockTab('ai');
                      setRightDockCollapsed(false);
                    }}
                  />
                )}

                {bottomDockTab === 'graph' && (
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

                {bottomDockTab === 'traceability' && (
                  <TraceabilityViewer
                    documents={documents}
                    links={docLinks}
                    currentUserRole={currentUser?.role}
                    onSelectFileByPath={(p) => {
                      const target = files.find((f) => f.path === p);
                      if (target) handleSelectFile(target);
                    }}
                  />
                )}

                {bottomDockTab === 'audit' && <AuditLogViewer logs={auditLogs} />}

                {bottomDockTab === 'git' && (
                  <GitPanel
                    commits={gitCommits}
                    onCreateCommit={handleCreateGitCommitFromPanel}
                    onRefresh={refreshGitCommits}
                  />
                )}
              </div>
            )}
          </div>
        </main>

        {/* COLUMN 3: Right Intelligence Dock (Impact Analysis & Contextual AI) */}
        <aside className={`ide-right-dock ${rightDockCollapsed ? 'collapsed' : ''}`}>
          {/* Header Tabs */}
          <div className="right-dock-header">
            <div className="right-dock-tabs">
              <button
                className={`right-dock-tab ${rightDockTab === 'impact' ? 'active' : ''}`}
                onClick={() => setRightDockTab('impact')}
              >
                <Icons.Zap size={13} color="var(--accent-blue)" />
                <span>Change Impact</span>
                {predictions.length > 0 && (
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '10px',
                    backgroundColor: predictions.some((p) => p.riskLevel === 'HIGH') ? 'var(--color-high-bg)' : 'var(--bg-surface)',
                    color: predictions.some((p) => p.riskLevel === 'HIGH') ? 'var(--color-high)' : 'var(--text-muted)'
                  }}>
                    {predictions.length}
                  </span>
                )}
              </button>

              <button
                className={`right-dock-tab ${rightDockTab === 'ai' ? 'active' : ''}`}
                onClick={() => setRightDockTab('ai')}
              >
                <Icons.Sparkles size={13} color="#c084fc" />
                <span>Contextual AI</span>
              </button>
            </div>

            <button
              className="btn btn-sm"
              onClick={() => setRightDockCollapsed(true)}
              style={{ padding: '2px 6px', fontSize: '11px' }}
              title="Collapse Intelligence Dock (Ctrl+Shift+I)"
            >
              <Icons.X size={12} color="var(--text-muted)" />
            </button>
          </div>

          {/* Dock Content */}
          <div className="right-dock-content">
            {rightDockTab === 'impact' && (
              <ChangeImpactPanel
                changedFile={activeFile?.path || null}
                predictions={predictions}
                mlStatus={mlStatus}
                onOpenFile={(p) => {
                  const target = files.find((f) => f.path === p);
                  if (target) handleSelectFile(target);
                }}
                onSwitchTab={(t) => {
                  if (t === 'tests') {
                    setBottomDockTab('tests');
                    setBottomDockCollapsed(false);
                  }
                }}
              />
            )}

            {rightDockTab === 'ai' && (
              <AIAssistantPanel
                currentFilePath={activeFile?.path || ''}
                testRun={testRun}
                predictions={predictions}
                currentUserRole={currentUser?.role}
                onApplyFix={async (path, code) => {
                  await handleApplyAndVerifyPatch(path, code);
                }}
                onRequestAnalysis={handleRequestAIAnalysis}
                onOpenReviewModal={(fix) => {
                  setAiReviewData({
                    targetFile: fix.targetFile,
                    description: fix.description || 'AI Suggested Interface Fix',
                    proposedCode: fix.proposedCode,
                    diff: fix.diff || ''
                  });
                }}
              />
            )}
          </div>
        </aside>
      </div>

      {/* 4. Bottom 24px Status Bar */}
      <StatusBar
        wsConnected={wsConnected}
        nodesCount={graphData.nodes.length}
        edgesCount={graphData.edges.length}
        mlStatus={mlStatus}
        testRun={testRun}
        gitBranch="main"
        cursorPos={cursorPos}
        activeLanguage={activeFile?.language || 'TypeScript'}
        onToggleConsole={() => setBottomDockCollapsed((prev) => !prev)}
        onToggleRightDock={() => setRightDockCollapsed((prev) => !prev)}
      />

      {/* Controlled Editing Access Request Modal */}
      {accessModalFile && (
        <AccessRequestModal
          file={accessModalFile}
          onClose={() => setAccessModalFile(null)}
          onSubmit={handleSubmitAccessRequest}
        />
      )}

      {/* AI Two-Step Review & Verification Modal */}
      {aiReviewData && (
        <AIReviewModal
          isOpen={true}
          onClose={() => setAiReviewData(null)}
          targetFilePath={aiReviewData.targetFile}
          originalCode={files.find((f) => f.path === aiReviewData.targetFile)?.content || ''}
          proposedCode={aiReviewData.proposedCode}
          description={aiReviewData.description}
          onApplyAndTest={async (path, code) => {
            return handleApplyAndVerifyPatch(path, code);
          }}
          onInspectFailure={() => {
            setAiReviewData(null);
            setBottomDockTab('tests');
            setBottomDockCollapsed(false);
          }}
        />
      )}

      {/* Slide-In Notification Drawer */}
      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkRead={async (id) => {
          try {
            await ApiClient.markNotificationRead(id);
            await refreshNotifications();
          } catch {}
        }}
        onSelectFileByPath={(p) => {
          const target = files.find((f) => f.path === p);
          if (target) handleSelectFile(target);
          setNotificationDrawerOpen(false);
        }}
      />

      {/* Ctrl+K Command Palette Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        files={files}
        onSelectFile={(f) => {
          handleSelectFile(f);
          setCommandPaletteOpen(false);
        }}
        onSaveAndAnalyze={() => {
          if (activeFile?.content) handleSaveFile(activeFile.content);
          setCommandPaletteOpen(false);
        }}
        onRunTests={() => {
          handleRunTests();
          setCommandPaletteOpen(false);
        }}
        onReindexGraph={() => {
          handleReindexGraph();
          setCommandPaletteOpen(false);
        }}
        onAskAI={() => {
          setRightDockTab('ai');
          setRightDockCollapsed(false);
          setCommandPaletteOpen(false);
        }}
        onGitCommit={() => {
          handleGitCommitPrompt();
          setCommandPaletteOpen(false);
        }}
        onToggleRightDock={() => {
          setRightDockCollapsed((prev) => !prev);
          setCommandPaletteOpen(false);
        }}
        onToggleConsole={() => {
          setBottomDockCollapsed((prev) => !prev);
          setCommandPaletteOpen(false);
        }}
        onOpenPersonaModal={() => {
          setCommandPaletteOpen(false);
        }}
        onSwitchSidebarTab={(t) => {
          setSidebarTab(t);
          setCommandPaletteOpen(false);
        }}
        onOpenOverview={() => {
          navigate('overview');
          setCommandPaletteOpen(false);
        }}
      />

      {/* Floating Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
