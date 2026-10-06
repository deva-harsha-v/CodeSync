# CodeSync: Testing & Verification Guide

This document describes all automated and manual verification procedures for CodeSync.

---

## 1. Automated System Test Suite

CodeSync includes a comprehensive automated test runner validating all 10 core architectural subsystems:

```bash
# Execute 25-point comprehensive verification suite
node scripts/test-suite.js
```

### Verified Subsystems:
1. **Authentication & JWT Security**: User registration, password verification, 401 rejection on bad credentials, JWT generation, and token inspection via `/api/auth/me`.
2. **Role-Based Ownership & Controlled Editing**: Verification of module ownership metadata, permission checks for owned artifacts, 403 Forbidden intercept on non-owned files, and Admin bypass.
3. **Access Request Lifecycle & Revocation**: Submission of edit requests, owner approval, and complete revocation cycle preventing post-revocation saves.
4. **AST Dependency Graph & Compiler Re-Indexing**: Verification of nodes and directed edges extracted by the TypeScript Compiler API, plus live re-indexing.
5. **Dynamic Machine Learning Risk Prediction**: FastAPI `/predict` inference using Random Forest model, continuous probability scoring ($0.0 < P \le 1.0$), and categorical risk classification.
6. **Dependency-Aware Test Runner Engine**: Automatic selection and execution of relevant tests based on AST dependency closure.
7. **Contextual AI Diagnosis & Patch Generation**: Root-cause analysis and diff generation incorporating test failures and ML risk scores.
8. **Traceability & Document Verification Workflow**: Software requirements matrix, status update to `Reviewed`, and reviewer verification signature.
9. **Unified Activity Feed & Audit Trail**: Real-time event tracking and immutable audit log verification.
10. **Git Version Control Integration**: Commit history retrieval and author-aware Git commit generation.

---

## 2. Smart Canteen End-to-End Demonstration Script

To simulate the complete demonstration walkthrough programmatically:

```bash
node scripts/verify-system.js
```

### 13 Walkthrough Milestones:
- Milestone 1: Verify 5 user profiles and role hierarchy.
- Milestone 2: Check Smart Canteen project ownership boundaries.
- Milestone 3: Test controlled editing gate (Developer A blocked from editing Developer B's file).
- Milestone 4: Submit formal access request.
- Milestone 5: Inspect AST graph structure and directed edges.
- Milestone 6: Simulate breaking contract modification in `authService.ts`.
- Milestone 7: Observe Random Forest ML dynamic predictions.
- Milestone 8: Verify targeted push notifications to affected module owner (Developer B).
- Milestone 9: Execute relevant test runner and capture regression failures.
- Milestone 10: Request Contextual AI diagnosis and automated fix suggestion.
- Milestone 11: Apply proposed fix and verify 100% test pass rate.
- Milestone 12: Record author-aware Git commit.
- Milestone 13: Verify immutable audit trail log.

---

## 3. Frontend Production Build Verification

```bash
cd frontend
npm run build
```
Build output must compile with zero errors via `tsc && vite build`.

---

## 4. Backend TypeScript Compilation

```bash
cd backend
npm run build
```
Compiles all TypeScript source files into `backend/dist/`.

---

## 5. Dependency Engine Build

```bash
cd dependency-engine
npm run build
```
Compiles the AST extractor using the TypeScript Compiler API into `dependency-engine/dist/`.
