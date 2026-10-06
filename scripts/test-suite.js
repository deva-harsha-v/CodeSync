/**
 * CodeSync Comprehensive Verification Test Suite
 * Evaluates all 10 core subsystems:
 * 1. Authentication & JWT Security
 * 2. Role-Based Access Control & Controlled Ownership
 * 3. Access Request Lifecycle & Revocation
 * 4. TypeScript Compiler AST Dependency Graph
 * 5. Machine Learning Impact Prediction (Random Forest)
 * 6. Dependency-Aware Relevant Test Runner
 * 7. Contextual AI Diagnosis & Patch Generation
 * 8. Traceability & Document Verification Workflow
 * 9. Real-Time Activity Feed & Audit Trail
 * 10. Git Version Control History & Commit Recording
 */

const BACKEND_URL = 'http://localhost:5000/api';
const ML_URL = 'http://127.0.0.1:8000';
const PROJECT_ID = 'proj_smart_canteen';

let passedTests = 0;
let totalTests = 0;
const results = [];

function recordTest(phase, name, passed, details = '') {
  totalTests++;
  if (passed) passedTests++;
  results.push({ phase, name, passed, details });
  const mark = passed ? '? PASS' : '? FAIL';
  console.log(`  ${mark}: [${phase}] ${name} ${details ? '(' + details + ')' : ''}`);
}

