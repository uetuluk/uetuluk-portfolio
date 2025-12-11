import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type promptfoo from 'promptfoo';
import type { ProviderContext, ProviderResponse } from '../types/provider';

// ESM compatibility: Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Individual test result from promptfoo
 */
interface TestResult {
  gradingResult?: {
    pass?: boolean;
  };
}

/**
 * Evaluation result structure (simplified from promptfoo's Eval class)
 * Uses index signature to handle dynamic promptfoo response structure
 */
interface EvalResults {
  results?: TestResult[];
  [key: string]: unknown;
}

/**
 * Evaluation configuration
 */
export interface EvalConfig {
  name: string;
  testsPath?: string;
  tests?: unknown[];
  promptTemplate: string;
  provider: (prompt: string, context?: ProviderContext) => Promise<ProviderResponse>;
  resultsFilename: string;
  maxConcurrency?: number;
  outputPath?: string;
  writeLatestResults?: boolean;
}

/**
 * Load test cases from YAML file
 */
export function loadTestsFromYaml(testsPath: string): unknown[] {
  const fullPath = path.resolve(__dirname, '..', testsPath);
  const testsContent = fs.readFileSync(fullPath, 'utf8');
  const parsed = yaml.parse(testsContent);

  // Handle both direct array and config with tests property
  const tests = Array.isArray(parsed) ? parsed : parsed.tests || [];

  console.log(`📋 Loaded ${tests.length} test cases from ${testsPath}\n`);
  return tests;
}

/**
 * Run promptfoo evaluation
 */
export async function runEvaluation(
  config: EvalConfig,
  promptfooModule: typeof promptfoo,
): Promise<EvalResults> {
  console.log(`🔄 Running ${config.name} evaluation...\n`);

  const tests = config.tests || loadTestsFromYaml(config.testsPath!);

  // Cast to promptfoo's expected types at the API boundary
  // Our internal types are simpler but compatible at runtime
  type EvaluateTestSuite = Parameters<typeof promptfooModule.evaluate>[0];
  const evalConfig = {
    prompts: [config.promptTemplate],
    providers: [config.provider],
    tests,
    writeLatestResults: config.writeLatestResults ?? true,
    outputPath: config.outputPath || path.join(__dirname, '..', 'output', 'latest.json'),
    description: config.name,
  } as unknown as EvaluateTestSuite;

  const results = await promptfooModule.evaluate(evalConfig, {
    maxConcurrency: config.maxConcurrency || 2,
    showProgressBar: true,
  });

  return results as unknown as EvalResults;
}

/**
 * Display evaluation results
 */
export function displayResults(results: EvalResults): void {
  console.log('\n✅ Evaluation complete!\n');
  console.log('📊 Results Summary:');

  const stats = calculateStats(results);

  console.log(`   Total tests: ${stats.total}`);
  console.log(`   Passed: ${stats.passed}`);
  console.log(`   Failed: ${stats.failed}`);
  console.log(`   Success rate: ${stats.successRate.toFixed(1)}%`);
}

/**
 * Calculate test statistics
 */
export function calculateStats(results: EvalResults) {
  // Handle promptfoo's actual structure: results.results is an array of test results
  const resultsArray = Array.isArray(results.results) ? results.results : [];

  let passed = 0;
  let failed = 0;

  for (const result of resultsArray) {
    if (result.gradingResult?.pass === true) {
      passed++;
    } else if (result.gradingResult?.pass === false) {
      failed++;
    }
  }

  const total = passed + failed;
  const successRate = total > 0 ? (passed / total) * 100 : 0;

  return { passed, failed, total, successRate };
}

/**
 * Save evaluation results to file
 */
export function saveResults(results: EvalResults, filename: string): void {
  const outputPath = path.join(__dirname, '..', 'output', filename);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Detailed results saved to: ${outputPath}`);
  console.log('\n🌐 View results in browser:');
  console.log('   npm run test:prompts:view\n');
}

/**
 * Exit with appropriate code
 */
export function exitWithCode(results: EvalResults): void {
  const stats = calculateStats(results);
  process.exit(stats.failed > 0 ? 1 : 0);
}
