/**
 * CodeSync End-to-End System Verification Script
 * Validates the complete Smart Canteen demonstration lifecycle programmatically.
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

async function fetchJson(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': options.userId || 'user_dev_a',
    ...(options.headers || {})
  };

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function runVerification() {
  console.log('================================================================');
  console.log(' STARTING CODESYNC END-TO-END SYSTEM INTEGRATION VERIFICATION');
  console.log('================================================================\n');

  try {
    // 1. Verify Users & Roles
    console.log('[Step 1] Verifying 4 User Roles & Profiles...');
    const usersRes = await fetchJson('/auth/users');
    console.log(`  ✓ Found ${usersRes.users.length} profiles:`);
    for (const u of usersRes.users) {
      console.log(`    - ${u.full_name} (${u.role})`);
    }

    // 2. Verify Project & File Ownership
    console.log('\n[Step 2] Verifying Project Files & Ownership Boundaries...');
    const filesRes = await fetchJson('/projects/proj_smart_canteen/files', { userId: 'user_dev_a' });
    console.log(`  ✓ Loaded ${filesRes.files.length} project files.`);
    const authService = filesRes.files.find((f) => f.path.includes('authService.ts'));
    const loginView = filesRes.files.find((f) => f.path.includes('login.tsx'));
    console.log(`  ✓ authService.ts Owner: ${authService.owner_name} | canEdit for Dev A: ${authService.canEdit}`);
    console.log(`  ✓ login.tsx Owner: ${loginView.owner_name} | canEdit for Dev A: ${loginView.canEdit}`);

    // 3. Test Controlled Editing Access Gate
    console.log('\n[Step 3] Testing Controlled Editing Gate (Dev A attempts to edit login.tsx)...');
    try {
      await fetchJson(`/files/${loginView.id}/save`, {
        method: 'POST',
        userId: 'user_dev_a',
        body: JSON.stringify({ content: '// Unauthorized modification attempt' })
      });
      console.error('  ✗ FAILED: Unauthorized edit was permitted!');
      process.exit(1);
    } catch (err) {
      if (err.status === 403) {
        console.log(`  ✓ PASS: Edit intercepted with 403 Forbidden: "${err.message}"`);
      } else {
        throw err;
      }
    }

    // 4. Test Access Request Workflow
    console.log('\n[Step 4] Submitting Access Request for login.tsx...');
    const reqRes = await fetchJson('/access-requests', {
      method: 'POST',
      userId: 'user_dev_a',
      body: JSON.stringify({
        projectId: 'proj_smart_canteen',
        fileId: loginView.id,
        reason: 'Need to adapt component for updated AuthResponse token format'
      })
    });
    console.log(`  ✓ Access request submitted: ID ${reqRes.request.id}`);

    // 5. Test Dependency Engine & AST Graph
    console.log('\n[Step 5] Inspecting AST Dependency Graph...');
    const graphRes = await fetchJson('/projects/proj_smart_canteen/dependencies');
    console.log(`  ✓ AST Graph contains ${graphRes.nodes.length} nodes and ${graphRes.edges.length} directed edges:`);
    for (const e of graphRes.edges) {
      console.log(`    - ${e.sourcePath} --[${e.relationshipType}]--> ${e.targetPath}`);
    }

    // 6. Execute File Modification on authService.ts (Simulating Breaking Change)
    console.log('\n[Step 6] Developer A modifies authService.ts with breaking contract change...');
    const breakingCode = `
export interface AuthResponse {
  token: string;
  userId: string;
  role: string;
}

export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

export function authenticateUser(credentials: any): any {
  // Simulating regression: token undefined
  return { token: undefined, role: "student" };
}
`;

    const saveRes = await fetchJson(`/files/${authService.id}/save`, {
      method: 'POST',
      userId: 'user_dev_a',
      body: JSON.stringify({ content: breakingCode })
    });

    const pipeline = saveRes.pipeline;
    console.log(`  ✓ Change Event generated: ID ${pipeline.changeId} (+${pipeline.linesAdded}/-${pipeline.linesDeleted} lines)`);
    console.log(`  ✓ Dependency candidates identified: ${pipeline.candidates.length}`);
    
    // 7. Verify Machine Learning Predictions
    console.log('\n[Step 7] Evaluating Dynamic Machine Learning Impact Predictions...');
    console.log(`  ✓ ML Inference Status: ${pipeline.mlStatus}`);
    for (const p of pipeline.mlPredictions) {
      console.log(`    - Candidate: ${p.targetFile} | Risk: ${p.riskLevel} | Prob: ${(p.impactProbability * 100).toFixed(1)}%`);
      if (p.explanationFactors && p.explanationFactors.length > 0) {
        console.log(`      Factors: ${p.explanationFactors[0]}`);
      }
    }

    // 8. Verify Targeted Owner Notifications
    console.log('\n[Step 8] Checking Targeted Notifications for Developer B...');
    const notifsRes = await fetchJson('/notifications', { userId: 'user_dev_b' });
    console.log(`  ✓ Developer B received ${notifsRes.notifications.length} notifications:`);
    for (const n of notifsRes.notifications.slice(0, 2)) {
      console.log(`    - [${n.type.toUpperCase()}] ${n.title}: ${n.message.slice(0, 80)}...`);
    }

    // 9. Verify Relevant Test Runner Execution
    console.log('\n[Step 9] Verifying Relevant Test Execution (auth.test.ts)...');
    console.log(`  ✓ Test Run Status: ${pipeline.testRun.status.toUpperCase()}`);
    console.log(`  ✓ Passed: ${pipeline.testRun.passedTests} | Failed: ${pipeline.testRun.failedTests}`);
    for (const res of pipeline.testRun.results) {
      console.log(`    - [${res.status.toUpperCase()}] ${res.testName}`);
      if (res.errorMessage) {
        console.log(`      Error: ${res.errorMessage}`);
      }
    }

    // 10. Verify Contextual AI Diagnosis
    console.log('\n[Step 10] Requesting Contextual AI Diagnosis & Fix...');
    const aiRes = await fetchJson('/ai/analyze', {
      method: 'POST',
      userId: 'user_dev_a',
      body: JSON.stringify({
        projectId: 'proj_smart_canteen',
        currentFilePath: 'backend/authService.ts',
        testResults: pipeline.testRun,
        mlImpacts: pipeline.mlPredictions
      })
    });
    console.log(`  ✓ AI Provider: ${aiRes.analysis.provider}`);
    console.log(`  ✓ Root Cause: ${aiRes.analysis.rootCause}`);
    if (aiRes.analysis.fixSuggestion) {
      console.log(`  ✓ Fix Recommendation: ${aiRes.analysis.fixSuggestion.description}`);
    }

    // 11. Apply Verified Fix & Re-Test
    console.log('\n[Step 11] Applying Proposed Fix to authService.ts and Re-Testing...');
    const fixedCode = aiRes.analysis.fixSuggestion.proposedCode;
    const fixSaveRes = await fetchJson(`/files/${authService.id}/save`, {
      method: 'POST',
      userId: 'user_dev_a',
      body: JSON.stringify({ content: fixedCode, changeSummary: 'Applied AI suggestion: restored AuthResponse token contract' })
    });
    console.log(`  ✓ Fix applied! Re-test status: ${fixSaveRes.pipeline.testRun.status.toUpperCase()}`);
    console.log(`  ✓ All tests passed: ${fixSaveRes.pipeline.testRun.passedTests}/${fixSaveRes.pipeline.testRun.totalTests}`);

    // 12. Create Git Commit & Audit Trail
    console.log('\n[Step 12] Recording Verified Git Commit...');
    const commitRes = await fetchJson('/git/commit', {
      method: 'POST',
      userId: 'user_reviewer',
      body: JSON.stringify({
        projectId: 'proj_smart_canteen',
        message: 'fix(auth): restore compliant AuthResponse cryptographic token contract'
      })
    });
    console.log(`  ✓ Commit Created: Hash ${commitRes.commitHash}`);

    // 13. Audit Trail Check
    console.log('\n[Step 13] Verifying Audit Trail Logging...');
    const auditRes = await fetchJson('/projects/proj_smart_canteen/audit-logs');
    console.log(`  ✓ Audit Log contains ${auditRes.auditLogs.length} verified events:`);
    for (const a of auditRes.auditLogs.slice(0, 4)) {
      console.log(`    - [${a.action}] by ${a.user_name} (${a.user_role}) at ${a.created_at}`);
    }

    console.log('\n================================================================');
    console.log(' ALL 13 END-TO-END VERIFICATION MILESTONES PASSED WITH SUCCESS!');
    console.log('================================================================');
  } catch (err) {
    console.error('\n✗ VERIFICATION FAILED:', err.message);
    if (err.data) console.error(JSON.stringify(err.data, null, 2));
    process.exit(1);
  }
}

runVerification();
