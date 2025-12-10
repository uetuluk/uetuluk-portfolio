/**
 * Categorization-specific provider wrapper
 * Exports the WranglerWorkerProviderCategorization class as default
 */
import { WranglerWorkerProviderCategorization } from './wrangler-worker';

export default WranglerWorkerProviderCategorization;

// CJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WranglerWorkerProviderCategorization;
}
