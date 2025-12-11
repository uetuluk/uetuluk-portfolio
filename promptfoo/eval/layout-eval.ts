import promptfoo from 'promptfoo';
import WranglerWorkerProviderLayout from '../providers/wrangler-worker-layout';
import { runEvaluation, displayResults, saveResults, exitWithCode } from '../utils/base-eval';
import type { ProviderContext } from '../types/provider';

async function main() {
  console.log('🚀 Starting Layout Evaluation\n');

  const provider = new WranglerWorkerProviderLayout();

  try {
    const results = await runEvaluation(
      {
        name: 'Layout Generation',
        testsPath: 'promptfooconfig.layout.yaml',
        promptTemplate: 'Layout generation via worker',
        provider: async (prompt: string, context?: ProviderContext) => {
          return await provider.callApi(prompt, context ?? {});
        },
        resultsFilename: 'layout-results.json',
        outputPath: 'promptfoo/output/layout/results.json',
        maxConcurrency: 2,
      },
      promptfoo,
    );

    displayResults(results);
    saveResults(results, 'layout/results.json');

    await provider.cleanup();
    exitWithCode(results);
  } catch (error) {
    console.error('❌ Error running evaluation:', error);
    await provider.cleanup();
    process.exit(1);
  }
}

main();
