import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { logger } from './src/shared/logger';
import { runMigrations } from './src/shared/migrate';
import { errorHandler } from './src/middleware/error.middleware';
import { defaultNoCache } from './src/middleware/cache.middleware';
import { sanitizeBody } from './src/middleware/sanitize.middleware';
import { authRoutes } from './src/components/auth/routes/auth.routes';
import { userRoutes } from './src/components/users/routes/users.routes';
import { treeRoutes } from './src/components/trees/routes/trees.routes';
import { personRoutes } from './src/components/persons/routes/persons.routes';
import { claimRoutes } from './src/components/claims/routes/claims.routes';
import { mergeRoutes } from './src/components/merge/routes/merge.routes';
import { notificationRoutes } from './src/components/notifications/routes/notifications.routes';
import { auditRoutes } from './src/components/audit/routes/audit.routes';
import { adminRoutes } from './src/components/admin/routes/admin.routes';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  })
);
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.CORS_ORIGIN : true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(sanitizeBody);

app.use('/api', defaultNoCache);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trees', treeRoutes);
app.use('/api', personRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/merge', mergeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

if (process.env.NODE_ENV === 'production') {
  const { serveStatic } = await import('./vite');
  serveStatic(app);
} else {
  const { setupVite } = await import('./vite');
  await setupVite(app);
}

import { startScheduledJobs } from './src/shared/services/scheduler.service';

try {
  await runMigrations();
} catch (err) {
  logger.error({ err }, 'Database migration failed');
  process.exit(1);
}

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  startScheduledJobs();
});

export default app;
