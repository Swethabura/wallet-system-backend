import { getChannel } from "../config/rabbitmq.js";

export const EXCHANGE_NAME = "wallet.events";

export async function setupRabbitMQ() {
  const channel = getChannel();

  await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
}
