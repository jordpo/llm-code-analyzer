import type { AnalyzerConfig } from '@/types';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

export async function loadConfig(configPath?: string): Promise<AnalyzerConfig> {
  const apiKey = process.env['OPENAI_API_KEY'];
  const defaultConfig: AnalyzerConfig = {
    llmProvider: 'openai',
    ...(apiKey !== undefined && apiKey !== '' && { apiKey }),
    rules: ['security', 'performance', 'best-practices'],
    exclude: ['node_modules', 'dist', 'build', '.next'],
    outputFormat: 'text',
    maxConcurrency: 5,
  };

  if (configPath !== undefined && configPath !== '') {
    // Load from specified path
    try {
      const fileContent = await readFile(resolve(configPath), 'utf-8');
      const fileConfig = JSON.parse(fileContent) as Partial<AnalyzerConfig>;
      return { ...defaultConfig, ...fileConfig };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to load config from ${configPath}: ${errorMessage}`);
    }
  }

  // Try to load from default locations
  try {
    const fileContent = await readFile(resolve(process.cwd(), '.llm-analyzer.json'), 'utf-8');
    const fileConfig = JSON.parse(fileContent) as Partial<AnalyzerConfig>;
    return { ...defaultConfig, ...fileConfig };
  } catch {
    // If no config file, return defaults
    return defaultConfig;
  }
}
