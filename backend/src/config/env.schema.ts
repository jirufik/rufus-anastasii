import * as Joi from 'joi';
import {
  ENV_KEY_SERVICE_HTTP_PORT,
  ENV_KEY_DB_HOST,
  ENV_KEY_DB_PORT,
  ENV_KEY_DB_USER,
  ENV_KEY_DB_PASSWORD,
  ENV_KEY_DB_NAME,
  ENV_KEY_JWT_SECRET,
  ENV_KEY_JWT_EXPIRES_IN,
  ENV_KEY_ADMIN_USERNAME,
  ENV_KEY_ADMIN_PASSWORD,
  ENV_KEY_UPLOAD_DIR,
  ENV_KEY_MAX_FILE_SIZE_MB,
  ENV_KEY_GROUPING_PROXIMITY_METERS,
  ENV_KEY_MIKROORM_DEBUG,
  DEFAULT_SERVICE_HTTP_PORT,
  DEFAULT_JWT_EXPIRES_IN,
  DEFAULT_UPLOAD_DIR,
  DEFAULT_MAX_FILE_SIZE_MB,
  DEFAULT_GROUPING_PROXIMITY_METERS,
} from '../constants/constants';

export const envSchema = {
  [ENV_KEY_SERVICE_HTTP_PORT]: Joi.number().default(DEFAULT_SERVICE_HTTP_PORT),

  [ENV_KEY_DB_HOST]: Joi.string().required(),
  [ENV_KEY_DB_PORT]: Joi.number().required(),
  [ENV_KEY_DB_USER]: Joi.string().required(),
  [ENV_KEY_DB_PASSWORD]: Joi.string().required(),
  [ENV_KEY_DB_NAME]: Joi.string().required(),

  [ENV_KEY_JWT_SECRET]: Joi.string().required(),
  [ENV_KEY_JWT_EXPIRES_IN]: Joi.string().default(DEFAULT_JWT_EXPIRES_IN),

  [ENV_KEY_ADMIN_USERNAME]: Joi.string().required(),
  [ENV_KEY_ADMIN_PASSWORD]: Joi.string().required(),

  [ENV_KEY_UPLOAD_DIR]: Joi.string().default(DEFAULT_UPLOAD_DIR),
  [ENV_KEY_MAX_FILE_SIZE_MB]: Joi.number().default(DEFAULT_MAX_FILE_SIZE_MB),

  [ENV_KEY_GROUPING_PROXIMITY_METERS]: Joi.number().default(DEFAULT_GROUPING_PROXIMITY_METERS),

  [ENV_KEY_MIKROORM_DEBUG]: Joi.boolean().default(false),
};
