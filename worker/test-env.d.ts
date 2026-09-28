import type { Env as WorkerEnv } from './types';

declare global {
  namespace Cloudflare {
    interface Env extends WorkerEnv {}
  }
}
