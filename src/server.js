import app from "./app.js";
import env from "./config/env.js";
import logger from "./config/logger.js";
import { connectRabbitMQ, disconnectRabbitMQ } from "./config/rabbitmq.js";
import { startAuditConsumer } from "./consumers/audit.consumer.js";
import { startNotificationConsumer } from "./consumers/notification.consumer.js";
import { connectDB, disconnectDB } from "./db/db.js";
import { setupRabbitMQ } from "./queues/setup.js";
import { startOutboxWorker, stopOutboxWorker } from "./workers/outbox.worker.js";

let server;

async function startServer(){
    await connectDB();
    await connectRabbitMQ();
    await setupRabbitMQ();
    await startNotificationConsumer();
    await startAuditConsumer();
    await startOutboxWorker();

    server = app.listen(env.port, () => {
        logger.info(`Server running on port ${env.port}`);
    });
};

startServer();

const gracefulShutdown = (signal) => {
    logger.warn(`${signal} received. Shutting down gracefully...`);

    server.close(async () => {
    try {
      await disconnectDB();
      await disconnectRabbitMQ();
      await stopOutboxWorker();
      logger.info("DB disconnected");

      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during DB shutdown");
      process.exit(1);
    }
  });

    setTimeout(() => {
    logger.error("Forced shutdown");
    process.exit(1);
  }, 10000);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught Exception");
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.fatal({ err }, "Unhandled Rejection");
  process.exit(1);
});