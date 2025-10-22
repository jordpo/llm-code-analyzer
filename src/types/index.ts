export interface AnalysisResult {
  filePath: string;
  language: string;
  issues: Issue[];
  suggestions: Suggestion[];
  metrics: CodeMetrics;
  timestamp: Date;
}

export interface Issue {
  type: IssueType;
  severity: Severity;
  message: string;
  line?: number;
  column?: number;
  rule: string;
  suggestion?: string;
}

export interface Suggestion {
  type: 'improvement' | 'refactor' | 'optimization';
  message: string;
  code?: string;
  impact: 'low' | 'medium' | 'high';
}

export interface CodeMetrics {
  complexity: number;
  maintainability: number;
  linesOfCode: number;
  duplicateLines: number;
  testCoverage?: number;
}

export type IssueType = 'security' | 'performance' | 'style' | 'bug' | 'smell';
export type Severity = 'error' | 'warning' | 'info';

export interface AnalyzerConfig {
  llmProvider: 'openai' | 'anthropic' | 'gemini';
  apiKey?: string;
  rules: string[];
  exclude: string[];
  language?: string;
  outputFormat: 'json' | 'text' | 'markdown';
  maxConcurrency?: number;
}

export interface LLMProviderConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}
