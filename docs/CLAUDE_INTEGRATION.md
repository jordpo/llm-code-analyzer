# Claude API Integration

This document describes the Anthropic Claude API integration for intelligent code analysis.

## Overview

The LLM Code Analyzer now supports Anthropic's Claude API for advanced code analysis. The integration includes:

- ✅ Robust API integration with Anthropic SDK
- ✅ Multiple analysis types (general, security, performance, quality)
- ✅ Rate limiting to prevent API throttling
- ✅ Response caching to reduce API costs
- ✅ Retry logic with exponential backoff
- ✅ Batch processing for multiple files
- ✅ Structured JSON output parsing

## Setup

### 1. Install Dependencies

The Anthropic SDK is already included in the project dependencies:

```bash
npm install
```

### 2. Set API Key

Create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

Add your Anthropic API key:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Get your API key from: https://console.anthropic.com/

### 3. Configure Analyzer

Update your `.llm-analyzer.json` configuration:

```json
{
  "llmProvider": "anthropic",
  "rules": ["security", "performance", "style"],
  "exclude": ["node_modules/**", "dist/**"],
  "outputFormat": "json",
  "maxConcurrency": 5
}
```

## Usage

### CLI Usage

Analyze a file:

```bash
npx llm-code-analyzer analyze src/app/page.tsx
```

Analyze a directory recursively:

```bash
npx llm-code-analyzer analyze src/ --recursive
```

With specific rules:

```bash
npx llm-code-analyzer analyze src/ --rules security,performance
```

Save results to file:

```bash
npx llm-code-analyzer analyze src/ -o results.json
```

### Programmatic Usage

```typescript
import { ClaudeProvider } from './src/providers/claude';
import type { AnalyzerConfig } from './src/types';

// Create configuration
const config: AnalyzerConfig = {
  llmProvider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  rules: ['security', 'performance'],
  exclude: [],
  outputFormat: 'json',
  maxConcurrency: 5
};

// Create provider
const provider = new ClaudeProvider(config, {
  enableCache: true,
  cacheTTL: 3600000, // 1 hour
  maxConcurrency: 5
});

// Analyze code
const result = await provider.analyze(codeContent, {
  language: 'typescript',
  rules: ['security', 'performance']
});

console.log('Issues:', result.issues);
console.log('Suggestions:', result.suggestions);
console.log('Metrics:', result.metrics);

// Cleanup when done
provider.destroy();
```

## Features

### 1. Prompt Templates

The integration includes specialized prompt templates for different analysis types:

- **General Analysis**: Comprehensive code review
- **Security Analysis**: Focus on security vulnerabilities
- **Performance Analysis**: Identify performance bottlenecks
- **Quality Analysis**: Code quality and maintainability

The appropriate template is automatically selected based on the rules provided.

### 2. Rate Limiting

Built-in token bucket rate limiter prevents API throttling:

- Default: 50 tokens with 5 tokens/second refill rate
- Configurable via `ClaudeProviderOptions`
- Automatic request queuing when limit reached

```typescript
const provider = new ClaudeProvider(config, {
  rateLimitTokens: 100,
  rateLimitRefillRate: 10
});
```

### 3. Response Caching

In-memory cache reduces API costs by storing recent analysis results:

- SHA-256 based cache keys
- Configurable TTL (default: 1 hour)
- Automatic cleanup of expired entries

```typescript
const provider = new ClaudeProvider(config, {
  enableCache: true,
  cacheTTL: 7200000 // 2 hours
});

// Clear cache manually
provider.clearCache();
```

### 4. Retry Logic

Automatic retry with exponential backoff for transient failures:

- Default: 3 retries with exponential backoff
- Retries on rate limits, timeouts, and network errors
- Configurable backoff multiplier and max delay

Retryable errors:
- Rate limit errors (429)
- Server errors (500, 503)
- Network errors (ECONNRESET, ETIMEDOUT)

### 5. Batch Processing

Analyze multiple files efficiently with concurrent processing:

```typescript
const items = [
  { content: code1, language: 'typescript', rules: ['security'] },
  { content: code2, language: 'javascript', rules: ['performance'] },
  { content: code3, language: 'python', rules: ['quality'] }
];

const results = await provider.analyzeBatch(items);
```

### 6. Request Queue

Manages concurrent API requests:

- Default: 5 concurrent requests
- Automatic queuing when limit reached
- Prevents overwhelming the API

### 7. Structured Output

Claude responses are parsed into structured data:

