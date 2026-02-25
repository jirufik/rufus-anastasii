import { MikroORM, EntityManager, RequestContext } from '@mikro-orm/core';
import { TransactionOptionsDto } from '../crud/dto/transaction-options.dto';
import { transactionContext, TxContext } from './transaction.context';

export class BaseService {
  serviceName: string;

  constructor(protected readonly orm: MikroORM) {
    this.serviceName = this.constructor.name;
  }

  registerPostCommitSyncHook(hook: () => void): void {
    this.registerPostCommitHook(async () => hook());
  }

  registerPostCommitHook(hook: () => Promise<void>): void {
    const ctx: TxContext | undefined = transactionContext.getStore();
    if (!ctx) throw new Error('Hooks only inside transaction');
    ctx.postCommitHooks.push(hook);
  }

  async runInTransaction<T>(callback: (em: EntityManager) => Promise<T>, opts?: TransactionOptionsDto): Promise<T> {
    const existing: TxContext | undefined = transactionContext.getStore();
    if (!existing) {
      const root: TxContext = { depth: 0, postCommitHooks: [] };
      return transactionContext.run(root, () => this._execute(root, callback, opts));
    }
    return this._execute(existing, callback, opts);
  }

  private async _execute<T>(
    ctx: TxContext,
    callback: (em: EntityManager) => Promise<T>,
    opts?: TransactionOptionsDto,
  ): Promise<T> {
    ctx.depth++;
    let result: T;
    let error = false;

    try {
      const emForRun: EntityManager =
        ctx.depth === 1 ? this.orm.em.fork({ useContext: true }) : (RequestContext.getEntityManager() as EntityManager);

      if (ctx.depth === 1) {
        result = await RequestContext.create(emForRun, () =>
          emForRun.transactional((em: EntityManager) => callback(em), {
            isolationLevel: opts?.transactionIsolationLevel,
          }),
        );
      } else {
        result = await callback(emForRun);
      }
      return result;
    } catch (e) {
      error = true;
      throw e;
    } finally {
      ctx.depth--;
      if (ctx.depth === 0 && !error) {
        const hooksToRun: Array<() => Promise<void>> = ctx.postCommitHooks.slice();
        ctx.postCommitHooks.length = 0;
        for (const hook of hooksToRun) {
          await hook();
        }
      }
    }
  }
}
