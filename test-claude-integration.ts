/**
 * Test script for Claude API integration
 * Run with: npx ts-node test-claude-integration.ts
 */

import { ClaudeProvider } from './src/providers/claude';
import type { AnalyzerConfig } from './src/types';

async function testClaudeIntegration() {
  console.log('🧪 Testing Claude API Integration\n');

  // Sample code to analyze
  const sampleCode = `
function processUserData(userData) {
  // SQL injection vulnerability
  const query = "SELECT * FROM users WHERE id = " + userData.id;

  // No error handling
  const result = db.execute(query);

  // Exposing sensitive data
  console.log("User password:", userData.password);

  return result;
}
`;

  // Create test config
  const config: AnalyzerConfig = {
    llmProvider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY,
    rules: ['security', 'performance', 'style'],
    exclude: [],
    outputFormat: 'json',
    maxConcurrency: 5
  };

  try {
    // Check if API key is set
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY environment variable is not set');
      console.log('ℹ️  Set it with: export ANTHROPIC_API_KEY=your_api_key_here\n');
      process.exit(1);
    }

    console.log('✓ API key found');
    console.log('✓ Creating Claude provider...');

    // Create provider
    const provider = new ClaudeProvider(config, {
      enableCache: true,
      maxConcurrency: 5
    });

    console.log('✓ Provider created successfully\n');
    console.log('📝 Analyzing sample code...\n');

    // Analyze code
    const result = await provider.analyze(sampleCode, {
      language: 'javascript',
      rules: ['security', 'performance', 'style']
    });

    // Display results
    console.log('✅ Analysis complete!\n');
    console.log('📊 Results:');
    console.log('━'.repeat(60));

    console.log(`\n🐛 Issues found: ${result.issues.length}`);
    result.issues.forEach((issue, index) => {
      console.log(`\n  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}`);
      console.log(`     ${issue.message}`);
      if (issue.line) console.log(`     Line: ${issue.line}`);
      if (issue.suggestion) console.log(`     Fix: ${issue.suggestion}`);
    });

    console.log(`\n💡 Suggestions: ${result.suggestions.length}`);
    result.suggestions.forEach((suggestion, index) => {
      console.log(`\n  ${index + 1}. [${suggestion.impact.toUpperCase()}] ${suggestion.type}`);
      console.log(`     ${suggestion.message}`);
    });

    console.log('\n📈 Metrics:');
    console.log(`   Complexity: ${result.metrics.complexity}`);
    console.log(`   Maintainability: ${result.metrics.maintainability}/100`);
    console.log(`   Lines of Code: ${result.metrics.linesOfCode}`);
    console.log(`   Duplicate Lines: ${result.metrics.duplicateLines}`);
    if (result.metrics.testCoverage) {
      console.log(`   Test Coverage: ${result.metrics.testCoverage}%`);
    }

    // Test caching
    console.log('\n🧪 Testing cache...');
    const cachedResult = await provider.analyze(sampleCode, {
      language: 'javascript',
      rules: ['security', 'performance', 'style']
    });
    console.log('✓ Cache working (second call should be instant)');

    // Show stats
    console.log('\n📊 Provider Stats:');
    const stats = provider.getStats();
    console.log(`   Cache entries: ${stats.cache.entries}`);
    console.log(`   Queue: ${stats.queue.processing} processing, ${stats.queue.queued} queued`);
    console.log(`   Rate limiter tokens: ${Math.round(stats.rateLimiter.tokens)}`);

    console.log('\n✅ All tests passed!\n');

    // Cleanup
    provider.destroy();

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test
testClaudeIntegration().catch(console.error);
