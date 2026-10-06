# CodeSync: Database Architecture & Schema Reference

CodeSync provides a dual-database architecture:
1. **Primary Database:** PostgreSQL / Supabase with Row Level Security (RLS) policies.
2. **Local Fallback Database:** Embedded SQLite (Node.js built-in `node:sqlite`) for zero-configuration local development.

---

## 1. Entity-Relationship Overview

```mermaid
erDiagram
    PROFILES ||--o{ PROJECTS : owns
    PROFILES ||--o{ PROJECT_MEMBERS : belongs_to
    PROJECTS ||--o{ PROJECT_MEMBERS : has
    PROJECTS ||--o{ FILES : contains
    FILES ||--o{ FILE_OWNERSHIP : governed_by
    PROFILES ||--o{ FILE_OWNERSHIP : holds
    FILES ||--o{ ACCESS_REQUESTS : requested_for
    PROFILES ||--o{ ACCESS_REQUESTS : submitted_by
    PROJECTS ||--o{ DOCUMENTS : contains
    DOCUMENTS ||--o{ DOCUMENT_LINKS : linked_via
    FILES ||--o{ DOCUMENT_LINKS : points_to
    FILES ||--o{ DEPENDENCY_EDGES : source
    FILES ||--o{ DEPENDENCY_EDGES : target
    FILES ||--o{ CHANGES : recorded_on
    CHANGES ||--o{ CHANGE_IMPACTS : evaluated_for
    CHANGES ||--o{ TEST_RUNS : triggers
    TEST_RUNS ||--o{ TEST_RESULTS : contains
    PROFILES ||--o{ NOTIFICATIONS : delivered_to
    PROJECTS ||--o{ AUDIT_LOGS : tracked_in
```

---

## 2. Key Entities

- `profiles`: User accounts with role assignments (`Admin`, `Developer`, `Reviewer`, `Viewer`).
- `projects`: Container container for repository files, members, and configurations.
- `files`: File tree entities with paths, modules, contents, and ownership relations.
- `file_ownership`: Persistent module ownership mapping files to developers.
- `access_requests`: Formal permission delegation requests with reasons, approvers, and decisions.
- `documents`: Specifications and requirements (`doc_type`: `requirement`, `spec`, etc.).
- `document_links`: Traceability links binding requirements to code symbols.
- `dependency_edges`: AST relationship edges (`relationship_type`, `dependency_distance`, `metadata`).
- `changes`: Fine-grained change events (`lines_added`, `lines_deleted`, `functions_changed`, `diff`).
- `change_impacts`: Machine learning predicted impacts on candidate files (`impact_probability`, `risk_level`, `explanation`).
- `test_runs` & `test_results`: Execution records for relevant test runs (`status`, `duration_ms`, `error_message`, `stack_trace`).
- `notifications`: Impact alerts and access requests targeted directly to artifact owners.
- `audit_logs`: Immutable security and operation audit trail.
