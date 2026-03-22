import type { Express, Request, Response, NextFunction } from 'express';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { logger } from './src/shared/logger';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const WEB_ROOT = path.resolve(__dirname, '../web');
const DIST_PUBLIC = path.resolve(PROJECT_ROOT, 'dist/public');

export async function setupVite(app: Express): Promise<void> {
  const { createServer } = await import('vite');

  const vite = await createServer({
    root: WEB_ROOT,
    configFile: path.join(WEB_ROOT, 'vite.config.ts'),
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.use('*', async (req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl.startsWith('/api')) {
      next();
      return;
    }

    try {
      const indexPath = path.join(WEB_ROOT, 'index.html');
      if (!fs.existsSync(indexPath)) {
        res.status(200).send('<!-- Web app not yet created -->');
        return;
      }

      let html = fs.readFileSync(indexPath, 'utf-8');
      html = await vite.transformIndexHtml(req.originalUrl, html);
      res.status(200).set('Content-Type', 'text/html').send(html);
    } catch (err) {
      vite.ssrFixStacktrace(err as Error);
      next(err);
    }
  });

  logger.info('Vite dev server integrated');
}

export function serveStatic(app: Express): void {
  if (!fs.existsSync(DIST_PUBLIC)) {
    logger.warn('dist/public not found — skipping static file serving');
    return;
  }

  app.use(
    '/assets',
    express.static(path.join(DIST_PUBLIC, 'assets'), {
      maxAge: '1y',
      immutable: true,
    })
  );

  app.use(
    express.static(DIST_PUBLIC, {
      maxAge: '1h',
      index: false,
    })
  );

  app.use('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl.startsWith('/api')) {
      next();
      return;
    }

    const indexPath = path.join(DIST_PUBLIC, 'index.html');
    if (!fs.existsSync(indexPath)) {
      next();
      return;
    }

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(indexPath);
  });

  logger.info('Serving static files from dist/public');
}
