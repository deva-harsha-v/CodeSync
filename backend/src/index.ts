import http from 'http';
import express from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import { db } from './config/database';
import { apiRouter } from './routes/api';
import { CollaborativeOTServer } from './websocket/server';
import { dependencyService } from './services/dependency.service';

async function bootstrap() {
  const app = express();

  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API router
  app.use('/api', apiRouter);

  // Health endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      system: 'CodeSync AI-Assisted Real-Time Collaborative Platform',
      database: db.isPostgres() ? 'PostgreSQL (Primary)' : 'SQLite (Local Fallback)'
    });
  });

  const server = http.createServer(app);

  // Initialize Database
  console.log('[System] Initializing database layer...');
  await db.initialize();

  // Pre-load AST Dependency Graph for Smart Canteen demo project
  console.log('[System] Loading AST Dependency Graph for Smart Canteen target demo...');
  await dependencyService.loadProjectGraph('proj_smart_canteen');

  // Initialize Real-Time WebSocket OT Collaboration Engine
  const otServer = new CollaborativeOTServer(server);

  server.listen(ENV.PORT, () => {
    console.log(`================================================================`);
    console.log(` CodeSync Backend Server Running on http://localhost:${ENV.PORT}`);
    console.log(` Real-Time OT WebSockets at ws://localhost:${ENV.PORT}/ws/collaborate`);
    console.log(` Database: ${db.isPostgres() ? 'PostgreSQL (Primary)' : 'SQLite (Fallback)'}`);
    console.log(`================================================================`);
  });
}

bootstrap().catch((err) => {
  console.error('[System] Failed to start backend server:', err);
  process.exit(1);
});
