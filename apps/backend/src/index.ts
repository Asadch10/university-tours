import './env.js'; // must be first — loads .env before @ucpt/db reads DATABASE_URL
import { createApp } from './app.js';
import { config } from './config.js';
import { logger } from './lib/logger.js';

const app = createApp();

app.listen(config.API_PORT, () => {
  logger.info(`UCPT Backend API listening on http://localhost:${config.API_PORT}`);
  logger.info(`Health:   http://localhost:${config.API_PORT}/health`);
  logger.info(`API base: http://localhost:${config.API_PORT}/api/v1`);
});
