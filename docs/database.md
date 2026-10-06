# CodeSync: Database Architecture & Relational Schema

CodeSync supports dual-database deployment:
- **Primary Database**: PostgreSQL / Supabase for cloud production and multi-user scaling.
- **Local Fallback Database**: SQLite 3 via Node.js 24's native `node:sqlite` (`DatabaseSync`), ensuring zero-configuration local execution without native binary compiling issues.

---

## 1. Schema Diagram (Entity Relationships)

```
   +-------------+       +-------------+       +-------------+
   ¦  PROFILES   ¦------<¦   PROJECT   ¦>------¦  PROJECTS   ¦
   ¦  (5 Personas¦       ¦   MEMBERS   ¦       ¦             ¦
   +-------------+       +-------------+       +-------------+
          ¦                                           ¦
          ¦                                           ?
          ¦                                    +-------------+
          ¦                                    ¦    FILES    ¦
          ¦                                    +-------------+
          ¦                                           ¦
          ?                                           ?
   +---------------+                           +-------------+
   ¦FILE_OWNERSHIP ¦                           ¦ DEPENDENCY  ¦
   ¦ (Active Owner)¦                           ¦    EDGES    ¦
   +---------------+                           +-------------+
          ¦                                           ¦
          ?                                           ?
   +---------------+                           +-------------+
   ¦ACCESS_REQUESTS¦                           ¦   CHANGES   ¦
   ¦ (Workflow)    ¦                           +-------------+
   +---------------+                                  ¦
                                                      ?
   +---------------+                           +-------------+
   ¦   DOCUMENTS   ¦>--------------------------¦   CHANGE    ¦
   ¦ & DOC_LINKS   ¦                           ¦   IMPACTS   ¦
   +---------------+                           +-------------+
```

---

## 2. Table Specifications

### 2.1. `profiles`
Stores user identities, credentials, and roles.
- `id` (VARCHAR / TEXT, PK): Unique user ID (e.g., `user_dev_a`).
- `email` (VARCHAR / TEXT, UNIQUE): User email address.
- `password_hash` (VARCHAR / TEXT): Encrypted/hashed password or demo credential.
- `full_name` (VARCHAR / TEXT): Display name.
- `role` (VARCHAR / TEXT): `Admin`, `Developer`, `Reviewer`, or `Viewer`.
- `avatar_url` (VARCHAR / TEXT): DiceBear SVG avatar link.
- `created_at`, `updated_at`: Timestamps.

### 2.2. `projects` & `project_members`
Projects and team membership associations with role overrides.

### 2.3. `files` & `file_versions`
- `files`: File path, name, programming language, module tag, and content text.
- `file_versions`: Complete version control history with commit author and summary.

### 2.4. `file_ownership` & `access_requests`
- `file_ownership`: Maps files to designated module owners.
- `access_requests`: Captures edit requests from non-owners:
  - `status`: `pending` $\rightarrow$ `approved` / `rejected` $\rightarrow$ `revoked`.

### 2.5. `dependency_edges`
Topological graph extracted by the TypeScript Compiler AST engine:
- `source_file_id`, `target_file_id`: Directed dependency pair.
- `relationship_type`: `IMPORT`, `CALL`, `TYPE_REFERENCE`, `TEST_REFERENCE`.
- `dependency_distance`: Shortest hop count.

### 2.6. `changes` & `change_impacts`
- `changes`: Captured diffs, lines added/deleted, and functions modified.
- `change_impacts`: Machine learning inference records:
  - `impact_probability`: Float between 0.0 and 1.0.
  - `risk_level`: `LOW`, `MEDIUM`, `HIGH`.
  - `explanation_factors`: Serialized JSON array of contributing features.

### 2.7. `documents` & `document_links`
Traceability system linking SRS requirement specifications to source code.
- `status`: `Draft`, `Submitted`, `Reviewed`, `Verified`.
- `verified`: Boolean flag.

### 2.8. `audit_logs` & `github_commits`
- `audit_logs`: Immutable security log capturing every save, test run, role change, and access decision.
- `github_commits`: Author-attributed Git commit records.
