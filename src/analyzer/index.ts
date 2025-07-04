import { AnalysisResult, AnalyzerConfig } from '@/types';
import { LLMProvider } from '@/providers';
import { RuleEngine } from '@/rules';
import { FileScanner } from '@/utils/scanner';
import { ResultFormatter } from '@/utils/formatter';

export class CodeAnalyzer {
  private llmProvider: LLMProvider;
  private ruleEngine: RuleEngine;
  private scanner: FileScanner;
  private formatter: ResultFormatter;

  constructor(config: AnalyzerConfig) {
    this.llmProvider = new LLMProvider(config);
    this.ruleEngine = new RuleEngine(config.rules);
    this.scanner = new FileScanner(config.exclude);
    this.formatter = new ResultFormatter();
  }

  async analyze(path: string, options?: AnalyzeOptions): Promise<AnalysisResult[]> {
    const files = await this.scanner.scan(path, options?.recursive);
    const results: AnalysisResult[] = [];

    for (const file of files) {
      const result = await this.analyzeFile(file);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  async analyzeFile(filePath: string): Promise<AnalysisResult | null> {
    try {
      const content = await this.scanner.readFile(filePath);
      const language = this.detectLanguage(filePath);
      
      const analysis = await this.llmProvider.analyze(content, {
        language,
        rules: this.ruleEngine.getRulesForLanguage(language)
      });

      return {
        filePath,
        language,
        ...analysis,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Failed to analyze ${filePath}:`, error);
      return null;
    }
  }

  private detectLanguage(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      jsx: 'javascript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      go: 'go',
      rs: 'rust',
      cpp: 'cpp',
      c: 'c'
    };
    
    return languageMap[extension || ''] || 'unknown';
  }

  printResults(results: AnalysisResult[], format: string): void {
    const formatted = this.formatter.format(results, format);
    console.log(formatted);
  }

  async saveResults(results: AnalysisResult[], outputPath: string): Promise<void> {
    await this.formatter.save(results, outputPath);
  }
}

interface AnalyzeOptions {
  recursive?: boolean;
  rules?: string[];
  format?: string;
}