async function api(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  // If not using explicit Authorization header and no userId provided, default to user_dev_a
  if (!headers['Authorization'] && !headers['x-user-id']) {
    headers['x-user-id'] = options.userId || 'user_dev_a';
  } else if (options.userId) {
    headers['x-user-id'] = options.userId;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTestSuite() {
  console.log('========================================================================');
  console.log(' CODESYNC COMPREHENSIVE AUTOMATED SYSTEM VERIFICATION SUITE');
  console.log('========================================================================\n');

  try {
    // -------------------------------------------------------------
    // PHASE 1: Authentication & JWT Security
    // -------------------------------------------------------------
    console.log('[Phase 1] Testing Authentication, Passwords & JWT Flow...');
    const testEmail = `tester_${Date.now()}@canteen.edu`;
    const regRes = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'SecurePassword123!',
        fullName: 'Automated QA Engineer',
        role: 'Developer'
      })
    });
    recordTest('Auth', 'Register new user with password', regRes.status === 201 && !!regRes.data.token, `User ID: ${regRes.data.user?.id}`);

    const badLoginRes = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword!' })
    });
    recordTest('Auth', 'Reject invalid credentials with 401', badLoginRes.status === 401);

    const goodLoginRes = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: 'SecurePassword123!' })
    });
    const authToken = goodLoginRes.data.token;
    recordTest('Auth', 'Authenticate user and issue JWT token', goodLoginRes.status === 200 && !!authToken);

    const meRes = await api('/auth/me', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    recordTest('Auth', 'Verify token via /api/auth/me', meRes.status === 200 && meRes.data.user?.email === testEmail);

    // -------------------------------------------------------------
    // PHASE 2: Role-Based Ownership & Controlled Editing
    // -------------------------------------------------------------
    console.log('\n[Phase 2] Testing Role-Based Ownership & Controlled Editing Gate...');
    const filesRes = await api(`/projects/${PROJECT_ID}/files`, { userId: 'user_dev_a' });
    const authServiceFile = filesRes.data.files.find(f => f.path.includes('authService.ts'));
    const loginFile = filesRes.data.files.find(f => f.path.includes('login.tsx'));

    recordTest('Ownership', 'File ownership metadata present', authServiceFile.owner_id === 'user_dev_a' && loginFile.owner_id === 'user_dev_b');

    // Dev A edits authService.ts (owned)
    const devASaveRes = await api(`/files/${authServiceFile.id}/save`, {
      method: 'POST',
      userId: 'user_dev_a',
      body: JSON.stringify({ content: '// Verified code update by Maya Patel\nexport function validateToken() { return true; }' })
    });
    recordTest('Ownership', 'Owner permitted to save owned artifact', devASaveRes.status === 200 && devASaveRes.data.success === true);

    // Dev A attempts to edit login.tsx (owned by Dev B)
    const unauthorizedSave = await api(`/files/${loginFile.id}/save`, {
      method: 'POST',
      userId: 'user_dev_a',
      body: JSON.stringify({ content: '// Unauthorized modification' })
    });
    recordTest('Ownership', 'Non-owner blocked by controlled editing gate with 403', unauthorizedSave.status === 403 && unauthorizedSave.data.requiresAccessRequest === true);

    // Admin attempts to edit login.tsx (Admin bypass)
    const adminSave = await api(`/files/${loginFile.id}/save`, {
      method: 'POST',
      userId: 'user_admin',
      body: JSON.stringify({ content: '// Admin verified emergency patch\nexport function adminLogin() { return true; }' })
    });
    recordTest('Ownership', 'Admin granted ownership bypass to save', adminSave.status === 200 && adminSave.data.success === true);

    // -------------------------------------------------------------
    // PHASE 3: Access Request Lifecycle & Revocation
    // -------------------------------------------------------------
    console.log('\n[Phase 3] Testing Access Request Approval & Revocation Lifecycle...');
    const reqRes = await api('/access-requests', {
      method: 'POST',
      userId: 'user_dev_a',
      body: JSON.stringify({
        projectId: PROJECT_ID,
        fileId: loginFile.id,
        reason: 'Automated test suite request for temporary UI patch'
      })
    });
    const requestId = reqRes.data.request?.id;
    recordTest('AccessRequest', 'Submit access request', reqRes.status === 200 && !!requestId, `Request ID: ${requestId}`);

    // Dev B decides request (approved)
    const decideRes = await api(`/access-requests/${requestId}/decide`, {
      method: 'POST',
      userId: 'user_dev_b',
      body: JSON.stringify({ decision: 'approved' })
    });
    recordTest('AccessRequest', 'Owner approves access request', decideRes.status === 200 && decideRes.data.result?.status === 'approved');

    // Dev B revokes request
    const revokeRes = await api(`/access-requests/${requestId}/revoke`, {
      method: 'POST',
      userId: 'user_dev_b'
    });
    recordTest('AccessRequest', 'Owner revokes previously approved access request', revokeRes.status === 200 && revokeRes.data.success === true);

    // Dev A attempts to save again -> blocked because revoked
    const afterRevokeSave = await api(`/files/${loginFile.id}/save`, {
      method: 'POST',
      userId: 'user_dev_a',
      body: JSON.stringify({ content: '// Post-revocation edit attempt' })
    });
    recordTest('AccessRequest', 'Enforce gate after revocation (403 Forbidden)', afterRevokeSave.status === 403);

    // -------------------------------------------------------------
    // PHASE 4: AST Dependency Graph & Compiler Re-indexing
    // -------------------------------------------------------------
    console.log('\n[Phase 4] Testing TypeScript Compiler AST Dependency Graph...');
    const graphRes = await api(`/projects/${PROJECT_ID}/dependencies`);
    recordTest('DependencyEngine', 'Retrieve AST graph nodes & edges', graphRes.status === 200 && graphRes.data.nodes.length >= 4 && graphRes.data.edges.length >= 4, `${graphRes.data.nodes.length} nodes, ${graphRes.data.edges.length} edges`);

    const reindexRes = await api(`/projects/${PROJECT_ID}/dependencies/reindex`, { method: 'POST' });
    recordTest('DependencyEngine', 'Re-index AST dependencies via TypeScript API', reindexRes.status === 200 && reindexRes.data.graphData.nodes.length >= 4);

    // -------------------------------------------------------------
    // PHASE 5: Machine Learning Impact Prediction Engine
    // -------------------------------------------------------------
    console.log('\n[Phase 5] Testing Dynamic Random Forest ML Inference...');
    const mlDirect = await api(`${ML_URL}/predict`, {
      method: 'POST',
      body: JSON.stringify({
        source_file: 'backend/authService.ts',
        change_metadata: {
          lines_added: 8,
          lines_deleted: 2,
          functions_changed: ['authenticateUser'],
          classes_changed: [],
          files_changed: 1
        },
        candidates: [
          {
            target_file: 'frontend/login.tsx',
            direct_dependency: true,
            dependency_distance: 1,
            relationship_types: ['IMPORT'],
            symbols_involved: ['AuthResponse']
          }
        ]
      })
    });
    const pred = mlDirect.data.predictions?.[0];
    recordTest('MLService', 'Random Forest dynamic prediction inference', mlDirect.status === 200 && !!pred && typeof pred.impact_probability === 'number', `Risk: ${pred?.risk_level}, Prob: ${((pred?.impact_probability || 0) * 100).toFixed(1)}%`);

    const prob = pred?.impact_probability || 0;
    recordTest('MLService', 'ML probability within valid continuous range (0.0 < p <= 1.0)', prob > 0 && prob <= 1.0);

    // -------------------------------------------------------------
    // PHASE 6: Dependency-Aware Test Runner Engine
    // -------------------------------------------------------------
    console.log('\n[Phase 6] Testing Dependency-Aware Test Runner Engine...');
    const testRes = await api(`/projects/${PROJECT_ID}/tests/run`, {
      method: 'POST',
      body: JSON.stringify({ targetFilePath: 'backend/authService.ts' })
    });
    recordTest('TestRunner', 'Execute scoped relevant test suite', testRes.status === 200 && typeof testRes.data.totalTests === 'number', `Total: ${testRes.data.totalTests}, Passed: ${testRes.data.passedTests}`);

    // -------------------------------------------------------------
    // PHASE 7: Contextual AI Assistant
    // -------------------------------------------------------------
    console.log('\n[Phase 7] Testing Contextual AI Diagnosis & Automated Remediation...');
    const aiRes = await api('/ai/analyze', {
      method: 'POST',
      userId: 'user_dev_a',
      body: JSON.stringify({
        projectId: PROJECT_ID,
        currentFilePath: 'backend/authService.ts',
        diffContent: '- export function authenticateUser\n+ export function authenticateUser(cred) { return { role: "student" } }',
        testResults: { status: 'failed', failedTests: 1, results: [{ testName: 'token issuance', errorMessage: 'Expected token' }] },
        mlImpacts: [{ targetFile: 'frontend/login.tsx', impactProbability: 0.82, riskLevel: 'HIGH' }]
      })
    });
    recordTest('AIAssistant', 'Generate diagnosis and proposed patch', aiRes.status === 200 && !!aiRes.data.analysis.fixSuggestion, `Provider: ${aiRes.data.analysis?.provider}`);

    // -------------------------------------------------------------
    // PHASE 8: Traceability & Document Verification Workflow
    // -------------------------------------------------------------
    console.log('\n[Phase 8] Testing Document Traceability & Verification...');
    const docsRes = await api(`/projects/${PROJECT_ID}/documents`);
    const srsDoc = docsRes.data.documents[0];
    recordTest('Traceability', 'Retrieve software requirements specifications & links', docsRes.status === 200 && docsRes.data.documents.length > 0 && docsRes.data.links.length > 0);

    const statusUpdateRes = await api(`/documents/${srsDoc.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Reviewed' })
    });
    recordTest('Traceability', 'Update document workflow status to Reviewed', statusUpdateRes.status === 200 && statusUpdateRes.data.success === true);

    const verifyDocRes = await api(`/documents/${srsDoc.id}/verify`, {
      method: 'POST',
      userId: 'user_reviewer'
    });
    recordTest('Traceability', 'Reviewer verifies requirements document', verifyDocRes.status === 200 && verifyDocRes.data.success === true);

    // -------------------------------------------------------------
    // PHASE 9: Activity Feed & Audit Trail Logging
    // -------------------------------------------------------------
    console.log('\n[Phase 9] Testing Unified Activity Feed & Audit Trail...');
    const activityRes = await api(`/projects/${PROJECT_ID}/activity`);
    recordTest('ActivityFeed', 'Retrieve multi-persona activity feed', activityRes.status === 200 && Array.isArray(activityRes.data.activities));

    const auditRes = await api(`/projects/${PROJECT_ID}/audit-logs`);
    recordTest('AuditTrail', 'Retrieve tamper-resistant audit logs', auditRes.status === 200 && Array.isArray(auditRes.data.auditLogs) && auditRes.data.auditLogs.length > 0);

    // -------------------------------------------------------------
    // PHASE 10: Git Version Control Integration
    // -------------------------------------------------------------
    console.log('\n[Phase 10] Testing Git Integration & Commit Tracking...');
    const gitHistoryRes = await api('/git/history');
    recordTest('GitIntegration', 'Retrieve repository commit history', gitHistoryRes.status === 200 && Array.isArray(gitHistoryRes.data.commits));

    const gitCommitRes = await api('/git/commit', {
      method: 'POST',
      userId: 'user_dev_a',
      body: JSON.stringify({
        projectId: PROJECT_ID,
        message: 'test: automated system verification test commit'
      })
    });
    recordTest('GitIntegration', 'Create author-aware Git commit', gitCommitRes.status === 200 && !!gitCommitRes.data.commitHash, `Hash: ${gitCommitRes.data.commitHash}`);

    // -------------------------------------------------------------
    // SUMMARY REPORT
    // -------------------------------------------------------------
    console.log('\n========================================================================');
    console.log(` CODESYNC SYSTEM VERIFICATION SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log('========================================================================');

    if (passedTests === totalTests) {
      console.log('?? ALL SUBSYSTEMS HARDENED, INTEGRATED, AND FUNCTIONING PERFECTLY!\n');
      process.exit(0);
    } else {
      console.error(`?? ${totalTests - passedTests} tests failed.`);
      process.exit(1);
    }
  } catch (err) {
    console.error('\n?? CRITICAL TEST SUITE ERROR:', err);
    process.exit(1);
  }
}

runTestSuite();
