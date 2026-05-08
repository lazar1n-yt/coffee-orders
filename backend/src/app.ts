import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

import { env } from './config/env.js';
import { apiRouter } from './routes.js';
import { errorHandler } from './middleware/error-handler.js';
import { NotFoundError } from './utils/errors.js';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Статичні файли (зображення меню)
  app.use('/files', express.static(path.resolve(env.UPLOAD_DIR)));

  // OpenAPI / Swagger UI
  const openapiPath = path.resolve('src/openapi.yaml');
  if (fs.existsSync(openapiPath)) {
    const spec = YAML.parse(fs.readFileSync(openapiPath, 'utf8'));
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
  }

  app.use('/api', apiRouter);

  app.use((_req, _res, next) => next(new NotFoundError('Маршрут не знайдено')));
  app.use(errorHandler);

  return app;
};
