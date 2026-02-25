import { AsyncLocalStorage } from 'node:async_hooks';

export interface TxContext {
  depth: number;
  postCommitHooks: Array<() => Promise<void>>;
}

export const transactionContext = new AsyncLocalStorage<TxContext>();
