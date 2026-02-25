import { Description, ObjectSchema } from 'joi';

export function printSchema(schema: ObjectSchema): void {
  console.info('ENV list for service:');
  const schemaDescription: Description = schema.describe();

  Object.entries(schemaDescription['keys']).forEach(([key, desc]: [string, Description]) => {
    // @ts-expect-error its okay
    const isRequired: boolean = desc?.flags?.presence === 'required';

    const parts: string[] = [
      `- ${key}: ${desc.type}`,
      isRequired ? '(required)' : '',
      // @ts-expect-error its okay
      desc.flags?.default ? `[default: ${desc.flags?.default}]` : '',
    ];
    console.info(parts.filter(Boolean).join(' '));
  });
}
