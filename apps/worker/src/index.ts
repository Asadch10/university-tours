// Companion worker process: consumes BullMQ queues, runs scheduled jobs, and hosts
// the Socket.IO chat server. Shares the codebase, DB, and Redis with the API.
import { startProcessors } from './processors.js';
import { startChatServer } from './chat.js';
import { logger } from './logger.js';

const socketPort = Number(process.env.SOCKET_PORT ?? 4002);

startProcessors();
startChatServer(socketPort);

logger.info('UCPT Worker started (queues + chat gateway).');

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down worker.');
  process.exit(0);
});
