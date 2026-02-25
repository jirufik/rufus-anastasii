import * as Joi from 'joi';
import { ObjectSchema } from 'joi';

export let schemaRegistry: ObjectSchema = Joi.object({});

export function registerSchema(schema: Record<string, any>): void {
  schemaRegistry = schemaRegistry.append(schema);
}
