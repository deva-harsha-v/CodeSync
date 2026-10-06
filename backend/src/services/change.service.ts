import { db } from '../config/database';
import { dependencyService } from './dependency.service';
import { MLInferenceService, MLPredictionResult } from './ml.service';
import { TestRunnerService, TestExecutionResult } from './test-runner.service';
import { AuditService } from './audit.service';

export interface ChangeProcessResult {
  changeId: string;
  linesAdded: number;
  linesDeleted: number;
  functionsChanged: string[];
  candidates: any[];
  mlStatus: 'success' | 'unavailable';
  mlPredictions: MLPredictionResult[];
  testRun: TestExecutionResult;
  notificationsCreated: number;
}

export class ChangeDetectionService {
  /**
   * Processes a file modification through the full CodeSync pipeline:
   * Change Detection -> AST Dependency Engine -> Candidate Files -> ML Model -> Notifications -> Relevant Tests
   */
  public static async processFileChange(
    projectId: string,
    fileId: string,
    userId: string,
    newContent: string,
    changeSummary?: string
  ): Promise<ChangeProcessResult> {
    // 1. Fetch existing file state
    const fileRes = await db.query(
      'SELECT id, path, name, content, owner_id FROM files WHERE id = ?',
      [fileId]
    );

    if (fileRes.rows.length === 0) {
      throw new Error(`File ${fileId} not found`);
    }

    const file = fileRes.rows[0];
    const oldContent = file.content || '';

    // Calculate diff metrics
    const safeNewContent = newContent || '';
    const oldLines = oldContent.split('\n');
    const newLines = safeNewContent.split('\n');
    const linesAdded = Math.max(0, newLines.length - oldLines.length + 1);
    const linesDeleted = Math.max(0, oldLines.length - newLines.length);

    // Extract function changes
    const funcRegex = /function\s+([a-zA-Z0-9_]+)/g;
    const oldFuncs = new Set<string>();
    const newFuncs = new Set<string>();

    let match;
    while ((match = funcRegex.exec(oldContent)) !== null) oldFuncs.add(match[1]);
    while ((match = funcRegex.exec(safeNewContent)) !== null) newFuncs.add(match[1]);

    const functionsChanged: string[] = [];
    for (const nf of newFuncs) {
      if (!oldFuncs.has(nf)) functionsChanged.push(nf);
    }
    if (functionsChanged.length === 0 && newFuncs.size > 0) {
      // modified existing function
      functionsChanged.push(Array.from(newFuncs)[0]);
    }

    // 2. Persist updated file content
    await db.query(
      'UPDATE files SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newContent, fileId]
    );

    // Record file version
    const versionRes = await db.query('SELECT COUNT(*) as count FROM file_versions WHERE file_id = ?', [fileId]);
    const nextVer = (versionRes.rows[0]?.count || 0) + 1;
    const verId = `fv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.query(
      `INSERT INTO file_versions (id, file_id, version_number, content, changed_by, change_summary)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [verId, fileId, nextVer, newContent, userId, changeSummary || 'Modified via collaborative editor']
    );

    // 3. Record change event
    const changeId = `chg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const diffSample = `@@ -1,${oldLines.length} +1,${newLines.length} @@`;
    await db.query(
      `INSERT INTO changes (id, project_id, user_id, file_id, change_type, lines_added, lines_deleted, functions_changed, diff_content)
       VALUES (?, ?, ?, ?, 'modify', ?, ?, ?, ?)`,
      [
        changeId,
        projectId,
        userId,
        fileId,
        linesAdded,
        linesDeleted,
        JSON.stringify(functionsChanged),
        diffSample
      ]
    );

    // 4. Run AST Dependency Engine (re-indexing and candidate identification)
    const { edges, candidates } = await dependencyService.analyzeAndSyncFile(
      projectId,
      fileId,
      file.path,
      newContent
    );

    // 5. Run ML Model Inference
    const mlResult = await MLInferenceService.predictImpact(
      projectId,
      changeId,
      file.path,
      fileId,
      candidates,
      {
        linesAdded,
        linesDeleted,
        functionsChanged
      }
    );

    // 6. Generate Contextual Notifications for Artifact Owners
    let notificationsCreated = 0;
    const fileOwners = await db.query(
      `SELECT f.id, f.path, fo.owner_id
       FROM files f
       JOIN file_ownership fo ON f.id = fo.file_id AND fo.status = 'active'
       WHERE f.project_id = ?`,
      [projectId]
    );

    const ownerMap = new Map<string, string>();
    for (const fo of fileOwners.rows) {
      ownerMap.set(fo.path.replace(/\\/g, '/'), fo.owner_id);
    }

    for (const pred of mlResult.predictions) {
      if (pred.riskLevel === 'HIGH' || pred.riskLevel === 'MEDIUM') {
        const targetOwnerId = ownerMap.get(pred.targetFile.replace(/\\/g, '/'));
        if (targetOwnerId && targetOwnerId !== userId) {
          const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const percentageStr = `${Math.round(pred.impactProbability * 100)}%`;
          await db.query(
            `INSERT INTO notifications (id, project_id, user_id, title, message, type, metadata)
             VALUES (?, ?, ?, ?, ?, 'impact', ?)`,
            [
              notifId,
              projectId,
              targetOwnerId,
              `Impact Alert: ${pred.riskLevel} Risk on Owned Artifact`,
              `${file.name} was modified by another developer. ML predicts ${percentageStr} impact probability on your module: ${pred.targetFile}.`,
              JSON.stringify({
                changeId,
                sourceFile: file.path,
                targetFile: pred.targetFile,
                riskLevel: pred.riskLevel,
                probability: pred.impactProbability,
                explanations: pred.explanationFactors
              })
            ]
          );
          notificationsCreated++;
        }
      }
    }

    // 7. Execute Relevant Tests
    const testRun = await TestRunnerService.runRelevantTests(
      projectId,
      changeId,
      userId,
      file.path
    );

    await AuditService.logAudit(projectId, userId, 'FILE_MODIFIED', {
      fileId,
      filePath: file.path,
      changeId,
      linesAdded,
      linesDeleted,
      mlPredictionsCount: mlResult.predictions.length,
      testStatus: testRun.status
    });

    return {
      changeId,
      linesAdded,
      linesDeleted,
      functionsChanged,
      candidates,
      mlStatus: mlResult.status,
      mlPredictions: mlResult.predictions,
      testRun,
      notificationsCreated
    };
  }
}
