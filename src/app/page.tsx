export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">LLM Code Analyzer</h1>
          <p className="text-xl text-gray-600">
            An AI-powered code analysis tool that leverages large language
            models to provide intelligent insights, code reviews, and
            suggestions for your codebase.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 text-center">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-gray-300 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2">
                Intelligent Code Analysis
              </h3>
              <p className="text-gray-600">
                Deep code understanding using state-of-the-art large language
                models for quality and security analysis.
              </p>
            </div>

            <div className="border border-gray-300 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2">
                Multi-Language Support
              </h3>
              <p className="text-gray-600">
                Analyze code in multiple programming languages including
                JavaScript, TypeScript, Python, Java, and more.
              </p>
            </div>

            <div className="border border-gray-300 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2">
                Security Vulnerability Detection
              </h3>
              <p className="text-gray-600">
                Identify potential security issues and vulnerabilities before
                they become problems.
              </p>
            </div>

            <div className="border border-gray-300 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2">
                Code Quality Metrics
              </h3>
              <p className="text-gray-600">
                Get insights on complexity, maintainability, and code quality
                metrics.
              </p>
            </div>

            <div className="border border-gray-300 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2">
                Automated Code Reviews
              </h3>
              <p className="text-gray-600">
                Receive AI-powered suggestions and recommendations to improve
                your codebase.
              </p>
            </div>

            <div className="border border-gray-300 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2">Custom Rule Engine</h3>
              <p className="text-gray-600">
                Define your own analysis rules and patterns tailored to your
                team&apos;s standards.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-gray-100 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
          <p className="text-gray-700 mb-4">
            Use the CLI tool to analyze your code:
          </p>
          <pre className="bg-gray-800 text-white p-4 rounded-lg inline-block">
            <code>llm-code-analyzer analyze path/to/file.js</code>
          </pre>
        </section>
      </div>
    </div>
  );
}
