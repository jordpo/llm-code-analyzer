import type { AnalyzerConfig } from '@/types';
import { promises as fs } from 'fs';

export async function loadConfig(configPath?: string): Promise<AnalyzerConfig> {
  if (configPath !== undefined && configPath !== '') {
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(content) as AnalyzerConfig;
    } catch (error) {
      throw new Error(
        `Failed to load config from ${configPath}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Return default configuration
  return {
    llmProvider: 'openai',
    rules: ['all'],
    exclude: ['node_modules', 'dist', '.git'],
    outputFormat: 'text',
  };
}
