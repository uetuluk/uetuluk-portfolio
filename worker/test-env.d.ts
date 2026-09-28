import type { Env as WorkerEnv } from './types';

declare global {
  namespace Cloudflare {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- declaration merge
    interface Env extends WorkerEnv {}
  }
}
