import { Router, Request, Response } from 'express';
import { db } from '../config/database';
import { authMiddleware, requireRole, canUserEditFile } from '../middleware/auth';
import { ChangeDetectionService } from '../services/change.service';
import { dependencyService } from '../services/dependency.service';
import { OwnershipService } from '../services/ownership.service';
import { TestRunnerService } from '../services/test-runner.service';
import { ContextualAIService } from '../services/ai.service';
import { AuditService } from '../services/audit.service';

export const apiRouter = Router();
apiRouter.use(authMiddleware);

// ==========================================
// 1. Auth & Profiles
// ==========================================
apiRouter.get('/auth/users', async (req: Request, res: Response) => {
  const result = await db.query('SELECT id, email, full_name, role, avatar_url FROM profiles ORDER BY full_name');
  res.json({ users: result.rows, currentUser: req.user });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  res.json({ user: req.user });
});

// ==========================================
// 2. Projects & File Explorer
// ==========================================
apiRouter.get('/projects/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const projRes = await db.query('SELECT * FROM projects WHERE id = ?', [id]);
  if (projRes.rows.length === 0) return res.status(404).json({ error: 'Project not found' });

  const membersRes = await db.query(
    `SELECT pm.role, p.id, p.email, p.full_name, p.avatar_url
     FROM project_members pm
     JOIN profiles p ON pm.user_id = p.id
     WHERE pm.project_id = ?`,
    [id]
  );

  res.json({ project: projRes.rows[0], members: membersRes.rows });
});

apiRouter.get('/projects/:id/files', async (req: Request, res: Response) => {
  const { id } = req.params;
  const filesRes = await db.query(
    `SELECT f.id, f.path, f.name, f.language, f.module, f.is_directory, f.parent_id,
            fo.owner_id, p.full_name as owner_name, p.role as owner_role
     FROM files f
     LEFT JOIN file_ownership fo ON f.id = fo.file_id AND fo.status = 'active'
     LEFT JOIN profiles p ON fo.owner_id = p.id
     WHERE f.project_id = ?
     ORDER BY f.path`,
    [id]
  );

  // Annotate whether current user has edit permission for each file
  const annotatedFiles = await Promise.all(
    filesRes.rows.map(async (file: any) => {
      const check = await canUserEditFile(req.user!.id, req.user!.role, file.id);
      return {
        ...file,
        canEdit: check.allowed,
        editRestrictionReason: check.reason
      };
    })
  );

  res.json({ files: annotatedFiles });
});

apiRouter.get('/files/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const fileRes = await db.query(
    `SELECT f.*, fo.owner_id, p.full_name as owner_name, p.role as owner_role
     FROM files f
     LEFT JOIN file_ownership fo ON f.id = fo.file_id AND fo.status = 'active'
     LEFT JOIN profiles p ON fo.owner_id = p.id
     WHERE f.id = ?`,
    [id]
  );

  if (fileRes.rows.length === 0) return res.status(404).json({ error: 'File not found' });
  const file = fileRes.rows[0];

  const permission = await canUserEditFile(req.user!.id, req.user!.role, id);

  res.json({
    file,
    canEdit: permission.allowed,
    permissionReason: permission.reason
  });
});

// ==========================================
// 3. Controlled File Modification & Pipeline
// ==========================================
apiRouter.post('/files/:id/save', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content, changeSummary } = req.body;
  const user = req.user!;

  // 1. Enforce Server-Side Ownership / Permission Gate
  const check = await canUserEditFile(user.id, user.role, id);
  if (!check.allowed) {
    return res.status(403).json({
      error: 'Permission Denied',
      message: check.reason,
      requiresAccessRequest: true,
      fileOwnerId: check.ownerId
    });
  }

  // 2. Fetch project ID
  const fileRes = await db.query('SELECT project_id, path FROM files WHERE id = ?', [id]);
  if (fileRes.rows.length === 0) return res.status(404).json({ error: 'File not found' });
  const projectId = fileRes.rows[0].project_id;

  try {
    // 3. Process through Change Detection -> AST -> ML -> Notification -> Test Runner Pipeline
    const pipeline = await ChangeDetectionService.processFileChange(
      projectId,
      id,
      user.id,
      content,
      changeSummary
    );

    res.json({
      success: true,
      message: 'File saved and analyzed successfully',
      pipeline
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Pipeline error', message: err.message });
  }
});

