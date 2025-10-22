export default function Home(): React.ReactElement {
  return (
    <div className="container">
      <h1>LLM Code Analyzer</h1>
      <p>
        An AI-powered code analysis tool that leverages large language models to provide intelligent
        insights, code reviews, and suggestions for your codebase.
      </p>

      <section className="features">
        <h2>Features</h2>
        <ul>
          <li>Intelligent Code Analysis: Deep code understanding using state-of-the-art LLMs</li>
          <li>Multi-Language Support: Analyze code in multiple programming languages</li>
          <li>Security Vulnerability Detection: Identify potential security issues</li>
          <li>Code Quality Metrics: Get insights on complexity and maintainability</li>
          <li>Automated Code Reviews: AI-powered suggestions for improvements</li>
          <li>Custom Rule Engine: Define your own analysis rules and patterns</li>
        </ul>
      </section>

      <section className="getting-started">
        <h2>Getting Started</h2>
        <p>Use the CLI tool to analyze your code:</p>
        <pre>
          <code>llm-code-analyzer analyze path/to/file.js</code>
        </pre>
      </section>
    </div>
  );
}
