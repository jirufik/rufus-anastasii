import * as fs from 'node:fs';
import { join } from 'node:path';

export function getEnvFile(params?: { pathToDir?: string }): string[] {
  const pathToDir: string = params?.pathToDir || '';
  const env: string = process.env['NODE_ENV'] || 'development';
  let files: string[] = [`.env.${env}.local`, `.env.${env}`, '.env.local', '.env'].map((fileName: string) =>
    join(pathToDir, fileName),
  );
  files = files.filter((file: string) => fs.existsSync(file));
  if (files.length) {
    console.info(`Found ENV files for service: ${JSON.stringify(files)}`);
    return files;
  }
  console.info(`No environment file found.`);
  return [];
}
