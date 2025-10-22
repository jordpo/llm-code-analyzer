import type { AnalysisResult } from '@/types';
import { writeFile } from 'fs/promises';

export class ResultFormatter {
  format(results: AnalysisResult[], format: string): string {
    switch (format) {
      case 'json':
        return this.formatJson(results);
      case 'markdown':
        return this.formatMarkdown(results);
      case 'text':
      default:
        return this.formatText(results);
    }
  }

  private formatJson(results: AnalysisResult[]): string {
    return JSON.stringify(results, null, 2);
  }

  private formatText(results: AnalysisResult[]): string {
    let output = '';
    for (const result of results) {
      output += `\n=== ${result.filePath} ===\n`;
      output += `Language: ${result.language}\n`;
      output += `Issues: ${result.issues.length}\n`;
      output += `Suggestions: ${result.suggestions.length}\n`;
      output += `Complexity: ${result.metrics.complexity}\n`;
      output += '\n';
    }
    return output;
  }

  private formatMarkdown(results: AnalysisResult[]): string {
    let output = '# Analysis Results\n\n';
    for (const result of results) {
      output += `## ${result.filePath}\n\n`;
      output += `- **Language:** ${result.language}\n`;
      output += `- **Issues:** ${result.issues.length}\n`;
      output += `- **Suggestions:** ${result.suggestions.length}\n`;
      output += `- **Complexity:** ${result.metrics.complexity}\n\n`;
    }
    return output;
  }

  async save(results: AnalysisResult[], outputPath: string): Promise<void> {
    const content = this.formatJson(results);
    await writeFile(outputPath, content, 'utf-8');
  }
}
