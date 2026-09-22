import express from 'express';
import { initDatabase } from '../server/db.ts';
import apiRouter from '../server/api.ts';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let initPromise: Promise<any> | null = null;
app.use(async (_req, _res, next) => {
  if (!initPromise) {
    initPromise = initDatabase().catch(err => {
      console.error('Database initialization error in serverless function:', err);
      initPromise = null;
      throw err;
    });
  }
  await initPromise;
  next();
});

// Mount router under both /api and root to handle various proxy rewrites
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
