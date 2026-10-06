import { parseSourceFileAST } from './ast-parser';
import { DependencyGraph } from './graph-builder';

// Sample source code from Smart Canteen demonstration scenario
const authServiceCode = `
export interface AuthResponse {
  token: string;
  userId: string;
  role: string;
}

export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

export function authenticateUser(credentials: any): AuthResponse {
  return { token: "token", userId: "usr", role: "student" };
}
`;

const userServiceCode = `
import { authenticateUser, validatePassword } from "./authService";

export function getUserProfile(userId: string) {
  return { id: userId, name: "Aarav" };
}
`;

const loginViewCode = `
import React from 'react';
import { authenticateUser, AuthResponse } from '../backend/authService';

export function LoginForm() {
  authenticateUser({ email: "test" });
  return null;
}
`;

const authTestCode = `
import { authenticateUser, validatePassword } from '../backend/authService';

describe("Auth test", () => {
  it("authenticates", () => {
    authenticateUser({ email: "test" });
  });
});
`;

console.log("=== RUNNING DEPENDENCY ENGINE VERIFICATION ===");

const graph = new DependencyGraph();

// Register and parse files
const files = [
  { path: 'backend/authService.ts', code: authServiceCode },
  { path: 'backend/userService.ts', code: userServiceCode },
  { path: 'frontend/login.tsx', code: loginViewCode },
  { path: 'tests/auth.test.ts', code: authTestCode }
];

for (const f of files) {
  graph.registerFile(f.path);
}

for (const f of files) {
  const analysis = parseSourceFileAST(f.path, f.code);
  const edges = graph.updateFileDependencies(analysis);
  console.log(`Parsed ${f.path}: found ${edges.length} outgoing dependency edges`);
}

console.log("\nAll edges detected:");
for (const e of graph.getAllEdges()) {
  console.log(`  ${e.sourceFile} --[${e.relationshipType}]--> ${e.targetFile} (symbols: ${e.metadata.symbols.join(', ')})`);
}

console.log("\nTesting Candidate Extraction when 'backend/authService.ts' changes:");
const candidates = graph.getCandidateImpactFiles('backend/authService.ts');
console.log(`Found ${candidates.length} candidate files:`);
for (const c of candidates) {
  console.log(`  Candidate: ${c.targetFile} | Direct: ${c.directDependency} | Dist: ${c.dependencyDistance} | Types: ${c.relationshipTypes.join(', ')} | Path: ${c.transitivePath.join(' -> ')}`);
}

if (candidates.length === 3) {
  console.log("\n SUCCESS: Exactly 3 candidate files identified (userService.ts, login.tsx, auth.test.ts)!");
} else {
  console.error(`\n FAILED: Expected 3 candidates, got ${candidates.length}`);
  process.exit(1);
}
