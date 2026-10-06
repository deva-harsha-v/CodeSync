# CodeSync: Dependency Engine Technical Documentation

The CodeSync Dependency Engine is an independent static analysis component that parses TypeScript and JavaScript source files using the TypeScript Compiler API (`typescript`).

---

## 1. Engine Responsibilities

The Dependency Engine does **NOT** rely on machine learning or heuristic guessing to find relationships. Instead, it parses real source code into Abstract Syntax Trees (ASTs) to discover:
- `IMPORT`: Module imports (default, named, namespace imports).
- `FUNCTION_CALL`: Direct invocation of functions declared in external modules.
- `CLASS_REFERENCE`: Instantiation or extension of classes across files.
- `TYPE_REFERENCE`: TypeScript interface, type alias, or generic parameter references.
- `TEST_REFERENCE`: Test suites (`describe`, `it`, `test`) importing and exercising target files.
- `API_REFERENCE`: Service calls crossing frontend and backend modules.

---

## 2. AST Parsing Architecture

Using `ts.createSourceFile()`:
1. AST visitor walks syntactic nodes:
   - `ts.isImportDeclaration(node)` extracts module specifiers and imported symbols.
   - `ts.isFunctionDeclaration(node)`, `ts.isClassDeclaration(node)`, `ts.isInterfaceDeclaration(node)` record exported symbols.
   - `ts.isCallExpression(node)` records function invocations.
   - `ts.isTypeReferenceNode(node)` records type usages.
2. File path normalization converts Windows backslashes (`\`) to standard Unix slashes (`/`).
3. Relative module resolution maps `./authService` or `../backend/authService` against the registered project files.

---

## 3. Incremental Re-Indexing

To avoid full-repository rebuilds on every keystroke:
1. When file $F$ is saved, only $F$'s source text is re-parsed by `parseSourceFileAST()`.
2. Existing outgoing edges from $F$ are purged from `dependency_edges` and the in-memory graph.
3. New forward edges are constructed and synced to PostgreSQL / SQLite.
4. Reverse edges pointing to $F$ from unchanged files remain preserved.

---

## 4. Candidate Generation for Downstream ML

When $F$ changes:
- Engine executes Breadth-First Search (BFS) over **reverse edges** (incoming dependencies).
- Returns all artifacts that directly or transitively depend on $F$ up to max depth $3$.
- Each candidate includes:
  - `targetFile`: path to candidate file
  - `directDependency`: true if distance is 1
  - `dependencyDistance`: hop distance
  - `relationshipTypes`: e.g. `['FUNCTION_CALL', 'IMPORT']`
  - `symbolsInvolved`: e.g. `['authenticateUser']`
  - `transitivePath`: path trail e.g. `['authService.ts', 'userService.ts', 'dashboard.tsx']`

These candidate objects are passed to the ML Service for probabilistic risk evaluation.
