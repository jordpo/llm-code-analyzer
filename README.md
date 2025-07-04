# LLM Code Analyzer

An AI-powered code analysis tool that leverages large language models to provide intelligent insights, code reviews, and suggestions for your codebase.

## Features

- **Intelligent Code Analysis**: Deep code understanding using state-of-the-art LLMs
- **Multi-Language Support**: Analyze code in multiple programming languages
- **Security Vulnerability Detection**: Identify potential security issues in your code
- **Code Quality Metrics**: Get insights on code complexity, maintainability, and best practices
- **Automated Code Reviews**: AI-powered suggestions for code improvements
- **Custom Rule Engine**: Define your own analysis rules and patterns
- **CLI and API Interface**: Use via command line or integrate into your workflow

## Installation

```bash
npm install -g llm-code-analyzer
```

## Quick Start

```bash
# Analyze a single file
llm-code-analyzer analyze path/to/file.js

# Analyze an entire project
llm-code-analyzer analyze ./src --recursive

# Run with specific rules
llm-code-analyzer analyze ./src --rules security,performance
```

## Configuration

Create a `.llm-analyzer.json` file in your project root:

```json
{
  "rules": ["security", "performance", "best-practices"],
  "exclude": ["node_modules", "dist", "build"],
  "language": "javascript",
  "llmProvider": "openai",
  "outputFormat": "json"
}
```

## API Usage

```javascript
const { CodeAnalyzer } = require('llm-code-analyzer');

const analyzer = new CodeAnalyzer({
  llmProvider: 'openai',
  apiKey: process.env.OPENAI_API_KEY
});

const results = await analyzer.analyzeFile('path/to/file.js');
console.log(results.suggestions);
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- Documentation: [https://llm-code-analyzer.dev/docs](https://llm-code-analyzer.dev/docs)
- Issues: [GitHub Issues](https://github.com/yourusername/llm-code-analyzer/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/llm-code-analyzer/discussions)