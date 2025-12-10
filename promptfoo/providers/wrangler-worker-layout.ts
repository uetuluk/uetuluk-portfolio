/**
 * Layout-specific provider wrapper
 * Exports the WranglerWorkerProviderLayout class as default
 */
import { WranglerWorkerProviderLayout } from './wrangler-worker';

export default WranglerWorkerProviderLayout;

// CJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WranglerWorkerProviderLayout;
}
