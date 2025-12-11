import promptfoo from 'promptfoo';
import WranglerWorkerProviderCategorization from '../providers/wrangler-worker-categorization';
import { runEvaluation, displayResults, saveResults, exitWithCode } from '../utils/base-eval';
import type { ProviderContext } from '../types/provider';

async function main() {
  console.log('🚀 Starting Categorization Evaluation\n');

  const provider = new WranglerWorkerProviderCategorization();

  try {
    const results = await runEvaluation(
      {
        name: 'Intent Categorization',
        testsPath: 'promptfooconfig.eval.yaml',
        promptTemplate: 'Categorization via worker',
        provider: async (prompt: string, context?: ProviderContext) => {
          return await provider.callApi(prompt, context ?? {});
        },
        resultsFilename: 'categorization-results.json',
        outputPath: 'promptfoo/output/categorization/results.json',
        maxConcurrency: 2,
      },
      promptfoo,
    );

    displayResults(results);
    saveResults(results, 'categorization/results.json');

    await provider.cleanup();
    exitWithCode(results);
  } catch (error) {
    console.error('❌ Error running evaluation:', error);
    await provider.cleanup();
    process.exit(1);
  }
}

main();
