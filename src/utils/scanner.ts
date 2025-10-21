import { promises as fs } from 'fs';

export class FileScanner {
  private exclude: string[];

  constructor(exclude: string[]) {
    this.exclude = exclude;
  }

  scan(_path: string, _recursive?: boolean): Promise<string[]> {
    // TODO: Implement file scanning logic
    return Promise.resolve([]);
  }

  async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }
}
