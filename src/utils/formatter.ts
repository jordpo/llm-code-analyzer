import type { AnalysisResult } from '@/types';
import { promises as fs } from 'fs';

export class ResultFormatter {
  format(results: AnalysisResult[], _format: string): string {
    // TODO: Implement proper formatting logic
    return JSON.stringify(results, null, 2);
  }

  async save(results: AnalysisResult[], outputPath: string): Promise<void> {
    const content = JSON.stringify(results, null, 2);
    await fs.writeFile(outputPath, content, 'utf-8');
  }
}
