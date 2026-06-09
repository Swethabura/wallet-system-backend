import amqp from "amqplib";
import env from "./env.js";
import logger from "./logger.js";
import AppError from "../utils/AppError.js";

let connection = null;
let channel = null;

export async function connectRabbitMQ() {
  try {
    connection = await amqp.connect(env.rabbitmqUrl);

    connection.on("error", (err) => {
      logger.error({ err }, "RabbitMQ connection error");
    });

    connection.on("close", () => {
      logger.warn("RabbitMQ connection closed");
    });

    channel = await connection.createChannel();

    logger.info("RabbitMQ connected");
  } catch (error) {
    logger.fatal({ error }, "RabbitMQ connection failed");
    process.exit(1);
  }
}

export function getChannel() {
  if (!channel) {
    throw new AppError("RabbitMQ channel not initialized", 500);
  }

  return channel;
}

export async function disconnectRabbitMQ() {
  if (channel) {
    await channel.close();
  }

  if (connection) {
    await connection.close();
  }

  logger.info("RabbitMQ disconnected");
}
