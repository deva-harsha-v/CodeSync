import * as path from 'path';
import {
  ParsedFileAnalysis,
  DependencyEdge,
  DependencyRelationType,
  CandidateImpactFile
} from './types';

export class DependencyGraph {
  // outgoing: file -> list of files it depends on (source -> targets)
  private forwardEdges: Map<string, DependencyEdge[]> = new Map();
  // incoming: file -> list of files that depend on it (target -> sources)
  private reverseEdges: Map<string, DependencyEdge[]> = new Map();
  // registry of known project files
  private projectFiles: Set<string> = new Set();

  /**
   * Clears the graph state.
   */
  public clear(): void {
    this.forwardEdges.clear();
    this.reverseEdges.clear();
    this.projectFiles.clear();
  }

  /**
   * Normalizes a file path to unix forward slashes.
   */
  public normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/').replace(/^\.\//, '');
  }

  /**
   * Registers a project file.
   */
  public registerFile(filePath: string): void {
    const norm = this.normalizePath(filePath);
    this.projectFiles.add(norm);
    if (!this.forwardEdges.has(norm)) this.forwardEdges.set(norm, []);
    if (!this.reverseEdges.has(norm)) this.reverseEdges.set(norm, []);
  }

  /**
   * Resolves an import specifier relative to the importing file against known project files.
   */
  public resolveModulePath(fromFile: string, moduleSpecifier: string): string | null {
    if (!moduleSpecifier.startsWith('.')) {
      // Third-party or package import
      return null;
    }

    const fromDir = path.dirname(fromFile);
    const resolvedRaw = path.normalize(path.join(fromDir, moduleSpecifier));
    const resolved = this.normalizePath(resolvedRaw);

    const candidates = [
      resolved,
      `${resolved}.ts`,
      `${resolved}.tsx`,
      `${resolved}.js`,
      `${resolved}.jsx`,
      `${resolved}/index.ts`,
      `${resolved}/index.tsx`
    ];

    for (const c of candidates) {
      if (this.projectFiles.has(c)) {
        return c;
      }
    }

    // Fuzzy matching against normalized paths
    const baseTarget = path.basename(resolved);
    for (const pf of this.projectFiles) {
      if (pf.includes(baseTarget)) {
        return pf;
      }
    }

    return null;
  }

  /**
   * Updates dependencies for a single analyzed file.
   */
  public updateFileDependencies(analysis: ParsedFileAnalysis): DependencyEdge[] {
    const sourceFile = this.normalizePath(analysis.filePath);
    this.registerFile(sourceFile);

    // Remove existing outgoing edges from this file
    const oldEdges = this.forwardEdges.get(sourceFile) || [];
    for (const edge of oldEdges) {
      const rev = this.reverseEdges.get(edge.targetFile) || [];
      this.reverseEdges.set(
        edge.targetFile,
        rev.filter((e) => e.sourceFile !== sourceFile)
      );
    }
    this.forwardEdges.set(sourceFile, []);

    const newEdges: DependencyEdge[] = [];

    for (const imp of analysis.imports) {
      const targetFile = this.resolveModulePath(sourceFile, imp.moduleSpecifier);
      if (!targetFile || targetFile === sourceFile) continue;

      const symbols = [...imp.namedImports];
      if (imp.defaultImport) symbols.push(imp.defaultImport);

      // Determine relation type
      let relationType: DependencyRelationType = 'IMPORT';
      if (analysis.isTestFile) {
        relationType = 'TEST_REFERENCE';
      } else if (symbols.some((s) => analysis.calledFunctions.includes(s))) {
        relationType = 'FUNCTION_CALL';
      } else if (symbols.some((s) => analysis.referencedTypes.includes(s))) {
        relationType = 'TYPE_REFERENCE';
      } else if (symbols.some((s) => analysis.referencedClasses.includes(s))) {
        relationType = 'CLASS_REFERENCE';
      }

      const edge: DependencyEdge = {
        sourceFile,
        targetFile,
        relationshipType: relationType,
        dependencyDistance: 1,
        metadata: {
          symbols,
          isDirect: true,
          callCount: symbols.filter((s) => analysis.calledFunctions.includes(s)).length
        }
      };

      newEdges.push(edge);
      this.forwardEdges.get(sourceFile)!.push(edge);

      if (!this.reverseEdges.has(targetFile)) {
        this.reverseEdges.set(targetFile, []);
      }
      this.reverseEdges.get(targetFile)!.push(edge);
    }

    return newEdges;
  }

  /**
   * Identifies candidate affected files when `changedFile` is modified.
   * Traverses reverse edges (files that depend on `changedFile`).
   */
  public getCandidateImpactFiles(changedFile: string, maxDepth: number = 3): CandidateImpactFile[] {
    const normChanged = this.normalizePath(changedFile);
    const candidates: Map<string, CandidateImpactFile> = new Map();

    // BFS queue: [currentFile, currentDepth, pathSoFar]
    const queue: Array<{ file: string; depth: number; path: string[] }> = [
      { file: normChanged, depth: 0, path: [normChanged] }
    ];
    const visited = new Set<string>([normChanged]);

    while (queue.length > 0) {
      const { file, depth, path: currentPath } = queue.shift()!;
      if (depth >= maxDepth) continue;

      // Find files that depend on 'file'
      const dependents = this.reverseEdges.get(file) || [];
      for (const edge of dependents) {
        const depFile = edge.sourceFile;
        const nextDepth = depth + 1;
        const nextPath = [...currentPath, depFile];

        if (!candidates.has(depFile)) {
          candidates.set(depFile, {
            targetFile: depFile,
            directDependency: nextDepth === 1,
            dependencyDistance: nextDepth,
            relationshipTypes: [edge.relationshipType],
            symbolsInvolved: [...edge.metadata.symbols],
            transitivePath: nextPath
          });
        } else {
          const existing = candidates.get(depFile)!;
          if (!existing.relationshipTypes.includes(edge.relationshipType)) {
            existing.relationshipTypes.push(edge.relationshipType);
          }
          for (const s of edge.metadata.symbols) {
            if (!existing.symbolsInvolved.includes(s)) {
              existing.symbolsInvolved.push(s);
            }
          }
        }

        if (!visited.has(depFile)) {
          visited.add(depFile);
          queue.push({ file: depFile, depth: nextDepth, path: nextPath });
        }
      }
    }

    return Array.from(candidates.values());
  }

  /**
   * Returns all edges for graph visualization.
   */
  public getAllEdges(): DependencyEdge[] {
    const all: DependencyEdge[] = [];
    for (const edges of this.forwardEdges.values()) {
      all.push(...edges);
    }
    return all;
  }

  /**
   * Returns all known files.
   */
  public getAllFiles(): string[] {
    return Array.from(this.projectFiles);
  }
}
