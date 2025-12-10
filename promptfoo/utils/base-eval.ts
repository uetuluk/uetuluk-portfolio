import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type promptfoo from 'promptfoo';

// ESM compatibility: Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Evaluation configuration
 */
export interface EvalConfig {
  name: string;
  testsPath?: string;
  tests?: any[];
  promptTemplate: string;
  provider: (prompt: string, context?: any) => Promise<any>;
  resultsFilename: string;
  maxConcurrency?: number;
  outputPath?: string;
  writeLatestResults?: boolean;
}

/**
 * Load test cases from YAML file
 */
export function loadTestsFromYaml(testsPath: string): any[] {
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
): Promise<any> {
  console.log(`🔄 Running ${config.name} evaluation...\n`);

  const tests = config.tests || loadTestsFromYaml(config.testsPath!);

  const results = await promptfooModule.evaluate(
    {
      prompts: [config.promptTemplate],
      providers: [config.provider],
      tests,
      writeLatestResults: config.writeLatestResults ?? true,
      outputPath: config.outputPath || path.join(__dirname, '..', 'output', 'latest.json'),
      description: config.name,
    },
    {
      maxConcurrency: config.maxConcurrency || 2,
      showProgressBar: true,
    },
  );

  return results;
}

/**
 * Display evaluation results
 */
export function displayResults(results: any): void {
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
export function calculateStats(results: any) {
  const resultsData = results.results || results;
  const table = resultsData.table || resultsData;

  if (!table || !Array.isArray(table.body)) {
    return { passed: 0, failed: 0, total: 0, successRate: 0 };
  }

  let passed = 0;
  let failed = 0;

  for (const row of table.body) {
    const outputs = row.outputs || [];
    for (const output of outputs) {
      if (output.pass) {
        passed++;
      } else if (output.pass === false) {
        failed++;
      }
    }
  }

  const total = passed + failed;
  const successRate = total > 0 ? (passed / total) * 100 : 0;

  return { passed, failed, total, successRate };
}

/**
 * Save evaluation results to file
 */
export function saveResults(results: any, filename: string): void {
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
export function exitWithCode(results: any): void {
  const stats = calculateStats(results);
  process.exit(stats.failed > 0 ? 1 : 0);
}
