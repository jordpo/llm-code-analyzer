/**
 * Prompt templates for Claude API code analysis
 */

export interface PromptTemplate {
  system: string;
  user: (code: string, language: string, rules: string[]) => string;
}

/**
 * Base code analysis prompt template
 */
export const codeAnalysisPrompt: PromptTemplate = {
  system: `You are an expert code analyzer. Your task is to analyze code snippets and provide:
1. Issues: security vulnerabilities, bugs, performance problems, code smells, and style issues
2. Suggestions: improvements, refactoring opportunities, and optimizations
3. Metrics: code complexity, maintainability score, and other quality metrics

Always respond with valid JSON in this exact format:
{
  "issues": [
    {
      "type": "security" | "performance" | "style" | "bug" | "smell",
      "severity": "error" | "warning" | "info",
      "message": "Description of the issue",
      "line": 10,
      "column": 5,
      "rule": "rule-name",
      "suggestion": "How to fix it"
    }
  ],
  "suggestions": [
    {
      "type": "improvement" | "refactor" | "optimization",
      "message": "Description of the suggestion",
      "code": "Suggested code snippet (optional)",
      "impact": "low" | "medium" | "high"
    }
  ],
  "metrics": {
    "complexity": 5,
    "maintainability": 85,
    "linesOfCode": 50,
    "duplicateLines": 0,
    "testCoverage": 80
  }
}

Be specific about line numbers when possible. Focus on actionable feedback.`,

  user: (code: string, language: string, rules: string[]) => {
    const rulesText = rules.length > 0
      ? `\n\nFocus on these specific rules: ${rules.join(', ')}`
      : '';

    return `Analyze this ${language} code:

\`\`\`${language}
${code}
\`\`\`${rulesText}

Provide a comprehensive analysis in valid JSON format.`;
  }
};

/**
 * Security-focused analysis prompt
 */
export const securityAnalysisPrompt: PromptTemplate = {
  system: `You are a security expert specialized in code analysis. Focus on identifying:
- SQL injection vulnerabilities
- XSS (Cross-Site Scripting) risks
- Authentication and authorization flaws
- Sensitive data exposure
- Insecure dependencies
- Cryptographic issues
- Input validation problems

Respond with valid JSON in the standard format, prioritizing security issues.`,

  user: (code: string, language: string, rules: string[]) => {
    return `Perform a security analysis on this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Identify all security vulnerabilities and provide remediation suggestions in JSON format.`;
  }
};

/**
 * Performance-focused analysis prompt
 */
export const performanceAnalysisPrompt: PromptTemplate = {
  system: `You are a performance optimization expert. Focus on identifying:
- Algorithm inefficiencies
- Memory leaks
- Unnecessary computations
- N+1 query problems
- Blocking operations
- Resource management issues
- Caching opportunities

Respond with valid JSON in the standard format, prioritizing performance issues.`,

  user: (code: string, language: string, rules: string[]) => {
    return `Analyze the performance characteristics of this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Identify bottlenecks and optimization opportunities in JSON format.`;
  }
};

/**
 * Code quality and maintainability prompt
 */
export const qualityAnalysisPrompt: PromptTemplate = {
  system: `You are a code quality expert. Focus on:
- Code complexity and readability
- Naming conventions
- Code duplication
- Design patterns
- SOLID principles
- Clean code practices
- Documentation quality

Respond with valid JSON in the standard format, prioritizing maintainability improvements.`,

  user: (code: string, language: string, rules: string[]) => {
    return `Evaluate the quality and maintainability of this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Provide suggestions for improving code quality in JSON format.`;
  }
};

/**
 * Get appropriate prompt template based on analysis type
 */
export function getPromptTemplate(analysisType: 'general' | 'security' | 'performance' | 'quality' = 'general'): PromptTemplate {
  switch (analysisType) {
    case 'security':
      return securityAnalysisPrompt;
    case 'performance':
      return performanceAnalysisPrompt;
    case 'quality':
      return qualityAnalysisPrompt;
    default:
      return codeAnalysisPrompt;
  }
}

/**
 * Determine analysis type from rules
 */
export function getAnalysisTypeFromRules(rules: string[]): 'general' | 'security' | 'performance' | 'quality' {
  const ruleSet = new Set(rules.map(r => r.toLowerCase()));

  if (ruleSet.has('security') || Array.from(ruleSet).some(r => r.includes('security'))) {
    return 'security';
  }
  if (ruleSet.has('performance') || Array.from(ruleSet).some(r => r.includes('performance'))) {
    return 'performance';
  }
  if (ruleSet.has('quality') || ruleSet.has('maintainability')) {
    return 'quality';
  }

  return 'general';
}