```typescript
interface AnalysisResult {
  issues: Array<{
    type: 'security' | 'performance' | 'style' | 'bug' | 'smell';
    severity: 'error' | 'warning' | 'info';
    message: string;
    line?: number;
    column?: number;
    rule: string;
    suggestion?: string;
  }>;
  suggestions: Array<{
    type: 'improvement' | 'refactor' | 'optimization';
    message: string;
    code?: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  metrics: {
    complexity: number;
    maintainability: number;
    linesOfCode: number;
    duplicateLines: number;
    testCoverage?: number;
  };
}
```

## Configuration Options

### ClaudeProviderOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | string | `process.env.ANTHROPIC_API_KEY` | Anthropic API key |
| `model` | string | `claude-3-5-sonnet-20241022` | Claude model to use |
| `temperature` | number | `0.3` | Model temperature (0-1) |
| `maxTokens` | number | `4096` | Max tokens in response |
| `enableCache` | boolean | `true` | Enable response caching |
| `cacheTTL` | number | `3600000` | Cache TTL in milliseconds |
| `maxConcurrency` | number | `5` | Max concurrent requests |
| `rateLimitTokens` | number | `50` | Rate limiter token capacity |
| `rateLimitRefillRate` | number | `5` | Tokens per second refill |

## Testing

Run the test script to verify the integration:

```bash
export ANTHROPIC_API_KEY=your_api_key_here
npx ts-node test-claude-integration.ts
```

Expected output:
```
🧪 Testing Claude API Integration

✓ API key found
✓ Creating Claude provider...
✓ Provider created successfully

📝 Analyzing sample code...

✅ Analysis complete!

📊 Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🐛 Issues found: 3
  1. [ERROR] security
     SQL injection vulnerability detected
     Line: 3
     Fix: Use parameterized queries

...
```

## Cost Optimization

To minimize API costs:

1. **Enable caching**: Cache reduces duplicate API calls
   ```typescript
   { enableCache: true, cacheTTL: 3600000 }
   ```

2. **Adjust temperature**: Lower temperature = more consistent results
   ```typescript
   { temperature: 0.1 }
   ```

3. **Use batch processing**: Analyze multiple files in parallel
   ```typescript
   await provider.analyzeBatch(items);
   ```

4. **Configure rate limits**: Balance speed vs. API costs
   ```typescript
   { maxConcurrency: 3, rateLimitTokens: 30 }
   ```

## Troubleshooting

### API Key Not Found

```
Error: Anthropic API key is required
```

**Solution**: Set `ANTHROPIC_API_KEY` environment variable or provide in config.

### Rate Limit Errors

```
Error: rate_limit_error
```

**Solution**: The retry logic handles this automatically. If persistent, reduce `maxConcurrency` or `rateLimitRefillRate`.

### Parse Errors

```
Error: Failed to parse Claude API response
```

**Solution**: This may indicate an issue with the prompt or model output. Check the logs for the raw response.

### Network Errors

```
Error: ECONNRESET
```

**Solution**: The retry logic handles transient network errors automatically (up to 3 retries).

## Architecture

### File Structure

```
src/providers/claude/
├── ClaudeProvider.ts    # Main provider implementation
├── prompts.ts           # Prompt templates
├── cache.ts             # Response caching
├── rateLimiter.ts       # Rate limiting & request queue
├── retry.ts             # Retry logic with exponential backoff
└── index.ts             # Module exports
```

### Flow Diagram

```
┌─────────────┐
│   Analyze   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Check Cache │◄────────────┐
└──────┬──────┘             │
       │ miss               │
       ▼                    │
┌─────────────┐             │
│ Rate Limit  │             │
└──────┬──────┘             │
       │                    │
       ▼                    │
┌─────────────┐             │
│ Request Q   │             │
└──────┬──────┘             │
       │                    │
       ▼                    │
┌─────────────┐             │
│ Call Claude │             │
└──────┬──────┘             │
       │ error              │
       ▼                    │
┌─────────────┐             │
│   Retry?    │─────────────┘
└──────┬──────┘
       │ success
       ▼
┌─────────────┐
│Parse Result │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Save Cache  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Return    │
└─────────────┘
```

## API Reference

See TypeScript definitions in:
- `src/providers/claude/ClaudeProvider.ts`
- `src/providers/claude/prompts.ts`
- `src/types/index.ts`

## Support

For issues or questions:
- GitHub Issues: https://github.com/jordpo/llm-code-analyzer/issues
- Anthropic Docs: https://docs.anthropic.com/

## License

Same as the main project.
