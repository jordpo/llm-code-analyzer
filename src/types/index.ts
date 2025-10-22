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

// File system and AST types
export interface FileMetadata {
  path: string;
  relativePath: string;
  extension: string;
  size: number;
  language: string;
  lastModified: Date;
  parseError?: ParseError;
}

export interface ParseError {
  message: string;
  line?: number;
  column?: number;
  stack?: string;
}

export interface ASTParseResult {
  success: boolean;
  ast?: any; // Babel AST node
  metadata: FileMetadata;
  error?: ParseError;
  parseTime: number;
}

export interface TraversalOptions {
  rootPath: string;
  extensions?: string[];
  exclude?: string[];
  maxDepth?: number;
  followSymlinks?: boolean;
  respectGitignore?: boolean;
  maxFileSize?: number; // in bytes
}

export interface TraversalProgress {
  totalFiles: number;
  processedFiles: number;
  currentFile: string;
  errors: number;
  startTime: Date;
  estimatedTimeRemaining?: number;
}

export type ProgressCallback = (progress: TraversalProgress) => void;
