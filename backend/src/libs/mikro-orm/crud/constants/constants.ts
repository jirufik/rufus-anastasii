import { IsolationLevel } from '../enums/isolation-level';

export const DEFAULT_TRANSACTION_ISOLATION_LEVEL: IsolationLevel = IsolationLevel.READ_COMMITTED;

export const DEFAULT_PAGE_LIMIT: number = 100;
export const DEFAULT_MAX_PAGE_LIMIT: number = 300;

export const DEFAULT_PARTIAL_UPDATE: boolean = true;
export const DEFAULT_CHECK_VERSION: boolean = true;

export const DEFAULT_SOFT_DELETE: boolean = true;

export const DEFAULT_MAX_DEPTH: number = 1;
export const DEFAULT_CURRENT_DEPTH: number = 1;
