import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import authRoutes from './routes/auth.js';
import pushRoutes from './routes/push.js';
import sessionRoutes from './routes/session.js';
import codeRoutes from './routes/code.js';
import recoveryRoutes from './routes/recovery.js';
import deviceRoutes from './routes/devices.js';

export function createApp() {
  const app = express();

  // Frontend runs on a different origin in dev, so allow it + send cookies.
  app.use(cors({ origin: config.origin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/', authRoutes);
  app.use('/', pushRoutes);
  app.use('/', sessionRoutes);
  app.use('/', codeRoutes);
  app.use('/', recoveryRoutes);
  app.use('/', deviceRoutes);

  return app;
}
