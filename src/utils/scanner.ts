import { readFile } from 'fs/promises';
import { resolve } from 'path';

export class FileScanner {
  private excludePatterns: string[];

  constructor(excludePatterns: string[]) {
    this.excludePatterns = excludePatterns;
  }

  async scan(path: string, _recursive?: boolean): Promise<string[]> {
    // TODO: Implement file scanning with glob patterns
    return Promise.resolve([path]);
  }

  async readFile(filePath: string): Promise<string> {
    try {
      const absolutePath = resolve(filePath);
      return await readFile(absolutePath, 'utf-8');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to read file ${filePath}: ${errorMessage}`);
    }
  }

  isExcluded(path: string): boolean {
    return this.excludePatterns.some((pattern) => path.includes(pattern));
  }
}
