import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import { ENV } from './env';

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

class DatabaseManager {
  private pgPool: Pool | null = null;
  private sqliteDb: any = null;
  private isUsingPg: boolean = false;
  private initialized: boolean = false;

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    // 1. Try PostgreSQL / Supabase as Primary
    try {
      console.log(`[DB] Attempting connection to primary PostgreSQL: ${ENV.DATABASE_URL}`);
      const pool = new Pool({
        connectionString: ENV.DATABASE_URL,
        connectionTimeoutMillis: 3000
      });

      const client = await pool.connect();
      client.release();

      this.pgPool = pool;
      this.isUsingPg = true;
      console.log('[DB] SUCCESS: Connected to primary PostgreSQL database.');
      await this.initPostgresSchema();
    } catch (err: any) {
      console.warn(`[DB] Primary PostgreSQL connection failed (${err.message}).`);
      
      if (ENV.USE_SQLITE_FALLBACK) {
        console.log('[DB] Activating optional local SQLite fallback database...');
        this.initSqliteFallback();
      } else {
        throw new Error(`PostgreSQL connection failed and SQLite fallback disabled: ${err.message}`);
      }
    }

    this.initialized = true;
  }

  private async initPostgresSchema(): Promise<void> {
    if (!this.pgPool) return;
    try {
      const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
      const seedPath = path.resolve(__dirname, '../../../database/seed_smart_canteen.sql');

      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await this.pgPool.query(schemaSql);
      }

      // Check if project exists
      const checkRes = await this.pgPool.query("SELECT id FROM projects WHERE id = 'proj_smart_canteen'");
      if (checkRes.rowCount === 0 && fs.existsSync(seedPath)) {
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        await this.pgPool.query(seedSql);
        console.log('[DB] Seeded Smart Canteen target demonstration data into PostgreSQL.');
      }
    } catch (err: any) {
      console.error('[DB] PostgreSQL schema initialization error:', err.message);
    }
  }

  private initSqliteFallback(): void {
    try {
      // Use Node.js built-in DatabaseSync
      const { DatabaseSync } = require('node:sqlite');
      const dbDir = path.dirname(ENV.SQLITE_PATH);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.sqliteDb = new DatabaseSync(ENV.SQLITE_PATH);
      this.isUsingPg = false;
      console.log(`[DB] Local SQLite fallback active at ${ENV.SQLITE_PATH}`);

      this.initSqliteSchema();
    } catch (err: any) {
      console.error('[DB] Failed to initialize SQLite fallback:', err.message);
      throw err;
    }
  }

  private initSqliteSchema(): void {
    if (!this.sqliteDb) return;

    this.sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Developer',
        avatar_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        owner_id TEXT NOT NULL,
        repo_url TEXT,
        default_branch TEXT DEFAULT 'main',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS project_members (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Developer',
        joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        path TEXT NOT NULL,
        name TEXT NOT NULL,
        language TEXT NOT NULL DEFAULT 'typescript',
        module TEXT,
        owner_id TEXT,
        is_directory INTEGER DEFAULT 0,
        parent_id TEXT,
        content TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, path)
      );

      CREATE TABLE IF NOT EXISTS file_versions (
        id TEXT PRIMARY KEY,
        file_id TEXT NOT NULL,
        version_number INTEGER NOT NULL,
        content TEXT NOT NULL,
        changed_by TEXT,
        change_summary TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS file_ownership (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        file_id TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        assigned_by TEXT,
        status TEXT DEFAULT 'active',
        assigned_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS access_requests (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        file_id TEXT NOT NULL,
        requester_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        approver_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        decided_at TEXT
      );

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        doc_type TEXT NOT NULL,
        content TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        verified INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS document_links (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        document_id TEXT NOT NULL,
        target_file_id TEXT NOT NULL,
        target_symbol TEXT,
        link_type TEXT DEFAULT 'implements',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS dependency_edges (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        source_file_id TEXT NOT NULL,
        target_file_id TEXT NOT NULL,
        relationship_type TEXT NOT NULL,
        dependency_distance INTEGER DEFAULT 1,
        metadata TEXT DEFAULT '{}',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, source_file_id, target_file_id, relationship_type)
      );

      CREATE TABLE IF NOT EXISTS changes (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        file_id TEXT NOT NULL,
        change_type TEXT NOT NULL,
        lines_added INTEGER DEFAULT 0,
        lines_deleted INTEGER DEFAULT 0,
        functions_changed TEXT DEFAULT '[]',
        diff_content TEXT,
        commit_hash TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS change_impacts (
        id TEXT PRIMARY KEY,
        change_id TEXT NOT NULL,
        source_file_id TEXT NOT NULL,
        target_file_id TEXT NOT NULL,
        impact_probability REAL NOT NULL,
        risk_level TEXT NOT NULL,
        predicted_by TEXT DEFAULT 'RandomForestClassifier_v1',
        explanation TEXT DEFAULT '[]',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ai_sessions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        context_file_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ai_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        prompt_context TEXT DEFAULT '{}',
        fix_suggestion TEXT,
        is_applied INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS test_runs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        change_id TEXT,
        triggered_by TEXT NOT NULL,
        status TEXT NOT NULL,
        total_tests INTEGER DEFAULT 0,
        passed_tests INTEGER DEFAULT 0,
        failed_tests INTEGER DEFAULT 0,
        duration_ms INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS test_results (
        id TEXT PRIMARY KEY,
        test_run_id TEXT NOT NULL,
        test_name TEXT NOT NULL,
        file_id TEXT,
        status TEXT NOT NULL,
        duration_ms INTEGER DEFAULT 0,
        error_message TEXT,
        stack_trace TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        metadata TEXT DEFAULT '{}',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        details TEXT DEFAULT '{}',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        ip_address TEXT DEFAULT '127.0.0.1',
        details TEXT DEFAULT '{}',
        status TEXT DEFAULT 'SUCCESS',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS github_commits (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        commit_hash TEXT NOT NULL,
        message TEXT NOT NULL,
        author_name TEXT NOT NULL,
        author_email TEXT NOT NULL,
        branch TEXT DEFAULT 'main',
        change_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed SQLite Smart Canteen target demo if empty
    const stmt = this.sqliteDb.prepare("SELECT COUNT(*) as count FROM projects WHERE id = 'proj_smart_canteen'");
    const res = stmt.get() as any;
    if (res.count === 0) {
      this.seedSqliteSmartCanteen();
    }
  }

  private seedSqliteSmartCanteen(): void {
    console.log('[DB] Seeding Smart Canteen demo data into SQLite fallback...');

    // Profiles
    const insertProfile = this.sqliteDb.prepare(`
      INSERT OR IGNORE INTO profiles (id, email, full_name, role, avatar_url)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertProfile.run('user_admin', 'alex.owner@canteen.edu', 'Alex Rivera (Admin / Project Owner)', 'Admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex');
    insertProfile.run('user_dev_a', 'maya.patel@canteen.edu', 'Maya Patel (Developer A - Auth & Services)', 'Developer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya');
    insertProfile.run('user_dev_b', 'carlos.santos@canteen.edu', 'Carlos Santos (Developer B - Frontend UI)', 'Developer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos');
    insertProfile.run('user_reviewer', 'elena.rostova@canteen.edu', 'Elena Rostova (Lead Reviewer & QA)', 'Reviewer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena');
    insertProfile.run('user_viewer', 'jordan.lee@canteen.edu', 'Jordan Lee (Stakeholder / Observer)', 'Viewer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan');

    // Project
    const insertProj = this.sqliteDb.prepare(`
      INSERT OR IGNORE INTO projects (id, name, description, owner_id, repo_url, default_branch)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertProj.run('proj_smart_canteen', 'Smart Canteen Platform', 'A research-grade role-governed automated meal booking and authentication system for university campuses.', 'user_admin', 'https://github.com/institution/smart-canteen-platform', 'main');

    // Members
    const insertMember = this.sqliteDb.prepare(`
      INSERT OR IGNORE INTO project_members (id, project_id, user_id, role) VALUES (?, ?, ?, ?)
    `);
    insertMember.run('pm_1', 'proj_smart_canteen', 'user_admin', 'Admin');
    insertMember.run('pm_2', 'proj_smart_canteen', 'user_dev_a', 'Developer');
    insertMember.run('pm_3', 'proj_smart_canteen', 'user_dev_b', 'Developer');
    insertMember.run('pm_4', 'proj_smart_canteen', 'user_reviewer', 'Reviewer');
    insertMember.run('pm_5', 'proj_smart_canteen', 'user_viewer', 'Viewer');

    // Files
    const insertFile = this.sqliteDb.prepare(`
      INSERT OR IGNORE INTO files (id, project_id, path, name, language, module, owner_id, is_directory, content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const authCode = `export interface AuthResponse {
  token: string;
  userId: string;
  role: string;
  expiresIn: number;
}

export interface UserCredentials {
  email: string;
  passwordHash: string;
}

export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

export function authenticateUser(credentials: UserCredentials): AuthResponse {
  if (!credentials.email || !credentials.passwordHash) {
    throw new Error("Invalid credentials payload");
  }

  const token = \`cs_jwt_\${Date.now()}_\${credentials.email}\`;
  return {
    token,
    userId: "usr_campus_982",
    role: "student",
    expiresIn: 3600
  };
}

export function verifySessionToken(token: string): boolean {
  return token.startsWith("cs_jwt_");
}`;

    const userCode = `import { authenticateUser, verifySessionToken } from "./authService";

export interface UserProfile {
  id: string;
  name: string;
  balance: number;
  dietaryPreference: string;
}

export function getUserProfile(userId: string, sessionToken: string): UserProfile {
  if (!verifySessionToken(sessionToken)) {
    throw new Error("Unauthorized session token");
  }

  return {
    id: userId,
    name: "Aarav Sharma",
    balance: 450.00,
    dietaryPreference: "Vegetarian"
  };
}`;

    const loginCode = `import React, { useState } from "react";
import { authenticateUser, AuthResponse } from "../backend/authService";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authResult, setAuthResult] = useState<AuthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = authenticateUser({ email, passwordHash: password });
      setAuthResult(response);
      localStorage.setItem("userToken", response.token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <h2>Smart Canteen Login</h2>
      <form onSubmit={handleLoginSubmit}>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Campus Email" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">Log In</button>
      </form>
      {authResult && <div className="success">Welcome token: {authResult.token}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}`;

    const dashboardCode = `import React from "react";
import { getUserProfile, UserProfile } from "../backend/userService";

export function CanteenDashboard({ token }: { token: string }) {
  const profile: UserProfile = getUserProfile("usr_campus_982", token);

  return (
    <div className="dashboard-grid">
      <header>Welcome, {profile.name}</header>
      <div className="wallet-card">Meal Wallet Balance: ₹{profile.balance}</div>
    </div>
  );
}`;

    const authTestCode = `import { authenticateUser, validatePassword } from "../backend/authService";

describe("Authentication Service Unit Tests", () => {
  it("should validate passwords with 8 or more characters", () => {
    expect(validatePassword("short")).toBe(false);
    expect(validatePassword("validPass123")).toBe(true);
  });

  it("should authenticate valid user credentials and return AuthResponse", () => {
    const res = authenticateUser({
      email: "student@canteen.edu",
      passwordHash: "hash_secret_99"
    });

    expect(res).toBeDefined();
    expect(res.token).toContain("cs_jwt_");
    expect(res.role).toBe("student");
    expect(res.expiresIn).toBe(3600);
  });
});`;

    const userTestCode = `import { getUserProfile } from "../backend/userService";

describe("User Service Unit Tests", () => {
  it("should return correct user profile when session token is valid", () => {
    const profile = getUserProfile("usr_campus_982", "cs_jwt_valid_mock");
    expect(profile.id).toBe("usr_campus_982");
    expect(profile.balance).toBeGreaterThan(0);
  });
});`;

    insertFile.run('file_auth_service', 'proj_smart_canteen', 'backend/authService.ts', 'authService.ts', 'typescript', 'Authentication', 'user_dev_a', 0, authCode);
    insertFile.run('file_user_service', 'proj_smart_canteen', 'backend/userService.ts', 'userService.ts', 'typescript', 'UserManagement', 'user_dev_a', 0, userCode);
    insertFile.run('file_login_view', 'proj_smart_canteen', 'frontend/login.tsx', 'login.tsx', 'typescript', 'FrontendUI', 'user_dev_b', 0, loginCode);
    insertFile.run('file_dashboard_view', 'proj_smart_canteen', 'frontend/dashboard.tsx', 'dashboard.tsx', 'typescript', 'FrontendUI', 'user_dev_b', 0, dashboardCode);
    insertFile.run('file_auth_test', 'proj_smart_canteen', 'tests/auth.test.ts', 'auth.test.ts', 'typescript', 'Testing', 'user_reviewer', 0, authTestCode);
    insertFile.run('file_user_test', 'proj_smart_canteen', 'tests/user.test.ts', 'user.test.ts', 'typescript', 'Testing', 'user_reviewer', 0, userTestCode);

    // File Ownership
    const insertOwner = this.sqliteDb.prepare(`
      INSERT OR IGNORE INTO file_ownership (id, project_id, file_id, owner_id, assigned_by, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertOwner.run('fo_1', 'proj_smart_canteen', 'file_auth_service', 'user_dev_a', 'user_admin', 'active');
    insertOwner.run('fo_2', 'proj_smart_canteen', 'file_user_service', 'user_dev_a', 'user_admin', 'active');
    insertOwner.run('fo_3', 'proj_smart_canteen', 'file_login_view', 'user_dev_b', 'user_admin', 'active');
    insertOwner.run('fo_4', 'proj_smart_canteen', 'file_dashboard_view', 'user_dev_b', 'user_admin', 'active');
    insertOwner.run('fo_5', 'proj_smart_canteen', 'file_auth_test', 'user_reviewer', 'user_admin', 'active');
    insertOwner.run('fo_6', 'proj_smart_canteen', 'file_user_test', 'user_reviewer', 'user_admin', 'active');

    // Documents
    const insertDoc = this.sqliteDb.prepare(`
      INSERT OR IGNORE INTO documents (id, project_id, title, doc_type, content, version, verified)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertDoc.run('doc_req_001', 'proj_smart_canteen', 'R-001: Campus User Authentication & Token Specification', 'requirement', 
      '# R-001: Authentication & Session Management\nAll canteen users must authenticate using campus credentials.\nThe backend auth service must issue a cryptographic token (`cs_jwt_`).', 1, 1);
    insertDoc.run('doc_req_002', 'proj_smart_canteen', 'R-002: Meal Wallet & Profile Retrieval', 'requirement',
      '# R-002: Meal Wallet & Profile Retrieval\nThe system must retrieve student meal balances upon valid session verification.', 1, 1);

    // Document links
    const insertLink = this.sqliteDb.prepare(`
      INSERT OR IGNORE INTO document_links (id, project_id, document_id, target_file_id, target_symbol, link_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertLink.run('dl_1', 'proj_smart_canteen', 'doc_req_001', 'file_auth_service', 'authenticateUser', 'implements');
    insertLink.run('dl_2', 'proj_smart_canteen', 'doc_req_001', 'file_login_view', 'handleLoginSubmit', 'implements');
    insertLink.run('dl_3', 'proj_smart_canteen', 'doc_req_001', 'file_auth_test', 'testAuthenticateUserValidCredentials', 'verifies');
    insertLink.run('dl_4', 'proj_smart_canteen', 'doc_req_002', 'file_user_service', 'getUserProfile', 'implements');
    insertLink.run('dl_5', 'proj_smart_canteen', 'doc_req_002', 'file_dashboard_view', 'renderUserDashboard', 'implements');

    // Initial Dependency Edges
    const insertEdge = this.sqliteDb.prepare(`
      INSERT OR IGNORE INTO dependency_edges (id, project_id, source_file_id, target_file_id, relationship_type, dependency_distance, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertEdge.run('dep_1', 'proj_smart_canteen', 'file_login_view', 'file_auth_service', 'IMPORT', 1, '{"symbols":["authenticateUser","AuthResponse"]}');
    insertEdge.run('dep_2', 'proj_smart_canteen', 'file_user_service', 'file_auth_service', 'IMPORT', 1, '{"symbols":["authenticateUser","verifySessionToken"]}');
    insertEdge.run('dep_3', 'proj_smart_canteen', 'file_auth_test', 'file_auth_service', 'TEST_REFERENCE', 1, '{"symbols":["authenticateUser","validatePassword"]}');
    insertEdge.run('dep_4', 'proj_smart_canteen', 'file_dashboard_view', 'file_user_service', 'IMPORT', 1, '{"symbols":["getUserProfile","UserProfile"]}');
    insertEdge.run('dep_5', 'proj_smart_canteen', 'file_user_test', 'file_user_service', 'TEST_REFERENCE', 1, '{"symbols":["getUserProfile"]}');

    console.log('[DB] Finished seeding Smart Canteen data into SQLite fallback.');
  }

  /**
   * Unified Query Method that seamlessly executes across PostgreSQL or SQLite.
   */
  public async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.isUsingPg && this.pgPool) {
      // Postgres parameter syntax uses $1, $2, etc.
      let pgSql = sql;
      // Convert ? to $1, $2 if passed with ?
      let paramIndex = 1;
      pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);
      const res = await this.pgPool.query(pgSql, params);
      return { rows: res.rows, rowCount: res.rowCount ?? res.rows.length };
    }

    if (this.sqliteDb) {
      // SQLite uses ? parameters
      // Convert $1, $2 to ? if passed with $
      let sqliteSql = sql.replace(/\$\d+/g, '?');

      const isSelect = /^\s*(SELECT|PRAGMA)/i.test(sqliteSql);
      if (isSelect) {
        const stmt = this.sqliteDb.prepare(sqliteSql);
        const rows = stmt.all(...params) as T[];
        return { rows, rowCount: rows.length };
      } else {
        const stmt = this.sqliteDb.prepare(sqliteSql);
        const info = stmt.run(...params);
        return { rows: [], rowCount: info.changes ?? 1 };
      }
    }

    throw new Error('No database connection available.');
  }

  public isPostgres(): boolean {
    return this.isUsingPg;
  }
}

export const db = new DatabaseManager();
