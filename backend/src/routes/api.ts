import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { ENV } from '../config/env';
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

// User Registration
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  const { email, password, fullName, role } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }

  const existing = await db.query('SELECT id FROM profiles WHERE email = ?', [email]);
  if (existing.rows.length > 0) {
    return res.status(400).json({ error: 'A user with this email already exists' });
  }

  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const userRole = role && ['Admin', 'Developer', 'Reviewer', 'Viewer'].includes(role) ? role : 'Developer';
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`;

  await db.query(
    `INSERT INTO profiles (id, email, password_hash, full_name, role, avatar_url)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, email, password, fullName, userRole, avatarUrl]
  );

  const token = jwt.sign(
    { id: userId, email, role: userRole, fullName },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );

  await AuditService.logAudit('proj_smart_canteen', userId, 'REGISTER', { email, role: userRole });

  res.status(201).json({
    success: true,
    token,
    user: { id: userId, email, full_name: fullName, role: userRole, avatar_url: avatarUrl }
  });
});

// User Login (Authenticates via password and returns JWT session token)
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const result = await db.query(
    'SELECT id, email, password_hash, full_name, role, avatar_url FROM profiles WHERE email = ?',
    [email]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const user = result.rows[0];
  // Verify password (matches saved password_hash or default demo password 'password123')
  if (user.password_hash !== password && password !== 'password123') {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, fullName: user.full_name },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );

  await AuditService.logAudit('proj_smart_canteen', user.id, 'LOGIN', { email: user.email, role: user.role });

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      avatar_url: user.avatar_url
    }
  });
});

// User Logout
apiRouter.post('/auth/logout', async (req: Request, res: Response) => {
  if (req.user) {
    await AuditService.logAudit('proj_smart_canteen', req.user.id, 'LOGOUT', {});
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

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

apiRouter.post('/access-requests/:id/revoke', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await db.query(
      "UPDATE access_requests SET status = 'revoked', decided_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );
    await AuditService.logAudit('proj_smart_canteen', req.user!.id, 'ACCESS_REVOKED', { requestId: id });
    res.json({ success: true, message: 'Access request revoked' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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

apiRouter.post('/documents/:id/verify', async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  try {
    await db.query(
      "UPDATE documents SET verified = 1, status = 'Verified', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );
    await AuditService.logAudit('proj_smart_canteen', user.id, 'DOCUMENT_VERIFIED', { documentId: id });
    res.json({ success: true, message: 'Document verified' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/documents/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const user = req.user!;
  try {
    await db.query(
      "UPDATE documents SET status = ?, verified = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, status === 'Verified' ? 1 : 0, id]
    );
    await AuditService.logAudit('proj_smart_canteen', user.id, 'DOCUMENT_STATUS_UPDATED', { documentId: id, status });
    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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

apiRouter.get('/projects/:id/activity', async (req: Request, res: Response) => {
  const { id } = req.params;
  const actRes = await db.query(
    `SELECT act.*, p.full_name as user_name, p.role as user_role
     FROM activity_logs act
     JOIN profiles p ON act.user_id = p.id
     WHERE act.project_id = ?
     ORDER BY act.created_at DESC LIMIT 50`,
    [id]
  );
  res.json({ activities: actRes.rows });
});

// ==========================================
// 11. Git Integration
// ==========================================
apiRouter.get('/git/history', async (req: Request, res: Response) => {
  const commits = await db.query(
    'SELECT * FROM github_commits ORDER BY created_at DESC LIMIT 20'
  );
  res.json({ commits: commits.rows });
});

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
