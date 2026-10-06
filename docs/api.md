# CodeSync: API Specification

CodeSync exposes REST endpoints and real-time WebSocket channels on port 5000.

---

## 1. REST Endpoints

### Authentication & Profiles
- `GET /api/auth/users` — List demo profiles and their assigned roles.
- `GET /api/auth/me` — Return currently authenticated user profile.

### Projects & File Explorer
- `GET /api/projects/:id` — Return project metadata and member roster.
- `GET /api/projects/:id/files` — Return file tree annotated with ownership badges and current user's edit permission.
- `GET /api/files/:id` — Return single file content, ownership, and permission details.

### Controlled File Modification & Pipeline
- `POST /api/files/:id/save`
  - **Body:** `{ "content": "string", "changeSummary": "string" }`
  - **Behavior:** Checks server-side ownership. If permitted, persists file and executes the pipeline (Change Detection $\rightarrow$ AST Analysis $\rightarrow$ ML Inference $\rightarrow$ Targeted Notifications $\rightarrow$ Relevant Tests).
  - **Returns:** `{ "success": true, "pipeline": { ... } }`

### Controlled Access Requests
- `POST /api/access-requests`
  - **Body:** `{ "projectId": "string", "fileId": "string", "reason": "string" }`
  - **Returns:** `{ "success": true, "request": { "id": "...", "status": "pending" } }`
- `GET /api/projects/:id/access-requests` — List access requests for the project.
- `POST /api/access-requests/:id/decide`
  - **Body:** `{ "decision": "approved" | "rejected" }`

### Dependency Engine & Visualizer
- `GET /api/projects/:id/dependencies` — Returns nodes and directed edges for the SVG visualizer.
- `POST /api/projects/:id/dependencies/reindex` — Triggers project-wide TypeScript Compiler AST re-indexing.

### Testing Pipeline
- `POST /api/projects/:id/tests/run`
  - **Body:** `{ "targetFilePath": "string" }`
  - **Behavior:** Selects relevant tests based on AST dependency graph and executes assertions.
- `GET /api/projects/:id/tests/history` — Returns test runs and failure stack traces.

### Contextual AI Assistant
- `POST /api/ai/analyze`
  - **Body:** `{ "projectId": "string", "currentFilePath": "string", "diffContent": "string", "testResults": { ... } }`
  - **Returns:** Root cause diagnosis, dependency/ML breakdown, and human-in-the-loop fix diff.

### Targeted Notifications & Audit Trail
- `GET /api/notifications` — Returns notifications for current user.
- `POST /api/notifications/:id/read` — Marks notification as read.
- `GET /api/projects/:id/documents` — Returns requirements and document-to-code traceability links.
- `GET /api/projects/:id/audit-logs` — Returns full audit trail.
- `POST /api/git/commit` — Records a Git commit.

---

## 2. Real-Time WebSocket Protocol

- **URL:** `ws://localhost:5000/ws/collaborate`
- **Messages (Client $\rightarrow$ Server):**
  - `JOIN_FILE`: `{ "type": "JOIN_FILE", "fileId": "string", "userId": "string", "userName": "string", "userRole": "string" }`
  - `CURSOR_MOVE`: `{ "type": "CURSOR_MOVE", "fileId": "string", "cursor": { "line": 1, "column": 5 } }`
  - `OT_OPERATION`: `{ "type": "OT_OPERATION", "fileId": "string", "operation": { "type": "replace", "content": "..." } }`
  - `SAVE_FILE`: `{ "type": "SAVE_FILE", "projectId": "string", "fileId": "string", "content": "..." }`
  - `LEAVE_FILE`: `{ "type": "LEAVE_FILE", "fileId": "string" }`
- **Messages (Server $\rightarrow$ Client):**
  - `INIT_SNAPSHOT`: Initial file content, server version, and active collaborators.
  - `PRESENCE_UPDATE`: Real-time collaborator cursor and selection positions.
  - `OT_BROADCAST`: Incremental OT text transforms from remote peers.
  - `SAVE_SUCCESS`: Confirmation of file persistence and pipeline results.
