import type { AnalyzerConfig, Issue, Suggestion, CodeMetrics } from '@/types';
import { ClaudeProvider, type ClaudeProviderOptions } from './claude';

/**
 * Abstract LLM Provider interface
 */
export interface ILLMProvider {
  analyze(
    content: string,
    options: { language: string; rules: string[] }
  ): Promise<{
    issues: Issue[];
    suggestions: Suggestion[];
    metrics: CodeMetrics;
  }>;

  analyzeBatch?(
    items: Array<{ content: string; language: string; rules: string[] }>
  ): Promise<Array<{
    issues: Issue[];
    suggestions: Suggestion[];
    metrics: CodeMetrics;
  }>>;

  getStats?(): any;
  clearCache?(): void;
  destroy?(): void;
}

/**
 * Base LLM Provider class
 * @deprecated Use createProvider() factory function instead
 */
export class LLMProvider implements ILLMProvider {
  private config: AnalyzerConfig;

  constructor(config: AnalyzerConfig) {
    this.config = config;
  }

  analyze(
    content: string,
    _options: { language: string; rules: string[] }
  ): Promise<{
    issues: Issue[];
    suggestions: Suggestion[];
    metrics: CodeMetrics;
  }> {
    // Stub implementation - use createProvider() instead
    return Promise.resolve({
      issues: [],
      suggestions: [],
      metrics: {
        complexity: 0,
        maintainability: 100,
        linesOfCode: content.split('\n').length,
        duplicateLines: 0,
      },
    });
  }
}

/**
 * Create appropriate LLM provider based on configuration
 */
export function createProvider(config: AnalyzerConfig): ILLMProvider {
  switch (config.llmProvider) {
    case 'anthropic': {
      const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable or provide in config.');
      }
      const options: Partial<ClaudeProviderOptions> = {
        apiKey,
        enableCache: true
      };
      if (config.maxConcurrency !== undefined) {
        options.maxConcurrency = config.maxConcurrency;
      }
      return new ClaudeProvider(config, options);
    }

    case 'openai':
      // TODO: Implement OpenAI provider
      throw new Error('OpenAI provider not yet implemented. Use "anthropic" for now.');

    case 'gemini':
      // TODO: Implement Gemini provider
      throw new Error('Gemini provider not yet implemented. Use "anthropic" for now.');

    default:
      throw new Error(`Unknown LLM provider: ${config.llmProvider}`);
  }
}

// Export Claude provider for direct use
export { ClaudeProvider } from './claude';