// ==========================================
// 4. Access Requests (Controlled Editing)
// ==========================================
apiRouter.post('/access-requests', async (req: Request, res: Response) => {
  const { projectId, fileId, reason } = req.body;
  if (!fileId || !reason) {
    return res.status(400).json({ error: 'fileId and reason are required' });
  }

  try {
    const request = await OwnershipService.createAccessRequest(
      projectId || 'proj_smart_canteen',
      fileId,
      req.user!.id,
      reason
    );
    res.json({ success: true, request });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/projects/:id/access-requests', async (req: Request, res: Response) => {
  const { id } = req.params;
  const requests = await OwnershipService.getAccessRequests(id);
  res.json({ requests });
});

apiRouter.post('/access-requests/:id/decide', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { decision } = req.body; // 'approved' | 'rejected'

  try {
    const result = await OwnershipService.decideAccessRequest(
      id,
      req.user!.id,
      req.user!.role,
      decision
    );
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// ==========================================
// 5. Dependency Graph Visualizer
// ==========================================
apiRouter.get('/projects/:id/dependencies', async (req: Request, res: Response) => {
  const { id } = req.params;
  const graphData = await dependencyService.getVisualizerGraph(id);
  res.json(graphData);
});

apiRouter.post('/projects/:id/dependencies/reindex', async (req: Request, res: Response) => {
  const { id } = req.params;
  await dependencyService.loadProjectGraph(id);
  const graphData = await dependencyService.getVisualizerGraph(id);
  res.json({ success: true, message: 'Project dependency graph re-indexed', graphData });
});

// ==========================================
// 6. Test Runner & Results
// ==========================================
apiRouter.post('/projects/:id/tests/run', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { targetFilePath } = req.body;

  try {
    const runResult = await TestRunnerService.runRelevantTests(
      id,
      'manual_run',
      req.user!.id,
      targetFilePath || 'backend/authService.ts'
    );
    res.json(runResult);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/projects/:id/tests/history', async (req: Request, res: Response) => {
  const { id } = req.params;
  const runsRes = await db.query(
    `SELECT tr.*, p.full_name as triggered_by_name
     FROM test_runs tr
     JOIN profiles p ON tr.triggered_by = p.id
     WHERE tr.project_id = ?
     ORDER BY tr.created_at DESC LIMIT 10`,
    [id]
  );

  const resultsRes = await db.query(
    `SELECT * FROM test_results
     WHERE test_run_id IN (SELECT id FROM test_runs WHERE project_id = ? ORDER BY created_at DESC LIMIT 10)`,
    [id]
  );

  res.json({ runs: runsRes.rows, results: resultsRes.rows });
});

// ==========================================
// 7. Contextual AI Assistant
// ==========================================
apiRouter.post('/ai/analyze', async (req: Request, res: Response) => {
  const { projectId, currentFilePath, diffContent, testResults, mlImpacts } = req.body;

  try {
    const analysis = await ContextualAIService.analyzeContext({
      projectId: projectId || 'proj_smart_canteen',
      userId: req.user!.id,
      userRole: req.user!.role,
      currentFilePath: currentFilePath || 'backend/authService.ts',
      diffContent,
      testResults,
      mlImpacts
    });

    // Save AI session message
    const sessId = `ais_${Date.now()}`;
    await db.query(
      `INSERT INTO ai_sessions (id, project_id, user_id, context_file_id) VALUES (?, ?, ?, ?)`,
      [sessId, projectId || 'proj_smart_canteen', req.user!.id, null]
    );

    const msgId = `aim_${Date.now()}`;
    await db.query(
      `INSERT INTO ai_messages (id, session_id, role, content, fix_suggestion) VALUES (?, ?, 'assistant', ?, ?)`,
      [msgId, sessId, analysis.explanation, analysis.fixSuggestion ? JSON.stringify(analysis.fixSuggestion) : null]
    );

    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. Notifications
// ==========================================
apiRouter.get('/notifications', async (req: Request, res: Response) => {
  const notifs = await db.query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 25',
    [req.user!.id]
  );
  res.json({ notifications: notifs.rows });
});

apiRouter.post('/notifications/:id/read', async (req: Request, res: Response) => {
  const { id } = req.params;
  await db.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, req.user!.id]);
  res.json({ success: true });
});

// ==========================================
// 9. Documents & Traceability Links
// ==========================================
apiRouter.get('/projects/:id/documents', async (req: Request, res: Response) => {
  const { id } = req.params;
  const docsRes = await db.query('SELECT * FROM documents WHERE project_id = ?', [id]);
  const linksRes = await db.query(
    `SELECT dl.*, d.title as doc_title, f.path as file_path, f.name as file_name
     FROM document_links dl
     JOIN documents d ON dl.document_id = d.id
     JOIN files f ON dl.target_file_id = f.id
     WHERE dl.project_id = ?`,
    [id]
  );

  res.json({ documents: docsRes.rows, links: linksRes.rows });
});

// ==========================================
// 10. Audit Logs & Activity Trail
// ==========================================
apiRouter.get('/projects/:id/audit-logs', async (req: Request, res: Response) => {
  const { id } = req.params;
  const auditRes = await db.query(
    `SELECT a.*, p.full_name as user_name, p.role as user_role
     FROM audit_logs a
     JOIN profiles p ON a.user_id = p.id
     WHERE a.project_id = ?
     ORDER BY a.created_at DESC LIMIT 50`,
    [id]
  );
  res.json({ auditLogs: auditRes.rows });
});

// ==========================================
// 11. Git Integration
// ==========================================
apiRouter.post('/git/commit', async (req: Request, res: Response) => {
  const { projectId, message, branch } = req.body;
  const hash = `git_${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 6)}`;
  const user = req.user!;

  await db.query(
    `INSERT INTO github_commits (id, project_id, commit_hash, message, author_name, author_email, branch)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      `cm_${Date.now()}`,
      projectId || 'proj_smart_canteen',
      hash,
      message || 'Update module implementation and test compliance',
      user.fullName,
      user.email,
      branch || 'main'
    ]
  );

  await AuditService.logAudit(projectId || 'proj_smart_canteen', user.id, 'GIT_COMMIT_CREATED', {
    commitHash: hash,
    message,
    branch: branch || 'main'
  });

  res.json({ success: true, commitHash: hash, message });
});
