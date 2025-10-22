import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LLM Code Analyzer',
  description: 'AI-powered code analysis tool using large language models',
  keywords: ['code-analysis', 'llm', 'ai', 'code-review', 'static-analysis'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
