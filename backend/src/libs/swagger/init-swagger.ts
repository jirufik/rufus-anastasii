import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestApplication } from '@nestjs/core';

export const SWAGGER_PATH: string = 'api-docs';

export function initSwagger(app: NestApplication, options?: { title?: string; description?: string }): void {
  const title: string = options?.title || 'Service';
  const description: string = options?.description || 'Service API';

  const config = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document);
}
