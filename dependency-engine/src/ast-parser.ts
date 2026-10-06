import * as ts from 'typescript';
import { ParsedFileAnalysis, ImportDeclarationInfo } from './types';

/**
 * Parses a TypeScript or JavaScript source string using the TypeScript Compiler API.
 */
export function parseSourceFileAST(filePath: string, sourceText: string): ParsedFileAnalysis {
  const isTsx = filePath.endsWith('.tsx') || filePath.endsWith('.jsx');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const imports: ImportDeclarationInfo[] = [];
  const exportedSymbols: string[] = [];
  const calledFunctions: Set<string> = new Set();
  const referencedTypes: Set<string> = new Set();
  const referencedClasses: Set<string> = new Set();

  const isTestFile =
    filePath.includes('.test.') ||
    filePath.includes('.spec.') ||
    filePath.startsWith('tests/') ||
    filePath.includes('/tests/');

  function visit(node: ts.Node) {
    // 1. Import Declarations
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
      let defaultImport: string | undefined;
      const namedImports: string[] = [];

      if (node.importClause) {
        if (node.importClause.name) {
          defaultImport = node.importClause.name.text;
        }
        if (node.importClause.namedBindings) {
          if (ts.isNamedImports(node.importClause.namedBindings)) {
            for (const element of node.importClause.namedBindings.elements) {
              namedImports.push(element.name.text);
            }
          }
        }
      }

      imports.push({
        moduleSpecifier,
        defaultImport,
        namedImports
      });
    }

    // 2. Export Declarations & Exported Symbols
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node)
    ) {
      const isExported =
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
      if (isExported && node.name) {
        exportedSymbols.push(node.name.text);
      }
    }

    // 3. Function Calls
    if (ts.isCallExpression(node)) {
      if (ts.isIdentifier(node.expression)) {
        calledFunctions.add(node.expression.text);
      } else if (ts.isPropertyAccessExpression(node.expression)) {
        calledFunctions.add(node.expression.name.text);
      }
    }

    // 4. Class Instantiations
    if (ts.isNewExpression(node)) {
      if (ts.isIdentifier(node.expression)) {
        referencedClasses.add(node.expression.text);
      }
    }

    // 5. Type References
    if (ts.isTypeReferenceNode(node)) {
      if (ts.isIdentifier(node.typeName)) {
        referencedTypes.add(node.typeName.text);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return {
    filePath,
    imports,
    exportedSymbols,
    calledFunctions: Array.from(calledFunctions),
    referencedTypes: Array.from(referencedTypes),
    referencedClasses: Array.from(referencedClasses),
    isTestFile
  };
}
