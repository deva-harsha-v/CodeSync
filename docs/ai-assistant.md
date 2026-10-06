# CodeSync: Contextual AI Assistant Architecture

The CodeSync Contextual AI assistant provides grounded explanations and patch recommendations for collaborative developers.

---

## 1. Architectural Separation

CodeSync maintains a strict boundary between three distinct engines:

```text
Structural Relationships ───> Dependency Engine (TypeScript AST)
Impact / Risk Ranking    ───> Machine Learning Service (Random Forest)
Developer Guidance       ───> Contextual AI Assistant (LLM / Expert System)
```

The LLM is **not** responsible for guessing code reachability or inventing probabilities.

---

## 2. Context Construction Pipeline

Before generating an answer, the AI service constructs a rich payload containing:
1. **User Identity & Role:** Ensures guidance matches Developer, Reviewer, or Admin authority.
2. **Current File & Active Diff:** Exact line modifications made in the current session.
3. **AST Graph Context:** Upstream and downstream dependencies connected to the file.
4. **Machine Learning Impact Scores:** Probabilities ($p$) and risk levels for all candidate files.
5. **Execution Traces:** Actual test results, failed assertions, and stack traces.
6. **Traceability Links:** Requirements and specifications associated with the affected functions.

---

## 3. Human-in-the-Loop Safeguards

- The AI assistant **NEVER** silently modifies or writes code directly to files.
- All recommendations are presented as standard `git diff` blocks.
- The developer must explicitly click **"Review & Apply Suggestion"** to merge the fix into the collaborative editor.
- Once merged, the change is processed by the real-time OT engine and re-tested automatically.
