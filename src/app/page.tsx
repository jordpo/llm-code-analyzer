export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold mb-4">LLM Code Analyzer</h1>
        <p className="text-xl mb-8">
          AI-powered code analysis tool using large language models
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-300 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-2">Code Analysis</h2>
            <p className="text-gray-600">
              Analyze your code for quality, security, and best practices using
              advanced AI models.
            </p>
          </div>

          <div className="border border-gray-300 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-2">Smart Insights</h2>
            <p className="text-gray-600">
              Get intelligent suggestions and recommendations to improve your
              codebase.
            </p>
          </div>

          <div className="border border-gray-300 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-2">Developer Tools</h2>
            <p className="text-gray-600">
              Comprehensive suite of tools for static analysis and code review.
            </p>
          </div>

          <div className="border border-gray-300 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-2">Getting Started</h2>
            <p className="text-gray-600">
              Start analyzing your code in minutes with our easy-to-use
              interface.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
