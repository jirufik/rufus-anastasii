export const PATH_TO_ENV_DIR: string = '.';
export const BODY_PARSER_LIMIT: string = '50mb';
export const DEFAULT_HTTP_API_VERSION: string = '1';

// ── Env Keys ─────────────────────────────────────────────
export const ENV_KEY_SERVICE_HTTP_PORT: string = 'SERVICE_HTTP_PORT';
export const ENV_KEY_DB_HOST: string = 'DB_HOST';
export const ENV_KEY_DB_PORT: string = 'DB_PORT';
export const ENV_KEY_DB_USER: string = 'DB_USER';
export const ENV_KEY_DB_PASSWORD: string = 'DB_PASSWORD';
export const ENV_KEY_DB_NAME: string = 'DB_NAME';
export const ENV_KEY_JWT_SECRET: string = 'JWT_SECRET';
export const ENV_KEY_JWT_EXPIRES_IN: string = 'JWT_EXPIRES_IN';
export const ENV_KEY_ADMIN_USERNAME: string = 'ADMIN_USERNAME';
export const ENV_KEY_ADMIN_PASSWORD: string = 'ADMIN_PASSWORD';
export const ENV_KEY_UPLOAD_DIR: string = 'UPLOAD_DIR';
export const ENV_KEY_MAX_FILE_SIZE_MB: string = 'MAX_FILE_SIZE_MB';
export const ENV_KEY_GROUPING_PROXIMITY_METERS: string = 'GROUPING_PROXIMITY_METERS';
export const ENV_KEY_MIKROORM_DEBUG: string = 'MIKROORM_DEBUG';
export const ENV_KEY_SRV_NODE: string = 'SRV_NODE';
export const ENV_KEY_NODE_ENV: string = 'NODE_ENV';

// ── Default Values ───────────────────────────────────────
export const DEFAULT_SERVICE_HTTP_PORT: number = 3000;
export const DEFAULT_JWT_EXPIRES_IN: string = '24h';
export const DEFAULT_UPLOAD_DIR: string = './uploads';
export const DEFAULT_MAX_FILE_SIZE_MB: number = 50;
export const DEFAULT_GROUPING_PROXIMITY_METERS: number = 350;
export const DEFAULT_BCRYPT_SALT_ROUNDS: number = 10;
