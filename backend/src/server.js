import app from './app.js';
import logger from './config/logger.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Web Attack Detection & Prevention System Server running on port ${PORT}`);
});

// Trigger nodemon reload

// Handle graceful shutdown
const gracefulShutdown = () => {
  logger.info('Shutting down server gracefully...');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
// Nodemon auto-reload trigger: finalized rate limit auto-block logic

