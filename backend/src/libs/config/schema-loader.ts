import { registerSchema, schemaRegistry } from './global-schema';
import { printSchema } from './print-schema';
import { baseEnvSchema } from './base.env.schema';

export function getMergedSchemas(serviceSchema?: Record<string, any>) {
  registerSchema(baseEnvSchema);
  if (serviceSchema) {
    registerSchema(serviceSchema);
  }
  printSchema(schemaRegistry);
  return schemaRegistry;
}
