import * as Joi from 'joi';

export const baseEnvSchema = {
  SRV_NODE: Joi.string().required(),
  NODE_ENV: Joi.string().valid('production', 'development', 'test').required().default('development'),
};
