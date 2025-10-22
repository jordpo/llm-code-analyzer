import { parse, ParserOptions, ParserPlugin } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import type { ASTParseResult, FileMetadata, ParseError } from '../types';

// Babel parser plugins for different file types
const DEFAULT_PLUGINS: ParserPlugin[] = [
  'typescript',
  'jsx',
  'decorators-legacy',
  'classProperties',
  'classPrivateProperties',
  'classPrivateMethods',
  'exportDefaultFrom',
  'exportNamespaceFrom',
  'dynamicImport',
  'nullishCoalescingOperator',
  'optionalChaining',
  'objectRestSpread',
  'asyncGenerators',
  'bigInt',
  'optionalCatchBinding',
  'numericSeparator',
  'importMeta',
];

export interface ASTParserOptions {
  sourceType?: 'module' | 'script' | 'unambiguous';
  plugins?: ParserPlugin[];
  allowReturnOutsideFunction?: boolean;
  errorRecovery?: boolean;
}

export class ASTParser {
  private options: ASTParserOptions;

  constructor(options: ASTParserOptions = {}) {
    this.options = {
      sourceType: 'module',
      plugins: DEFAULT_PLUGINS,
      allowReturnOutsideFunction: true,
      errorRecovery: true,
      ...options,
    };
  }

