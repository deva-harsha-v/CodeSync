# CodeSync: Contextual AI Assistant Architecture

**Dependency-, Risk-, and Test-Aware Automated Software Engineering Assistance**

---

## 1. Problem Statement

Generic code completion and AI chat tools (e.g., standard Copilot or general ChatGPT) suffer from "context blindness":
- They only examine the currently opened file buffer.
- They are unaware of AST reverse-dependencies across other modules.
- They do not know which automated tests failed or why.
- They generate hallucinated suggestions that frequently break downstream contracts.

CodeSync introduces a **Contextual AI Diagnosis and Remediation Pipeline** that injects full multi-tier context into the AI model before prompt compilation.

---

## 2. Injected Context Bundle

When a developer triggers AI analysis (either manually or automatically upon test failure), CodeSync assembles:

```typescript
interface AIContextPayload {
  projectId: string;
  currentFilePath: string;
  currentFileContent: string;
  diffContent?: string;
  testResults?: {
    status: 'passed' | 'failed';
    failedTests: number;
    results: Array<{ testName: string; errorMessage: string; stackTrace: string }>;
  };
  mlImpacts?: Array<{
    targetFile: string;
    impactProbability: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    explanationFactors: string[];
  }>;
  astRelationships: Array<{ source: string; target: string; type: string }>;
}
```

---

## 3. Dual-Mode Execution Architecture

### 3.1. Primary Engine: Google Gemini 2.5 Flash
- Configured via `GEMINI_API_KEY` in `.env`.
- Generates high-level architectural root-cause reasoning, security implications, and formatted git unified diffs.
- Formats structured JSON containing:
  - `rootCause`: Precise technical diagnosis.
  - `affectedModules`: List of downstream artifacts threatened.
  - `riskAssessment`: Combined regression severity.
  - `fixSuggestion`: Code diff with line-by-line replacement string.

### 3.2. Secondary Engine: Deterministic Research Mode (Offline Fallback)
- If the Gemini API is offline, unconfigured, or rate-limited, CodeSync seamlessly transitions to its built-in **Deterministic Research Engine**.
- Synthesizes:
  - Failure signature regex parsing (`AssertionError`, `TypeError`, undefined token).
  - AST dependency path extraction (e.g., `authService.ts` $\rightarrow$ `login.tsx`).
  - Syntactically compliant contract restoration patches for demonstration modules.
- **Guarantee**: Zero downtime during academic presentations or offline defenses.

---

## 4. Human-in-the-Loop Review & One-Click Apply

CodeSync adheres to responsible AI software engineering principles:
- The AI never commits code to files silently.
- Proposed patches are presented in the **Contextual AI Panel** with side-by-side diff highlighting.
- The developer reviews the suggestion and clicks **"? Apply Suggested Fix"**.
- Upon application:
  1. File is saved and new version is recorded.
  2. AST dependency graph is updated.
  3. ML pipeline re-evaluates risk.
  4. Test runner automatically executes relevant tests to verify resolution.
