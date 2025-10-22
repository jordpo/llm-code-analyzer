import { readFile, stat, access } from 'fs/promises';
import { resolve, relative, extname, dirname, join } from 'path';
import { constants } from 'fs';
import fg from 'fast-glob';
import ignore, { Ignore } from 'ignore';
import type { FileMetadata, TraversalOptions, TraversalProgress, ProgressCallback } from '../types';

// Default file extensions to scan for JavaScript/TypeScript files
const DEFAULT_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];

// Default patterns to exclude
const DEFAULT_EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/coverage/**',
  '**/.next/**',
  '**/.cache/**',
  '**/tmp/**',
  '**/temp/**',
  '**/*.min.js',
  '**/*.bundle.js',
];

export class FileScanner {
  private excludePatterns: string[];
  private ignoreFilter: Ignore | null = null;
  private rootPath: string;

  constructor(excludePatterns: string[] = [], rootPath: string = process.cwd()) {
    this.excludePatterns = [...DEFAULT_EXCLUDE_PATTERNS, ...excludePatterns];
    this.rootPath = resolve(rootPath);
  }

  /**
   * Initialize .gitignore-style filtering
   */
  async initializeIgnoreFilter(respectGitignore: boolean = true): Promise<void> {
    this.ignoreFilter = ignore();

    // Add custom exclude patterns
    this.ignoreFilter.add(this.excludePatterns);

    // Load .gitignore if it exists and should be respected
    if (respectGitignore) {
      try {
        const gitignorePath = join(this.rootPath, '.gitignore');
        await access(gitignorePath, constants.R_OK);
        const gitignoreContent = await readFile(gitignorePath, 'utf-8');
        this.ignoreFilter.add(gitignoreContent);
      } catch {
        // .gitignore doesn't exist or isn't readable, continue without it
      }
    }
  }

  /**
   * Scan directory recursively and return all matching file paths
   */
  async scan(
    path: string,
    recursive: boolean = true,
    options?: Partial<TraversalOptions>
  ): Promise<string[]> {
    const targetPath = resolve(path);
    const extensions = options?.extensions || DEFAULT_EXTENSIONS;
    const maxDepth = options?.maxDepth;
    const followSymlinks = options?.followSymlinks ?? false;

    // Initialize ignore filter if not already done
    if (!this.ignoreFilter && options?.respectGitignore !== false) {
      await this.initializeIgnoreFilter(options?.respectGitignore);
    }

    // Build glob patterns for the specified extensions
    const patterns = extensions.map((ext) => {
      const cleanExt = ext.startsWith('.') ? ext.slice(1) : ext;
      return recursive
        ? `**/*.${cleanExt}`
        : `*.${cleanExt}`;
    });

    // Build fast-glob options
    const globOptions = {
      cwd: targetPath,
      absolute: true,
      followSymbolicLinks: followSymlinks,
      ...(maxDepth !== undefined && { deep: maxDepth }),
      ignore: this.excludePatterns,
      onlyFiles: true,
      suppressErrors: true,
    } as const;

    // Scan files using fast-glob - explicitly returns string[] when absolute is true
    const files: string[] = await fg(patterns, globOptions) as string[];

    // Apply .gitignore filtering if enabled
    if (this.ignoreFilter) {
      return files.filter((file) => {
        const relativePath = relative(this.rootPath, file);
        return !this.ignoreFilter!.ignores(relativePath);
      });
    }

    return files;
  }

  /**
   * Scan directory with progress tracking
   */
  async scanWithProgress(
    path: string,
    options: Partial<TraversalOptions> = {},
    onProgress?: ProgressCallback
  ): Promise<FileMetadata[]> {
    const startTime = new Date();
    const files = await this.scan(path, true, options);
    const totalFiles = files.length;
    const fileMetadata: FileMetadata[] = [];
    let processedFiles = 0;
    let errors = 0;

    for (const filePath of files) {
      try {
        const metadata = await this.getFileMetadata(filePath);

        // Check file size limit if specified
        if (options.maxFileSize && metadata.size > options.maxFileSize) {
          errors++;
          continue;
        }

        fileMetadata.push(metadata);
        processedFiles++;

        // Report progress
        if (onProgress) {
          const progress: TraversalProgress = {
            totalFiles,
            processedFiles,
            currentFile: metadata.relativePath,
            errors,
            startTime,
            estimatedTimeRemaining: this.estimateTimeRemaining(
              startTime,
              processedFiles,
              totalFiles
            ),
          };
          onProgress(progress);
        }
      } catch (error) {
        errors++;
        processedFiles++;
      }
    }

    return fileMetadata;
  }

  /**
   * Get metadata for a single file
   */
  async getFileMetadata(filePath: string): Promise<FileMetadata> {
    const absolutePath = resolve(filePath);
    const stats = await stat(absolutePath);
    const extension = extname(absolutePath);
    const relativePath = relative(this.rootPath, absolutePath);

    return {
      path: absolutePath,
      relativePath,
      extension,
      size: stats.size,
      language: this.detectLanguage(extension),
      lastModified: stats.mtime,
    };
  }

  /**
   * Read file contents
   */
  async readFile(filePath: string): Promise<string> {
    try {
      const absolutePath = resolve(filePath);
      return await readFile(absolutePath, 'utf-8');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to read file ${filePath}: ${errorMessage}`);
    }
  }

  /**
   * Check if a path should be excluded
   */
  isExcluded(path: string): boolean {
    if (this.ignoreFilter) {
      const relativePath = relative(this.rootPath, resolve(path));
      return this.ignoreFilter.ignores(relativePath);
    }
    return this.excludePatterns.some((pattern) => path.includes(pattern));
  }

  /**
   * Detect programming language from file extension
   */
  private detectLanguage(extension: string): string {
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.mjs': 'javascript',
      '.cjs': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.cpp': 'cpp',
      '.c': 'c',
      '.rb': 'ruby',
      '.php': 'php',
      '.swift': 'swift',
      '.kt': 'kotlin',
    };

    return languageMap[extension.toLowerCase()] || 'unknown';
  }

  /**
   * Estimate remaining time for file processing
   */
  private estimateTimeRemaining(
    startTime: Date,
    processed: number,
    total: number
  ): number {
    if (processed === 0) return 0;

    const elapsed = Date.now() - startTime.getTime();
    const avgTimePerFile = elapsed / processed;
    const remaining = total - processed;

    return Math.round((avgTimePerFile * remaining) / 1000); // Return in seconds
  }
}
