import { ASTParser } from '../../src/utils/ast-parser';
import type { FileMetadata } from '../../src/types';

describe('ASTParser', () => {
  let parser: ASTParser;

  beforeEach(() => {
    parser = new ASTParser();
  });

  const createMockMetadata = (extension: string): FileMetadata => ({
    path: `/test/file${extension}`,
    relativePath: `file${extension}`,
    extension,
    size: 100,
    language: extension.includes('ts') ? 'typescript' : 'javascript',
    lastModified: new Date(),
  });

  describe('parseFile', () => {
    it('should successfully parse valid JavaScript', async () => {
      const sourceCode = `
        const x = 1;
        function test() {
          return x + 1;
        }
      `;
      const metadata = createMockMetadata('.js');

      const result = await parser.parseFile(sourceCode, metadata);

      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      expect(result.parseTime).toBeGreaterThanOrEqual(0);
    });

    it('should successfully parse valid TypeScript', async () => {
      const sourceCode = `
        const x: number = 1;
        function test(): number {
          return x + 1;
        }
      `;
      const metadata = createMockMetadata('.ts');

      const result = await parser.parseFile(sourceCode, metadata);

      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
    });

    it('should successfully parse JSX', async () => {
      const sourceCode = `
        const Component = () => {
          return <div>Hello</div>;
        };
      `;
      const metadata = createMockMetadata('.jsx');

      const result = await parser.parseFile(sourceCode, metadata);

      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
    });

    it('should successfully parse TSX', async () => {
      const sourceCode = `
        interface Props {
          name: string;
        }
        const Component: React.FC<Props> = ({ name }) => {
          return <div>Hello {name}</div>;
        };
      `;
      const metadata = createMockMetadata('.tsx');

      const result = await parser.parseFile(sourceCode, metadata);

      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
    });

    it('should handle syntax errors gracefully', async () => {
      const sourceCode = `
        const x = {
          invalid syntax here
        };
      `;
      const metadata = createMockMetadata('.js');

      const result = await parser.parseFile(sourceCode, metadata);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBeDefined();
    });

    it('should include error details for malformed code', async () => {
      const sourceCode = 'function test() { return }}}';
      const metadata = createMockMetadata('.js');

      const result = await parser.parseFile(sourceCode, metadata);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.metadata.parseError).toBeDefined();
    });
  });

  describe('extractFunctions', () => {
    it('should extract function declarations', async () => {
      const sourceCode = `
        function test() {}
        function another(a, b) { return a + b; }
      `;
      const metadata = createMockMetadata('.js');
      const result = await parser.parseFile(sourceCode, metadata);

      const functions = parser.extractFunctions(result.ast);

      expect(functions).toHaveLength(2);
      expect(functions[0].name).toBe('test');
      expect(functions[0].type).toBe('function');
      expect(functions[1].name).toBe('another');
      expect(functions[1].params).toEqual(['a', 'b']);
    });

    it('should extract arrow functions', async () => {
      const sourceCode = `
        const arrow = () => {};
        const withParams = (x, y) => x + y;
      `;
      const metadata = createMockMetadata('.js');
      const result = await parser.parseFile(sourceCode, metadata);

      const functions = parser.extractFunctions(result.ast);

      expect(functions.length).toBeGreaterThanOrEqual(2);
      expect(functions.some((f) => f.type === 'arrow')).toBe(true);
    });

    it('should extract class methods', async () => {
      const sourceCode = `
        class Test {
          constructor(name) {
            this.name = name;
          }

          getName() {
            return this.name;
          }

          setName(name) {
            this.name = name;
          }
        }
      `;
      const metadata = createMockMetadata('.js');
      const result = await parser.parseFile(sourceCode, metadata);

      const functions = parser.extractFunctions(result.ast);

      expect(functions.length).toBeGreaterThanOrEqual(3);
      expect(functions.some((f) => f.type === 'constructor')).toBe(true);
      expect(functions.some((f) => f.type === 'method')).toBe(true);
    });
  });

  describe('extractImports', () => {
    it('should extract default imports', async () => {
      const sourceCode = `
        import React from 'react';
        import lodash from 'lodash';
      `;
      const metadata = createMockMetadata('.js');
      const result = await parser.parseFile(sourceCode, metadata);

      const imports = parser.extractImports(result.ast);

      expect(imports).toHaveLength(2);
      expect(imports[0].type).toBe('default');
      expect(imports[0].source).toBe('react');
    });

    it('should extract named imports', async () => {
      const sourceCode = `
        import { useState, useEffect } from 'react';
      `;
      const metadata = createMockMetadata('.js');
      const result = await parser.parseFile(sourceCode, metadata);

      const imports = parser.extractImports(result.ast);

      expect(imports).toHaveLength(1);
      expect(imports[0].type).toBe('named');
      expect(imports[0].specifiers).toContain('useState');
      expect(imports[0].specifiers).toContain('useEffect');
    });

    it('should extract namespace imports', async () => {
      const sourceCode = `
        import * as utils from './utils';
      `;
      const metadata = createMockMetadata('.js');
      const result = await parser.parseFile(sourceCode, metadata);

      const imports = parser.extractImports(result.ast);

      expect(imports).toHaveLength(1);
      expect(imports[0].type).toBe('namespace');
    });
  });

  describe('extractExports', () => {
    it('should extract default exports', async () => {
      const sourceCode = `
        export default function test() {}
      `;
      const metadata = createMockMetadata('.js');
      const result = await parser.parseFile(sourceCode, metadata);

      const exports = parser.extractExports(result.ast);

      expect(exports.some((e) => e.type === 'default')).toBe(true);
    });

    it('should extract named exports', async () => {
      const sourceCode = `
        export const x = 1;
        export function test() {}
        export { y, z };
      `;
      const metadata = createMockMetadata('.js');
      const result = await parser.parseFile(sourceCode, metadata);

      const exports = parser.extractExports(result.ast);

      expect(exports.length).toBeGreaterThan(0);
      expect(exports.every((e) => e.name)).toBe(true);
    });
  });

  describe('validate', () => {
    it('should return true for valid code', async () => {
      const sourceCode = 'const x = 1;';
      const isValid = await parser.validate(sourceCode, '.js');

      expect(isValid).toBe(true);
    });

    it('should return false for invalid code', async () => {
      const sourceCode = 'const x = {{{';
      const isValid = await parser.validate(sourceCode, '.js');

      expect(isValid).toBe(false);
    });
  });

  describe('getNodeCount', () => {
    it('should count AST nodes', async () => {
      const sourceCode = `
        const x = 1;
        function test() {
          return x + 1;
        }
      `;
      const metadata = createMockMetadata('.js');
      const result = await parser.parseFile(sourceCode, metadata);

      const count = parser.getNodeCount(result.ast);

      expect(count).toBeGreaterThan(0);
    });
  });

  describe('parseFiles', () => {
    it('should parse multiple files', async () => {
      const files = [
        {
          sourceCode: 'const a = 1;',
          metadata: createMockMetadata('.js'),
        },
        {
          sourceCode: 'const b: number = 2;',
          metadata: createMockMetadata('.ts'),
        },
      ];

      const results = await parser.parseFiles(files);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('should handle mixed success/failure cases', async () => {
      const files = [
        {
          sourceCode: 'const a = 1;',
          metadata: createMockMetadata('.js'),
        },
        {
          sourceCode: 'const b = {{{',
          metadata: createMockMetadata('.js'),
        },
      ];

      const results = await parser.parseFiles(files);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });
});
