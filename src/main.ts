import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';
import session from 'express-session';
import { AppModule } from '@/app.module';
import { envConfig } from '@/common/config/env.config';
import { sessionConfig } from './common/config/session.config';
import { setupSwagger } from './common/config/swagger.config';

async function bootstrap() {
  const env = envConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      env.mode === 'development'
        ? ['log', 'debug', 'error', 'verbose', 'warn']
        : ['error', 'warn'],
  });
  const port = env.port;
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Session
  const sessionOptions = sessionConfig();
  app.use(session(sessionOptions));

  app.setGlobalPrefix('api');
  if (env.mode !== 'production') {
    setupSwagger(app);
  }
  await app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}/api/docs/`);
  });
}
bootstrap();
