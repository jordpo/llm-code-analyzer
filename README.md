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
const { CodeAnalyzer } = require("llm-code-analyzer");

const analyzer = new CodeAnalyzer({
  llmProvider: "openai",
  apiKey: process.env.OPENAI_API_KEY,
});

const results = await analyzer.analyzeFile("path/to/file.js");
console.log(results.suggestions);
```

## Development

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/llm-code-analyzer.git
cd llm-code-analyzer
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

### Git Hooks

This project uses [Husky](https://typicode.github.io/husky/) to enforce code quality through Git hooks. Hooks are automatically installed when you run `npm install`.

#### Available Hooks

**Pre-commit**

- Runs `lint-staged` to automatically lint and format staged files
- Only staged TypeScript files are checked and auto-fixed
- JSON and Markdown files are formatted with Prettier

**Commit-msg**

- Validates commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) format
- Required format: `type(scope): subject`
- Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- Example: `feat: add support for Python analysis`

**Pre-push**

- Runs the test suite before pushing to remote
- Prevents pushing code that breaks tests

#### Bypassing Hooks

In rare cases, you can bypass hooks using the `--no-verify` flag:

```bash
# Skip pre-commit and commit-msg hooks
git commit --no-verify -m "emergency fix"

# Skip pre-push hook
git push --no-verify
```

**Note:** Only bypass hooks when absolutely necessary (e.g., emergency fixes).

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run in development mode
- `npm test` - Run test suite
- `npm run lint` - Check code for linting errors
- `npm run lint:fix` - Fix linting errors automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- Documentation: [https://llm-code-analyzer.dev/docs](https://llm-code-analyzer.dev/docs)
- Issues: [GitHub Issues](https://github.com/yourusername/llm-code-analyzer/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/llm-code-analyzer/discussions)
