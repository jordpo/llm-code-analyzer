#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { CodeAnalyzer } from './analyzer';
import { loadConfig } from './config';
import { version } from '../package.json';

const program = new Command();

interface AnalyzeCommandOptions {
  recursive?: boolean;
  rules: string;
  format: string;
  output?: string;
  config?: string;
}

program.name('llm-code-analyzer').description('AI-powered code analysis tool').version(version);

program
  .command('analyze <path>')
  .description('Analyze code files or directories')
  .option('-r, --recursive', 'Analyze directories recursively')
  .option('--rules <rules>', 'Comma-separated list of rules to apply', 'all')
  .option('-f, --format <format>', 'Output format (json, text, markdown)', 'text')
  .option('-o, --output <file>', 'Output to file instead of console')
  .option('--config <path>', 'Path to configuration file')
  .action(async (path: string, options: AnalyzeCommandOptions) => {
    const spinner = ora('Loading configuration...').start();

    try {
      const config = await loadConfig(options.config);
      const analyzer = new CodeAnalyzer(config);

      spinner.text = 'Analyzing code...';
      const results = await analyzer.analyze(path, {
        ...(options.recursive === true && { recursive: options.recursive }),
        rules: options.rules.split(','),
        format: options.format,
      });

      spinner.succeed('Analysis complete!');

      if (options.output !== undefined && options.output !== '') {
        await analyzer.saveResults(results, options.output);
        console.warn(chalk.green(`Results saved to ${options.output}`));
      } else {
        analyzer.printResults(results, options.format);
      }
    } catch (error) {
      spinner.fail('Analysis failed');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

program.parse();
