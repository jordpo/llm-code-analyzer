#!/usr/bin/env ts-node

/**
 * Example: Parse a repository and analyze its structure
 *
 * Usage: ts-node examples/parse-repository.ts [path-to-repository]
 */

import { FileScanner } from '../src/utils/scanner';
import { ASTParser } from '../src/utils/ast-parser';
import chalk from 'chalk';

async function analyzeRepository(repoPath: string = process.cwd()) {
  console.log(chalk.blue.bold('\n📁 LLM Code Analyzer - File System Traversal & AST Parsing\n'));
  console.log(chalk.gray(`Analyzing repository: ${repoPath}\n`));

  // Initialize scanner and parser
  const scanner = new FileScanner([], repoPath);
  const parser = new ASTParser();

  // Track statistics
  const stats = {
    totalFiles: 0,
    parsedFiles: 0,
    failedFiles: 0,
    totalFunctions: 0,
    totalImports: 0,
    totalExports: 0,
    totalNodes: 0,
  };

  console.log(chalk.yellow('🔍 Scanning files...\n'));

  // Scan files with progress tracking
  const fileMetadata = await scanner.scanWithProgress(
    repoPath,
    {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      respectGitignore: true,
      maxFileSize: 1024 * 1024, // 1MB max file size
    },
    (progress) => {
      const percentage = Math.round((progress.processedFiles / progress.totalFiles) * 100);
      const bar = '█'.repeat(Math.floor(percentage / 2)) + '░'.repeat(50 - Math.floor(percentage / 2));

      process.stdout.write(
        `\r${chalk.cyan(bar)} ${percentage}% | ${progress.processedFiles}/${progress.totalFiles} files | ` +
        `${chalk.green(`✓ ${progress.processedFiles}`)} ${chalk.red(`✗ ${progress.errors}`)} | ` +
        `ETA: ${progress.estimatedTimeRemaining || 0}s`
      );
    }
  );

  console.log('\n');
  stats.totalFiles = fileMetadata.length;

  console.log(chalk.yellow(`\n🔬 Parsing ${stats.totalFiles} files...\n`));

  // Parse each file
  for (const metadata of fileMetadata) {
    try {
      const sourceCode = await scanner.readFile(metadata.path);
      const parseResult = await parser.parseFile(sourceCode, metadata);

      if (parseResult.success && parseResult.ast) {
        stats.parsedFiles++;

        // Extract code structure
        const functions = parser.extractFunctions(parseResult.ast);
        const imports = parser.extractImports(parseResult.ast);
        const exports = parser.extractExports(parseResult.ast);
        const nodeCount = parser.getNodeCount(parseResult.ast);

        stats.totalFunctions += functions.length;
        stats.totalImports += imports.length;
        stats.totalExports += exports.length;
        stats.totalNodes += nodeCount;

        // Log interesting files
        if (functions.length > 10 || imports.length > 10) {
          console.log(
            chalk.gray(`  ${metadata.relativePath}: `) +
            chalk.green(`${functions.length} functions, `) +
            chalk.blue(`${imports.length} imports, `) +
            chalk.magenta(`${exports.length} exports`)
          );
        }
      } else {
        stats.failedFiles++;
        console.log(
          chalk.red(`  ✗ ${metadata.relativePath}: ${parseResult.error?.message || 'Parse failed'}`)
        );
      }
    } catch (error) {
      stats.failedFiles++;
      console.log(
        chalk.red(`  ✗ ${metadata.relativePath}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      );
    }
  }

  // Display summary
  console.log(chalk.blue.bold('\n📊 Analysis Summary\n'));
  console.log(chalk.white('─'.repeat(60)));
  console.log(chalk.cyan(`Total Files Scanned:     ${stats.totalFiles}`));
  console.log(chalk.green(`Successfully Parsed:     ${stats.parsedFiles} (${Math.round((stats.parsedFiles / stats.totalFiles) * 100)}%)`));
  console.log(chalk.red(`Failed to Parse:         ${stats.failedFiles}`));
  console.log(chalk.white('─'.repeat(60)));
  console.log(chalk.yellow(`Total Functions:         ${stats.totalFunctions}`));
  console.log(chalk.yellow(`Total Imports:           ${stats.totalImports}`));
  console.log(chalk.yellow(`Total Exports:           ${stats.totalExports}`));
  console.log(chalk.yellow(`Total AST Nodes:         ${stats.totalNodes.toLocaleString()}`));
  console.log(chalk.white('─'.repeat(60)));

  // Performance metrics
  if (stats.parsedFiles > 0) {
    console.log(chalk.gray(`\nAverage Functions/File:  ${(stats.totalFunctions / stats.parsedFiles).toFixed(2)}`));
    console.log(chalk.gray(`Average Imports/File:    ${(stats.totalImports / stats.parsedFiles).toFixed(2)}`));
    console.log(chalk.gray(`Average Complexity:      ${(stats.totalNodes / stats.parsedFiles).toFixed(0)} nodes/file`));
  }

  console.log(chalk.green.bold('\n✅ Analysis complete!\n'));
}

// Run the analyzer
const targetPath = process.argv[2] || process.cwd();
analyzeRepository(targetPath).catch((error) => {
  console.error(chalk.red.bold('❌ Error:'), error);
  process.exit(1);
});
