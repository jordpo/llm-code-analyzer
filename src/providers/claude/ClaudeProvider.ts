import Anthropic from '@anthropic-ai/sdk';
import type { AnalyzerConfig, Issue, Suggestion, CodeMetrics } from '@/types';
import { getPromptTemplate, getAnalysisTypeFromRules } from './prompts';
import { ResponseCache } from './cache';
import { RateLimiter, RequestQueue } from './rateLimiter';
import { withRetry } from './retry';

/**
 * Claude API response structure
 */
interface ClaudeAnalysisResponse {
  issues: Issue[];
  suggestions: Suggestion[];
  metrics: CodeMetrics;
}

/**
 * Claude provider options
 */
export interface ClaudeProviderOptions {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  enableCache?: boolean;
  cacheTTL?: number;
  maxConcurrency?: number;
  rateLimitTokens?: number;
  rateLimitRefillRate?: number;
}

/**
 * Claude API Provider for code analysis
 * Implements rate limiting, caching, retry logic, and batch processing
 */
export class ClaudeProvider {
  private client: Anthropic;
  private config: AnalyzerConfig;
  private options: Required<ClaudeProviderOptions>;
  private cache: ResponseCache<ClaudeAnalysisResponse>;
  private rateLimiter: RateLimiter;
  private requestQueue: RequestQueue;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: AnalyzerConfig, options?: Partial<ClaudeProviderOptions>) {
    this.config = config;

    // Merge options with defaults
    this.options = {
      apiKey: options?.apiKey || config.apiKey || process.env.ANTHROPIC_API_KEY || '',
      model: options?.model || 'claude-3-5-sonnet-20241022',
      temperature: options?.temperature ?? 0.3,
      maxTokens: options?.maxTokens || 4096,
      enableCache: options?.enableCache ?? true,
      cacheTTL: options?.cacheTTL || 3600000, // 1 hour
      maxConcurrency: options?.maxConcurrency || config.maxConcurrency || 5,
      rateLimitTokens: options?.rateLimitTokens || 50,
      rateLimitRefillRate: options?.rateLimitRefillRate || 5
    };

    if (!this.options.apiKey) {
      throw new Error('Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable or provide in config.');
    }

    // Initialize Anthropic client
    this.client = new Anthropic({
      apiKey: this.options.apiKey
    });

    // Initialize cache
    this.cache = new ResponseCache<ClaudeAnalysisResponse>(this.options.cacheTTL);

    // Initialize rate limiter
    this.rateLimiter = new RateLimiter(
      this.options.rateLimitTokens,
      this.options.rateLimitRefillRate
    );

    // Initialize request queue
    this.requestQueue = new RequestQueue(this.options.maxConcurrency);

    // Start automatic cache cleanup
    if (this.options.enableCache) {
      this.cleanupInterval = this.cache.startAutoCleanup();
    }
  }

  /**
   * Analyze code using Claude API
   */
  async analyze(
    content: string,
    options: { language: string; rules: string[] }
  ): Promise<{
    issues: Issue[];
    suggestions: Suggestion[];
    metrics: CodeMetrics;
  }> {
    // Check cache first
    if (this.options.enableCache) {
      const cached = this.cache.get(content, options);
      if (cached) {
        return cached;
      }
    }

    // Enqueue request and apply rate limiting
    return this.requestQueue.enqueue(async () => {
      await this.rateLimiter.waitForToken();
      return this.analyzeWithRetry(content, options);
    });
  }

  /**
   * Analyze code with retry logic
   */
  private async analyzeWithRetry(
    content: string,
    options: { language: string; rules: string[] }
  ): Promise<ClaudeAnalysisResponse> {
    return withRetry(
      async () => {
        const result = await this.callClaudeAPI(content, options);

        // Cache the result
        if (this.options.enableCache) {
          this.cache.set(content, result, options);
        }

        return result;
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2
      }
    );
  }

  /**
   * Call Claude API
   */
  private async callClaudeAPI(
    content: string,
    options: { language: string; rules: string[] }
  ): Promise<ClaudeAnalysisResponse> {
    try {
      // Determine analysis type and get appropriate prompt
      const analysisType = getAnalysisTypeFromRules(options.rules);
      const promptTemplate = getPromptTemplate(analysisType);

      // Create messages
      const systemPrompt = promptTemplate.system;
      const userPrompt = promptTemplate.user(content, options.language, options.rules);

      // Call Claude API
      const response = await this.client.messages.create({
        model: this.options.model,
        max_tokens: this.options.maxTokens,
        temperature: this.options.temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      });

      // Extract text from response
      const textContent = response.content.find(block => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in Claude response');
      }

      // Parse JSON response
      const analysisResult = this.parseResponse(textContent.text);

      return analysisResult;
    } catch (error) {
      // Handle specific API errors
      if (error instanceof Anthropic.APIError) {
        throw new Error(`Claude API Error (${error.status}): ${error.message}`);
      }

      throw error;
    }
  }

  /**
   * Parse Claude API response
   */
  private parseResponse(text: string): ClaudeAnalysisResponse {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      const jsonText = (jsonMatch && jsonMatch[1]) ? jsonMatch[1] : text;

      const parsed = JSON.parse(jsonText.trim());

      // Validate response structure
      if (!parsed.issues || !parsed.suggestions || !parsed.metrics) {
        throw new Error('Invalid response structure from Claude API');
      }

      return {
        issues: parsed.issues || [],
        suggestions: parsed.suggestions || [],
        metrics: {
          complexity: parsed.metrics.complexity || 0,
          maintainability: parsed.metrics.maintainability || 100,
          linesOfCode: parsed.metrics.linesOfCode || 0,
          duplicateLines: parsed.metrics.duplicateLines || 0,
          testCoverage: parsed.metrics.testCoverage
        }
      };
    } catch (error) {
      console.error('Failed to parse Claude response:', text);
      throw new Error(`Failed to parse Claude API response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch analyze multiple code snippets
   */
  async analyzeBatch(
    items: Array<{ content: string; language: string; rules: string[] }>
  ): Promise<Array<ClaudeAnalysisResponse>> {
    const promises = items.map(item =>
      this.analyze(item.content, {
        language: item.language,
        rules: item.rules
      })
    );

    return Promise.all(promises);
  }

  /**
   * Get provider statistics
   */
  getStats(): {
    cache: { size: number; entries: number };
    rateLimiter: { tokens: number };
    queue: { queued: number; processing: number };
  } {
    return {
      cache: this.cache.getStats(),
      rateLimiter: { tokens: this.rateLimiter.getTokens() },
      queue: this.requestQueue.getStats()
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Reset rate limiter
   */
  resetRateLimiter(): void {
    this.rateLimiter.reset();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
    this.requestQueue.clear();
  }
}
