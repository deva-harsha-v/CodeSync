# CodeSync: AI-Assisted Real-Time Collaborative Code Sync

**Academic Classification:** Final-Year B.Tech Computer Science and Engineering Capstone Project  
**Base Paper:** *CodePilot: Scaffolding End-to-End Collaborative Software Development for Novice Programmers* (Jeremy Warner & Philip J. Guo, ACM CHI 2017, DOI: [10.1145/3025453.3025876](https://doi.org/10.1145/3025453.3025876))  
**Literature Review:** Validated 18-Paper Corpus (see [docs/research-evaluation.md](docs/research-evaluation.md))  

---

## 1. Project Identity & Research Motivation

> **CodeSync** is a role-, artifact-, and dependency-aware collaborative software development environment that combines controlled module ownership, document-to-code traceability, dependency-aware change analysis, ML-based change-impact/risk prediction, and contextual AI assistance within a real-time collaborative IDE.

Modern software engineering teams frequently experience coordination failures, unnoticed breaking changes, and alert fatigue when modifying shared codebases. Generic collaborative text editors lack architectural awareness, while static analysis tools flag every reachable file—generating overwhelming false-positive alerts.

CodeSync addresses these challenges through a unified multi-stage architecture:
1. **Multi-Role Governance & Controlled Artifact Ownership:** Four distinct roles (`Admin`, `Developer`, `Reviewer`, `Viewer`) with server-side permission gates and formal access request workflows.
2. **Real-Time Operational Transformation (OT):** Non-blocking concurrent editing with live presence and cursor synchronization over WebSockets.
3. **Compiler-Grade AST Dependency Engine:** True AST parsing via the TypeScript Compiler API (`IMPORT`, `FUNCTION_CALL`, `CLASS_REFERENCE`, `TYPE_REFERENCE`, `TEST_REFERENCE`).
4. **Machine Learning Impact/Risk Prediction:** A supervised Random Forest classifier that evaluates dependency-scoped candidates against 18 historical change and co-change features. **All probabilities are dynamically computed and never hardcoded.**
5. **Selective Testing Pipeline:** Executes relevant test suites based on structural connections, capturing test failures, error messages, and stack traces.
6. **Contextual AI Assistant with Human-in-the-Loop Safeguards:** Diagnostic assistance receiving role, AST graph, ML scores, and test traces. Fixes are presented as diffs requiring explicit developer approval.
7. **Document-to-Code Traceability:** Bidirectional links binding project requirements to specific code functions and test cases.
8. **Comprehensive Audit Trail & Git Integration:** Complete chronological logging of all actions and verified commit creation.

---

## 2. System Architecture

```text
               COLLABORATIVE EDIT (Monaco Editor)
                               ↓
                 WebSocket OT Synchronization
                               ↓
                    Change Detection Service
                               ↓
              TypeScript AST Dependency Engine
                               ↓
                   Candidate Impact Files
                               ↓
                 18-Feature Vector Extraction
                               ↓
           Supervised ML Model (Random Forest)
                               ↓
          Dynamic Impact Probability & Risk Level
                               ↓
        Targeted Notifications to Artifact Owners
                               ↓
                    Selective Test Runner
                               ↓
             Test Failure / Regression Detected
                               ↓
               Contextual AI Assistant Diagnosis
                               ↓
             Human-in-the-Loop Developer Review
                               ↓
               Reviewer Approval & Git Commit
                               ↓
                     Audit Trail Logging
```

---

## 3. Technology Stack

- **Frontend:** React 18, TypeScript, Monaco Editor (`@monaco-editor/react`), Vite, Handwritten Plain CSS with CSS Variables (No Tailwind, No shadcn, No Bootstrap).
- **Backend:** Node.js (v24), TypeScript, Express, WebSockets (`ws`), `pg`, `jsonwebtoken`.
- **Database:**
  - *Primary Database:* PostgreSQL / Supabase with Row Level Security (RLS) policies.
  - *Local Development Fallback:* Embedded SQLite (`node:sqlite`) for zero-configuration operation.
- **Dependency Engine:** TypeScript Compiler API (`typescript` AST parsing).
- **ML Service:** Python 3.14, FastAPI, `uvicorn`, `scikit-learn`, `joblib`, `pandas`, `numpy`.

---

## 4. Repository Structure

```text
codesync/
├── backend/                  # Express + TypeScript + WebSockets OT server
│   ├── src/
│   │   ├── config/           # Database (PostgreSQL + SQLite fallback), Env
│   │   ├── middleware/       # Auth & role-based permission gates
│   │   ├── routes/           # REST API router
│   │   ├── services/         # AST sync, ML client, Test runner, AI, Audit
│   │   ├── websocket/        # Real-time OT collaboration engine
│   │   └── index.ts          # Server entry point
│   └── package.json
│
├── dependency-engine/        # TypeScript Compiler AST analyzer & graph builder
│   ├── src/
│   │   ├── ast-parser.ts     # AST node traversal (imports, calls, types, tests)
│   │   ├── graph-builder.ts  # Bidirectional graph & candidate BFS extraction
│   │   └── index.ts          # Public API
│   └── package.json
│
├── ml-service/               # Python ML inference & training pipeline
│   ├── app/main.py           # FastAPI REST microservice (/predict, /health)
│   ├── data/                 # Benchmark dataset generator (600 commits)
│   ├── models/               # Training script (Temporal split) & evaluation suite
│   └── requirements.txt
│
├── frontend/                 # React + Monaco IDE with handwritten CSS
│   ├── src/
│   │   ├── components/       # Explorer, Editor, Graph, Impact, Test, AI, Docs, Audit
│   │   ├── styles/theme.css  # Pure dark IDE handwritten CSS
│   │   └── App.tsx           # IDE workspace layout
│   └── package.json
│
├── database/                 # PostgreSQL schema, seeds, SQLite persistence
│   ├── schema.sql            # Full PostgreSQL DDL + RLS policies
│   └── seed_smart_canteen.sql# Smart Canteen target demonstration dataset
│
├── docs/                     # Academic & technical documentation
│   ├── research-evaluation.md# Base paper, 18-paper review, empirical metrics
│   ├── ml-pipeline.md        # Dataset, feature vector, temporal split, training
│   ├── dependency-engine.md  # AST parsing, incremental indexing
│   ├── ai-assistant.md       # Context builder, human-in-the-loop safeguards
│   ├── database.md           # Schema ER diagrams, RLS rules
│   └── api.md                # REST & WebSocket protocol reference
│
├── scripts/                  # Automated verification and startup scripts
│   ├── start-all.bat         # Concurrently launches ML, Backend, and Frontend
│   └── verify-system.js      # 13-step end-to-end integration test runner
│
├── .env.example              # Environment variables template
└── README.md                 # Master project documentation
```

---

## 5. Setup & Installation

### Prerequisites
- Node.js v20+ (tested on Node v24.14.0)
- Python 3.10+ (tested on Python 3.14.3)
- Git

### 1. Clone & Configure Environment
```bash
git clone <repository-url>
cd codesync
copy .env.example .env
```

### 2. Dependency Engine
```bash
cd dependency-engine
npm install
npm run build
```

### 3. Machine Learning Service
```bash
cd ../ml-service
pip install -r requirements.txt
python data/generate_dataset.py
python models/train.py
python models/evaluate.py
```

### 4. Backend Server
```bash
cd ../backend
npm install
npm run build
```

### 5. Frontend IDE
```bash
cd ../frontend
npm install
npm run build
```

---

---

## 6. Application Routes & Personas

CodeSync provides three seamlessly linked application routes:
- **`/` — Professional Landing Page**: Research foundation (CodePilot CHI 2017 & Collabode UIST 2011), 8 architectural feature cards, system dataflow diagrams, and direct CTAs.
- **`/login` — Authentication & Persona Portal**: Dual-mode entry featuring 1-click Demo Persona quick-login and production JWT email/password authentication.
- **`/workspace` — Collaborative IDE Workspace**: Monaco Editor, live OT WebSockets, AST Dependency Graph visualizer, Random Forest ML impact prediction, selective test runner, contextual AI assistant, requirements traceability matrix, filterable activity feed, tamper-resistant audit trail, and Git commit panel.

### Demo Personas & Credentials:

| Persona | Role | Email | Password | Primary Module Ownership |
|:---|:---|:---|:---|:---|
| **Alex Rivera** | `Admin` | `alex.owner@canteen.edu` | `password123` | Full Administrative Override & Project Governance |
| **Maya Patel** | `Developer` | `maya.patel@canteen.edu` | `password123` | Backend Services (`backend/authService.ts`) |
| **Carlos Santos** | `Developer` | `carlos.santos@canteen.edu` | `password123` | Frontend UI (`frontend/login.tsx`) |
| **Elena Rostova** | `Reviewer` | `elena.rostova@canteen.edu` | `password123` | QA Testing, Pull Requests & Git Commit Sign-Off |
| **Jordan Lee** | `Viewer` | `jordan.lee@canteen.edu` | `password123` | Read-Only Project Stakeholder Observer Mode |

---

## 7. Running the System

Launch all three services concurrently using the startup script:
```bash
scripts\start-all.bat
```

Or start each microservice independently:
1. **ML Service (FastAPI / Uvicorn):**
   ```bash
   cd ml-service
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   # Available at http://127.0.0.1:8000
   ```
2. **Backend Server (Express + WebSockets OT):**
   ```bash
   cd backend
   npm start
   # REST API at http://localhost:5000, WebSockets at ws://localhost:5000/ws/collaborate
   ```
3. **Frontend IDE (React 18 + Vite):**
   ```bash
   cd frontend
   npm run dev
   # Accessible at http://localhost:3000
   ```

---

## 8. Automated System Verification & Tests

CodeSync includes two comprehensive automated testing and demonstration scripts:

### Suite A: 25-Point Comprehensive System Verification
Validates all 10 core subsystems (Authentication, Controlled Ownership, Access Requests, AST Graph, ML Inference, Test Runner, Contextual AI, Traceability, Activity Feed, Git Integration):
```bash
node scripts/test-suite.js
```

### Suite B: 13-Milestone Smart Canteen End-to-End Walkthrough
Programmatically executes the entire collaborative workflow from unauthorized edit interception to AI-assisted patch application and Git commit recording:
```bash
node scripts/verify-system.js
```

---

## 9. Comprehensive Documentation Index

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Detailed architecture, pipeline dataflow, and component interactions.
- [docs/API.md](docs/API.md) — Complete REST and WebSocket API specification.
- [docs/ML.md](docs/ML.md) — Machine Learning feature vector, Random Forest model, and noise reduction analysis.
- [docs/AI.md](docs/AI.md) — Contextual AI dual-mode architecture and automated patch generation.
- [docs/DATABASE.md](docs/DATABASE.md) — PostgreSQL and SQLite relational schema design.
- [docs/TESTING.md](docs/TESTING.md) — Automated testing procedures and verification commands.
- [docs/research-evaluation.md](docs/research-evaluation.md) — 18-paper research literature review and empirical benchmark report.

---

## 10. Smart Canteen Target Demonstration Scenario

CodeSync includes a pre-seeded Smart Canteen scenario configured to showcase the entire collaborative lifecycle:

1. **Roster of 4 Roles:**
   - `Alex Rivera` — Admin / Project Owner
   - `Maya Patel` — Developer A (Backend Auth & User Services)
   - `Carlos Santos` — Developer B (Frontend UI & Login Views)
   - `Elena Rostova` — Reviewer & QA Lead
   - `Jordan Lee` — Viewer (Stakeholder)
2. **Demonstration Workflow:**
   - **Step 1:** Select `Carlos Santos (Dev B)` from the Role Switcher and try modifying `backend/authService.ts`. Notice that the editor is locked and displays an **Access Request Modal** because the file is owned by Maya Patel (Dev A).
   - **Step 2:** Switch to `Maya Patel (Dev A)`. Maya introduces a breaking change in `backend/authService.ts` (modifying the return shape of `authenticateUser()` so that `token` is undefined).
   - **Step 3:** Click **Save & Analyze**.
   - **Step 4:** The Dependency Engine extracts candidate impacted files (`frontend/login.tsx`, `backend/userService.ts`, `tests/auth.test.ts`).
   - **Step 5:** The Random Forest ML model predicts risk:
     - `frontend/login.tsx`: **HIGH** ($92\%$)
     - `tests/auth.test.ts`: **HIGH** ($88\%$)
     - `backend/userService.ts`: **MEDIUM** ($71\%$)
   - **Step 6:** A targeted notification arrives in Carlos Santos' (Dev B) inbox informing him that his owned file `login.tsx` is at risk.
   - **Step 7:** The Test Runner executes `tests/auth.test.ts` and detects failure (`AssertionError: Expected token to contain 'cs_jwt_' but received undefined`).
   - **Step 8:** The Contextual AI Assistant analyzes the failure, explains the broken contract, and provides a verified patch diff.
   - **Step 9:** Developer A clicks **Review & Apply Suggestion**. The fix is merged, the change is broadcast via OT, and tests pass ($100\%$).
   - **Step 10:** Elena Rostova (Reviewer) approves and records a verified Git commit, logged in the Audit Trail.

---

## 11. Research Evaluation Summary

| Metric | Baseline: Dependency-Only | Proposed: CodeSync (Dep + ML) | Delta |
| :--- | :---: | :---: | :---: |
| **Precision** | `0.7842` | `1.0000` | **+21.58%** |
| **Recall** | `1.0000` | `1.0000` | Identical ($100\%$) |
| **F1-Score** | `0.8790` | `1.0000` | **+12.10%** |
| **False Positives** | 30 | 0 | **-100% reduction** in alert noise |
| **Top-3 Hit Rate** | N/A | `0.7267` | High rank accuracy |

For full details, see [docs/research-evaluation.md](docs/research-evaluation.md).

---

## 12. Known Limitations & Future Work

- **Multi-Language AST:** The current dependency parser targets TypeScript/TSX/JavaScript using the TypeScript Compiler API. Future work will extend tree-sitter bindings for Python, Go, and Java.
- **Advanced Sandboxing:** Test execution runs in a controlled node process. Future iterations will introduce gVisor or Docker micro-containers for multi-tenant isolation.
- **Graph Neural Networks (GNN):** Future work will benchmark Graph Convolutional Networks (GCN) against the Random Forest baseline once graph structural scale exceeds $10^4$ nodes.
