export type DependencyRelationType =
  | 'IMPORT'
  | 'FUNCTION_CALL'
  | 'CLASS_REFERENCE'
  | 'TYPE_REFERENCE'
  | 'API_REFERENCE'
  | 'TEST_REFERENCE'
  | 'MODULE_REFERENCE';

export interface SymbolReference {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'unknown';
  line: number;
}

export interface ImportDeclarationInfo {
  moduleSpecifier: string;
  defaultImport?: string;
  namedImports: string[];
  resolvedPath?: string;
}

export interface ParsedFileAnalysis {
  filePath: string;
  imports: ImportDeclarationInfo[];
  exportedSymbols: string[];
  calledFunctions: string[];
  referencedTypes: string[];
  referencedClasses: string[];
  isTestFile: boolean;
}

export interface DependencyEdge {
  id?: string;
  sourceFile: string;
  targetFile: string;
  relationshipType: DependencyRelationType;
  dependencyDistance: number;
  metadata: {
    symbols: string[];
    isDirect: boolean;
    callCount?: number;
  };
}

export interface CandidateImpactFile {
  targetFile: string;
  directDependency: boolean;
  dependencyDistance: number;
  relationshipTypes: DependencyRelationType[];
  symbolsInvolved: string[];
  transitivePath: string[];
}