  /**
   * Parse a file's source code into an AST
   */
  async parseFile(
    sourceCode: string,
    metadata: FileMetadata
  ): Promise<ASTParseResult> {
    const startTime = Date.now();

    try {
      const parserOptions = this.getParserOptions(metadata.extension);
      const ast = parse(sourceCode, parserOptions);

      return {
        success: true,
        ast,
        metadata,
        parseTime: Date.now() - startTime,
      };
    } catch (error) {
      const parseError = this.formatParseError(error, metadata);

      return {
        success: false,
        metadata: {
          ...metadata,
          parseError,
        },
        error: parseError,
        parseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Parse multiple files with error handling
   */
  async parseFiles(
    files: Array<{ sourceCode: string; metadata: FileMetadata }>
  ): Promise<ASTParseResult[]> {
    const results: ASTParseResult[] = [];

    for (const file of files) {
      const result = await this.parseFile(file.sourceCode, file.metadata);
      results.push(result);
    }

    return results;
  }

  /**
   * Extract function declarations from AST
   */
  extractFunctions(ast: any): Array<{
    name: string;
    type: string;
    params: string[];
    loc?: t.SourceLocation | null;
  }> {
    const functions: Array<{
      name: string;
      type: string;
      params: string[];
      loc?: t.SourceLocation | null;
    }> = [];

    traverse(ast, {
      FunctionDeclaration(path: NodePath<t.FunctionDeclaration>) {
        const node = path.node;
        const funcInfo: {
          name: string;
          type: string;
          params: string[];
          loc?: t.SourceLocation | null;
        } = {
          name: node.id?.name || 'anonymous',
          type: 'function',
          params: node.params.map((p) => (t.isIdentifier(p) ? p.name : 'unknown')),
        };
        if (node.loc !== undefined) {
          funcInfo.loc = node.loc;
        }
        functions.push(funcInfo);
      },
      ArrowFunctionExpression(path: NodePath<t.ArrowFunctionExpression>) {
        const parent = path.parent;
        let name = 'anonymous';

        if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
          name = parent.id.name;
        }

        const arrowInfo: {
          name: string;
          type: string;
          params: string[];
          loc?: t.SourceLocation | null;
        } = {
          name,
          type: 'arrow',
          params: path.node.params.map((p) => (t.isIdentifier(p) ? p.name : 'unknown')),
        };
        if (path.node.loc !== undefined) {
          arrowInfo.loc = path.node.loc;
        }
        functions.push(arrowInfo);
      },
      ClassMethod(path: NodePath<t.ClassMethod>) {
        const node = path.node;
        const name = t.isIdentifier(node.key) ? node.key.name : 'unknown';

        const methodInfo: {
          name: string;
          type: string;
          params: string[];
          loc?: t.SourceLocation | null;
        } = {
          name,
          type: node.kind === 'constructor' ? 'constructor' : 'method',
          params: node.params.map((p) => (t.isIdentifier(p) ? p.name : 'unknown')),
        };
        if (node.loc !== undefined) {
          methodInfo.loc = node.loc;
        }
        functions.push(methodInfo);
      },
    });

    return functions;
  }

  /**
   * Extract import statements from AST
   */
  extractImports(ast: any): Array<{
    source: string;
    specifiers: string[];
    type: 'default' | 'named' | 'namespace';
  }> {
    const imports: Array<{
      source: string;
      specifiers: string[];
      type: 'default' | 'named' | 'namespace';
    }> = [];

    traverse(ast, {
      ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
        const node = path.node;
        const specifiers: string[] = [];
        let importType: 'default' | 'named' | 'namespace' = 'named';

        node.specifiers.forEach((spec) => {
          if (t.isImportDefaultSpecifier(spec)) {
            specifiers.push(spec.local.name);
            importType = 'default';
          } else if (t.isImportNamespaceSpecifier(spec)) {
            specifiers.push(spec.local.name);
            importType = 'namespace';
          } else if (t.isImportSpecifier(spec)) {
            specifiers.push(spec.local.name);
          }
        });

        imports.push({
          source: node.source.value,
          specifiers,
          type: importType,
        });
      },
    });

    return imports;
  }

  /**
   * Extract exports from AST
   */
  extractExports(ast: any): Array<{
    name: string;
    type: 'default' | 'named';
  }> {
    const exports: Array<{
      name: string;
      type: 'default' | 'named';
    }> = [];

    traverse(ast, {
      ExportDefaultDeclaration() {
        exports.push({
          name: 'default',
          type: 'default',
        });
      },
      ExportNamedDeclaration(path: NodePath<t.ExportNamedDeclaration>) {
        const node = path.node;

        if (node.declaration) {
          if (t.isVariableDeclaration(node.declaration)) {
            node.declaration.declarations.forEach((decl) => {
              if (t.isIdentifier(decl.id)) {
                exports.push({
                  name: decl.id.name,
                  type: 'named',
                });
              }
            });
          } else if (t.isFunctionDeclaration(node.declaration) && node.declaration.id) {
            exports.push({
              name: node.declaration.id.name,
              type: 'named',
            });
          }
        }

        node.specifiers.forEach((spec) => {
          if (t.isExportSpecifier(spec)) {
            exports.push({
              name: t.isIdentifier(spec.exported) ? spec.exported.name : 'unknown',
              type: 'named',
            });
          }
        });
      },
    });

    return exports;
  }

  /**
   * Get parser options based on file extension
   */
  private getParserOptions(extension: string): ParserOptions {
    const baseOptions: ParserOptions = {
      sourceType: this.options.sourceType || 'module',
      plugins: [...(this.options.plugins || DEFAULT_PLUGINS)],
    };

    // Only add optional properties if they're defined
    if (this.options.errorRecovery !== undefined) {
      baseOptions.errorRecovery = this.options.errorRecovery;
    }
    if (this.options.allowReturnOutsideFunction !== undefined) {
      baseOptions.allowReturnOutsideFunction = this.options.allowReturnOutsideFunction;
    }

    // Adjust plugins based on file type
    switch (extension.toLowerCase()) {
      case '.ts':
      case '.tsx':
        // TypeScript files
        if (!baseOptions.plugins?.includes('typescript')) {
          baseOptions.plugins = [...(baseOptions.plugins || []), 'typescript'];
        }
        if (extension === '.tsx' && !baseOptions.plugins?.includes('jsx')) {
          baseOptions.plugins = [...(baseOptions.plugins || []), 'jsx'];
        }
        break;

      case '.jsx':
        // JSX files - ensure jsx plugin is enabled
        if (!baseOptions.plugins?.includes('jsx')) {
          baseOptions.plugins = [...(baseOptions.plugins || []), 'jsx'];
        }
        break;

      case '.mjs':
        // ES modules - ensure module source type
        baseOptions.sourceType = 'module';
        break;

      case '.cjs':
        // CommonJS - use script source type
        baseOptions.sourceType = 'script';
        break;
    }

    return baseOptions;
  }

  /**
   * Format parse error into a structured error object
   */
  private formatParseError(error: unknown, metadata: FileMetadata): ParseError {
    if (error instanceof Error) {
      // Babel parser errors have a loc property
      const babelError = error as any;

      const parseError: ParseError = {
        message: error.message,
      };

      if (babelError.loc?.line !== undefined) {
        parseError.line = babelError.loc.line;
      }
      if (babelError.loc?.column !== undefined) {
        parseError.column = babelError.loc.column;
      }
      if (error.stack !== undefined) {
        parseError.stack = error.stack;
      }

      return parseError;
    }

    return {
      message: 'Unknown parse error',
    };
  }

  /**
   * Validate if source code is parseable
   */
  async validate(sourceCode: string, extension: string): Promise<boolean> {
    try {
      const parserOptions = this.getParserOptions(extension);
      parse(sourceCode, parserOptions);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get AST node count (complexity metric)
   */
  getNodeCount(ast: any): number {
    let count = 0;

    traverse(ast, {
      enter() {
        count++;
      },
    });

    return count;
  }
}

export default ASTParser;
