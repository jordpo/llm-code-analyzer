/// <reference types="node" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      OPENAI_API_KEY?: string;
      ANTHROPIC_API_KEY?: string;
      // Add other environment variables as needed
    }
  }
}

// Ensure this is treated as a module
export {};
