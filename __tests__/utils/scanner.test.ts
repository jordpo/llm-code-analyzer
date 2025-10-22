import { FileScanner } from '../../src/utils/scanner';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';

describe('FileScanner', () => {
  const testDir = join(__dirname, 'test-fixtures');
  let scanner: FileScanner;

  beforeAll(async () => {
    // Create test directory and files
    await mkdir(testDir, { recursive: true });
    await mkdir(join(testDir, 'src'), { recursive: true });
    await mkdir(join(testDir, 'node_modules'), { recursive: true });

    // Create test files
    await writeFile(join(testDir, 'index.js'), 'console.log("test");');
    await writeFile(join(testDir, 'index.ts'), 'const x: number = 1;');
    await writeFile(join(testDir, 'src', 'app.tsx'), 'export const App = () => <div />;');
    await writeFile(join(testDir, 'src', 'utils.js'), 'export const util = () => {};');
    await writeFile(join(testDir, 'node_modules', 'dep.js'), 'module.exports = {};');
    await writeFile(join(testDir, '.gitignore'), 'node_modules/\n*.log');
  });

  afterAll(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    scanner = new FileScanner([], testDir);
  });

  describe('scan', () => {
    it('should find all JS/TS files recursively', async () => {
      const files = await scanner.scan(testDir, true);

      expect(files).toBeInstanceOf(Array);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should exclude node_modules by default', async () => {
      const files = await scanner.scan(testDir, true);

      const hasNodeModules = files.some((f) => f.includes('node_modules'));
      expect(hasNodeModules).toBe(false);
    });

    it('should find specific file extensions', async () => {
      const files = await scanner.scan(testDir, true, {
        extensions: ['.ts', '.tsx'],
      });

      expect(files.every((f) => f.endsWith('.ts') || f.endsWith('.tsx'))).toBe(true);
    });

    it('should respect custom exclude patterns', async () => {
      const customScanner = new FileScanner(['**/src/**'], testDir);
      const files = await customScanner.scan(testDir, true);

      const hasSrcFiles = files.some((f) => f.includes('/src/'));
      expect(hasSrcFiles).toBe(false);
    });
  });

  describe('scanWithProgress', () => {
    it('should track progress during scanning', async () => {
      const progressUpdates: number[] = [];

      await scanner.scanWithProgress(
        testDir,
        {},
        (progress) => {
          progressUpdates.push(progress.processedFiles);
        }
      );

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBeGreaterThan(0);
    });

    it('should return file metadata', async () => {
      const files = await scanner.scanWithProgress(testDir);

      expect(files.length).toBeGreaterThan(0);
      expect(files[0]).toHaveProperty('path');
      expect(files[0]).toHaveProperty('relativePath');
      expect(files[0]).toHaveProperty('extension');
      expect(files[0]).toHaveProperty('size');
      expect(files[0]).toHaveProperty('language');
    });
  });

  describe('getFileMetadata', () => {
    it('should return correct metadata for a file', async () => {
      const testFile = join(testDir, 'index.js');
      const metadata = await scanner.getFileMetadata(testFile);

      expect(metadata.extension).toBe('.js');
      expect(metadata.language).toBe('javascript');
      expect(metadata.size).toBeGreaterThan(0);
      expect(metadata.lastModified).toBeTruthy();
      expect(metadata.lastModified.getTime()).toBeGreaterThan(0);
    });

    it('should detect TypeScript language', async () => {
      const testFile = join(testDir, 'index.ts');
      const metadata = await scanner.getFileMetadata(testFile);

      expect(metadata.language).toBe('typescript');
    });
  });

  describe('readFile', () => {
    it('should read file contents', async () => {
      const testFile = join(testDir, 'index.js');
      const content = await scanner.readFile(testFile);

      expect(content).toBe('console.log("test");');
    });

    it('should throw error for non-existent file', async () => {
      await expect(scanner.readFile(join(testDir, 'nonexistent.js'))).rejects.toThrow();
    });
  });

  describe('isExcluded', () => {
    it('should return true for excluded paths', async () => {
      await scanner.initializeIgnoreFilter(true);

      const excluded = scanner.isExcluded(join(testDir, 'node_modules', 'dep.js'));
      expect(excluded).toBe(true);
    });

    it('should return false for non-excluded paths', async () => {
      await scanner.initializeIgnoreFilter(true);

      const excluded = scanner.isExcluded(join(testDir, 'index.js'));
      expect(excluded).toBe(false);
    });
  });
});
