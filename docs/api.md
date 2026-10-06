# CodeSync: Comprehensive REST & WebSocket API Specification

Base URL: `http://localhost:5000/api`  
WebSocket URL: `ws://localhost:5000/ws/collaborate`  
ML Service URL: `http://127.0.0.1:8000`

---

## 1. Authentication & Session Management

### 1.1. User Registration
- **Endpoint:** `POST /api/auth/register`
- **Request Body:**
  ```json
  {
    "email": "maya.patel@canteen.edu",
    "password": "password123",
    "fullName": "Maya Patel",
    "role": "Developer"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_dev_a",
      "email": "maya.patel@canteen.edu",
      "full_name": "Maya Patel",
      "role": "Developer",
      "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya"
    }
  }
  ```

### 1.2. User Login
- **Endpoint:** `POST /api/auth/login`
- **Request Body:**
  ```json
  {
    "email": "maya.patel@canteen.edu",
    "password": "password123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
  ```

### 1.3. Current User Verification
- **Endpoint:** `GET /api/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  {
    "user": {
      "id": "user_dev_a",
      "email": "maya.patel@canteen.edu",
      "fullName": "Maya Patel",
      "role": "Developer"
    }
  }
  ```

### 1.4. User Roster
- **Endpoint:** `GET /api/auth/users`
- **Response (200 OK):**
  ```json
  {
    "users": [
      { "id": "user_admin", "full_name": "Alex Rivera", "role": "Admin", "email": "alex.owner@canteen.edu" },
      { "id": "user_dev_a", "full_name": "Maya Patel", "role": "Developer", "email": "maya.patel@canteen.edu" },
      { "id": "user_dev_b", "full_name": "Carlos Santos", "role": "Developer", "email": "carlos.santos@canteen.edu" },
      { "id": "user_reviewer", "full_name": "Elena Rostova", "role": "Reviewer", "email": "elena.rostova@canteen.edu" },
      { "id": "user_viewer", "full_name": "Jordan Lee", "role": "Viewer", "email": "jordan.lee@canteen.edu" }
    ]
  }
  ```

---

## 2. Controlled Workspace & File Management

### 2.1. Project File Explorer
- **Endpoint:** `GET /api/projects/:id/files`
- **Headers:** `x-user-id: <user_id>` or `Authorization: Bearer <token>`
- **Response (200 OK):**
  ```json
  {
    "files": [
      {
        "id": "file_auth_service",
        "path": "backend/authService.ts",
        "name": "authService.ts",
        "module": "Authentication",
        "owner_id": "user_dev_a",
        "owner_name": "Maya Patel",
        "canEdit": true,
        "editRestrictionReason": null
      },
      {
        "id": "file_login_view",
        "path": "frontend/login.tsx",
        "name": "login.tsx",
        "module": "Frontend Auth",
        "owner_id": "user_dev_b",
        "owner_name": "Carlos Santos",
        "canEdit": false,
        "editRestrictionReason": "File is owned by user [user_dev_b]. Access request required."
      }
    ]
  }
  ```

### 2.2. Single File Content
- **Endpoint:** `GET /api/files/:id`
- **Response (200 OK):** Returns file metadata, full content string, and live permission check.

### 2.3. Save File & Trigger CodeSync Pipeline
- **Endpoint:** `POST /api/files/:id/save`
- **Request Body:**
  ```json
  {
    "content": "export function validateToken() { ... }",
    "changeSummary": "Refactor token validation"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "File saved and analyzed successfully",
    "pipeline": {
      "changeId": "chg_...",
      "linesAdded": 10,
      "linesDeleted": 2,
      "functionsChanged": ["validateToken"],
      "candidates": [ ... ],
      "mlStatus": "success",
      "mlPredictions": [
        {
          "targetFile": "frontend/login.tsx",
          "impactProbability": 0.85,
          "riskLevel": "HIGH",
          "isAffected": true,
          "explanationFactors": ["Direct structural dependency exists (distance 1)"]
        }
      ],
      "testRun": {
        "status": "passed",
        "totalTests": 2,
        "passedTests": 2,
        "failedTests": 0
      },
      "notificationsCreated": 1
    }
  }
  ```
- **Response (403 Forbidden - if non-owner without approved request):**
  ```json
  {
    "error": "Permission Denied",
    "message": "File is owned by user [user_dev_b]. Access request required.",
    "requiresAccessRequest": true,
    "fileOwnerId": "user_dev_b"
  }
  ```

---

## 3. Controlled Editing Access Requests

### 3.1. Submit Request
- **Endpoint:** `POST /api/access-requests`
- **Body:** `{ "projectId": "proj_smart_canteen", "fileId": "file_login_view", "reason": "Need to adapt interface" }`
- **Response (200 OK):** `{ "success": true, "request": { "id": "req_...", "status": "pending" } }`

### 3.2. Decide Request (Approve / Reject)
- **Endpoint:** `POST /api/access-requests/:id/decide`
- **Body:** `{ "decision": "approved" }`
- **Response (200 OK):** `{ "success": true, "result": { "status": "approved" } }`

### 3.3. Revoke Request
- **Endpoint:** `POST /api/access-requests/:id/revoke`
- **Response (200 OK):** `{ "success": true, "message": "Access request revoked" }`

---

## 4. AST Dependency Engine

- `GET /api/projects/:id/dependencies`: Returns AST graph nodes and directed edges.
- `POST /api/projects/:id/dependencies/reindex`: Triggers project-wide TypeScript Compiler AST re-indexing.

---

## 5. Machine Learning Service (FastAPI :8000)

- `GET /health`: Health status check.
- `POST /predict`:
  - **Body:**
    ```json
    {
      "source_file": "backend/authService.ts",
      "change_metadata": { "lines_added": 8, "lines_deleted": 2, "functions_changed": ["authenticateUser"] },
      "candidates": [
        { "target_file": "frontend/login.tsx", "direct_dependency": true, "dependency_distance": 1 }
      ]
    }
    ```
  - **Response (200 OK):**
    ```json
    {
      "source_file": "backend/authService.ts",
      "model_name": "RandomForestClassifier",
      "predictions": [
        {
          "target_file": "frontend/login.tsx",
          "impact_probability": 0.85,
          "risk_level": "HIGH",
          "is_affected": true,
          "explanation_factors": ["Direct structural dependency exists (distance 1)"]
        }
      ],
      "status": "success"
    }
    ```

---

## 6. Test Runner & Contextual AI

- `POST /api/projects/:id/tests/run`: Executes relevant tests for target file.
- `GET /api/projects/:id/tests/history`: Returns last 10 test execution runs.
- `POST /api/ai/analyze`: Generates root cause diagnosis and patch suggestion based on diff and test results.

---

## 7. Traceability, Audit & Git

- `GET /api/projects/:id/documents`: Requirements documents and traceability links.
- `PATCH /api/documents/:id/status`: Updates document status (`Draft`, `Submitted`, `Reviewed`, `Verified`).
- `POST /api/documents/:id/verify`: Reviewer marks document as verified.
- `GET /api/projects/:id/activity`: Filterable timeline of project actions.
- `GET /api/projects/:id/audit-logs`: Immutable tamper-resistant audit events.
- `GET /api/git/history`: Commit history log.
- `POST /api/git/commit`: Records author-aware Git commit.
