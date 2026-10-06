-- =================================================================
-- CodeSync: Smart Canteen Target Demonstration Seed Data
-- =================================================================

-- 1. Profiles (4 Roles)
INSERT INTO profiles (id, email, full_name, role, avatar_url) VALUES
('user_admin', 'alex.owner@canteen.edu', 'Alex Rivera (Admin / Project Owner)', 'Admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'),
('user_dev_a', 'maya.patel@canteen.edu', 'Maya Patel (Developer A - Auth & Services)', 'Developer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya'),
('user_dev_b', 'carlos.santos@canteen.edu', 'Carlos Santos (Developer B - Frontend UI)', 'Developer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos'),
('user_reviewer', 'elena.rostova@canteen.edu', 'Elena Rostova (Lead Reviewer & QA)', 'Reviewer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena'),
('user_viewer', 'jordan.lee@canteen.edu', 'Jordan Lee (Stakeholder / Observer)', 'Viewer', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan')
ON CONFLICT (id) DO NOTHING;

-- 2. Projects
INSERT INTO projects (id, name, description, owner_id, repo_url, default_branch) VALUES
('proj_smart_canteen', 'Smart Canteen Platform', 'A research-grade role-governed automated meal booking and authentication system for university campuses.', 'user_admin', 'https://github.com/institution/smart-canteen-platform', 'main')
ON CONFLICT (id) DO NOTHING;

-- 3. Project Members
INSERT INTO project_members (id, project_id, user_id, role) VALUES
('pm_1', 'proj_smart_canteen', 'user_admin', 'Admin'),
('pm_2', 'proj_smart_canteen', 'user_dev_a', 'Developer'),
('pm_3', 'proj_smart_canteen', 'user_dev_b', 'Developer'),
('pm_4', 'proj_smart_canteen', 'user_reviewer', 'Reviewer'),
('pm_5', 'proj_smart_canteen', 'user_viewer', 'Viewer')
ON CONFLICT (id) DO NOTHING;

-- 4. Files with Real Source Code
INSERT INTO files (id, project_id, path, name, language, module, owner_id, is_directory, content) VALUES
('file_auth_service', 'proj_smart_canteen', 'backend/authService.ts', 'authService.ts', 'typescript', 'Authentication', 'user_dev_a', false,
'export interface AuthResponse {
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

  // Generate verified token
  const token = `cs_jwt_${Date.now()}_${credentials.email}`;
  return {
    token,
    userId: "usr_campus_982",
    role: "student",
    expiresIn: 3600
  };
}

export function verifySessionToken(token: string): boolean {
  return token.startsWith("cs_jwt_");
}
'),

('file_user_service', 'proj_smart_canteen', 'backend/userService.ts', 'userService.ts', 'typescript', 'UserManagement', 'user_dev_a', false,
'import { authenticateUser, verifySessionToken } from "./authService";

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
}
'),

('file_login_view', 'proj_smart_canteen', 'frontend/login.tsx', 'login.tsx', 'typescript', 'FrontendUI', 'user_dev_b', false,
'import React, { useState } from "react";
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
}
'),

('file_dashboard_view', 'proj_smart_canteen', 'frontend/dashboard.tsx', 'dashboard.tsx', 'typescript', 'FrontendUI', 'user_dev_b', false,
'import React from "react";
import { getUserProfile, UserProfile } from "../backend/userService";

export function CanteenDashboard({ token }: { token: string }) {
  const profile: UserProfile = getUserProfile("usr_campus_982", token);

  return (
    <div className="dashboard-grid">
      <header>Welcome, {profile.name}</header>
      <div className="wallet-card">Meal Wallet Balance: ₹{profile.balance}</div>
    </div>
  );
}
'),

('file_auth_test', 'proj_smart_canteen', 'tests/auth.test.ts', 'auth.test.ts', 'typescript', 'Testing', 'user_reviewer', false,
'import { authenticateUser, validatePassword } from "../backend/authService";

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
});
'),

('file_user_test', 'proj_smart_canteen', 'tests/user.test.ts', 'user.test.ts', 'typescript', 'Testing', 'user_reviewer', false,
'import { getUserProfile } from "../backend/userService";

describe("User Service Unit Tests", () => {
  it("should return correct user profile when session token is valid", () => {
    const profile = getUserProfile("usr_campus_982", "cs_jwt_valid_mock");
    expect(profile.id).toBe("usr_campus_982");
    expect(profile.balance).toBeGreaterThan(0);
  });
});
')
ON CONFLICT (id) DO NOTHING;

-- 5. File Ownership Declarations
INSERT INTO file_ownership (id, project_id, file_id, owner_id, assigned_by, status) VALUES
('fo_1', 'proj_smart_canteen', 'file_auth_service', 'user_dev_a', 'user_admin', 'active'),
('fo_2', 'proj_smart_canteen', 'file_user_service', 'user_dev_a', 'user_admin', 'active'),
('fo_3', 'proj_smart_canteen', 'file_login_view', 'user_dev_b', 'user_admin', 'active'),
('fo_4', 'proj_smart_canteen', 'file_dashboard_view', 'user_dev_b', 'user_admin', 'active'),
('fo_5', 'proj_smart_canteen', 'file_auth_test', 'user_reviewer', 'user_admin', 'active'),
('fo_6', 'proj_smart_canteen', 'file_user_test', 'user_reviewer', 'user_admin', 'active')
ON CONFLICT (id) DO NOTHING;

-- 6. Documents & Specifications
INSERT INTO documents (id, project_id, title, doc_type, content, version, verified) VALUES
('doc_req_001', 'proj_smart_canteen', 'R-001: Campus User Authentication & Token Specification', 'requirement', 
'# R-001: Authentication & Session Management
All canteen users (students, faculty, staff) must authenticate using campus credentials.
The backend authentication service must issue a cryptographic token (`cs_jwt_`) containing user identity, role, and expiration window.
The login view must consume this response and securely store the token.', 1, true),

('doc_req_002', 'proj_smart_canteen', 'R-002: Meal Wallet & Profile Retrieval', 'requirement',
'# R-002: Meal Wallet & Profile Retrieval
The system must retrieve student meal balances and dietary preferences upon valid session verification.
Unauthorized or malformed tokens must immediately raise an unauthorized access exception.', 1, true)
ON CONFLICT (id) DO NOTHING;

-- 7. Document-to-Code Traceability Links
INSERT INTO document_links (id, project_id, document_id, target_file_id, target_symbol, link_type) VALUES
('dl_1', 'proj_smart_canteen', 'doc_req_001', 'file_auth_service', 'authenticateUser', 'implements'),
('dl_2', 'proj_smart_canteen', 'doc_req_001', 'file_login_view', 'handleLoginSubmit', 'implements'),
('dl_3', 'proj_smart_canteen', 'doc_req_001', 'file_auth_test', 'testAuthenticateUserValidCredentials', 'verifies'),
('dl_4', 'proj_smart_canteen', 'doc_req_002', 'file_user_service', 'getUserProfile', 'implements'),
('dl_5', 'proj_smart_canteen', 'doc_req_002', 'file_dashboard_view', 'renderUserDashboard', 'implements'),
('dl_6', 'proj_smart_canteen', 'doc_req_002', 'file_user_test', 'testUserProfileBalance', 'verifies')
ON CONFLICT (id) DO NOTHING;

-- 8. Dependency Edges (From AST Analysis)
INSERT INTO dependency_edges (id, project_id, source_file_id, target_file_id, relationship_type, dependency_distance, metadata) VALUES
('dep_1', 'proj_smart_canteen', 'file_login_view', 'file_auth_service', 'IMPORT', 1, '{"symbols": ["authenticateUser", "AuthResponse"]}'::jsonb),
('dep_2', 'proj_smart_canteen', 'file_userService', 'file_auth_service', 'IMPORT', 1, '{"symbols": ["authenticateUser", "verifySessionToken"]}'::jsonb),
('dep_3', 'proj_smart_canteen', 'file_auth_test', 'file_auth_service', 'TEST_REFERENCE', 1, '{"symbols": ["authenticateUser", "validatePassword"]}'::jsonb),
('dep_4', 'proj_smart_canteen', 'file_dashboard_view', 'file_user_service', 'IMPORT', 1, '{"symbols": ["getUserProfile", "UserProfile"]}'::jsonb),
('dep_5', 'proj_smart_canteen', 'file_user_test', 'file_user_service', 'TEST_REFERENCE', 1, '{"symbols": ["getUserProfile"]}'::jsonb)
ON CONFLICT (id) DO NOTHING;
