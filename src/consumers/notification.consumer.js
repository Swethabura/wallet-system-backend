// import logger from "../config/logger.js";
// import { getChannel } from "../config/rabbitmq.js";
// import { EXCHANGE_NAME } from "../queues/setup.js";

// const QUEUE_NAME = "wallet.notifications";

// export async function startNotificationConsumer() {
//   const channel = getChannel();

//   await channel.assertQueue(QUEUE_NAME, { durable: true });

//   await channel.bindQueue(
//     QUEUE_NAME,
//     EXCHANGE_NAME,
//     "wallet.transfer.completed",
//   );

//   channel.consume(
//     QUEUE_NAME,
//     async (msg) => {
//       if (!msg) return;

//       try {
//         const payload = JSON.parse(msg.content.toString());

//         logger.info({
//           action: "NOTIFICATION_SENT",
//           payload,
//         });

//         channel.ack(msg);
//       } catch (error) {
//         logger.error({ error }, "Notification consumer failed");

//         channel.nack(msg, false, false);
//       }
//     },
//     { noAck: false },
//   );

//   logger.info(
//     "Notification consumer started"
//   );
// }

import logger from "../config/logger.js";
import { getChannel } from "../config/rabbitmq.js";
import { EXCHANGE_NAME } from "../queues/setup.js";
import pool from "../db/db.js";
import eventRepository from "../modules/event/event.repository.js";

const QUEUE_NAME = "wallet.notifications";

export async function startNotificationConsumer() {
  const channel = getChannel();

  await channel.assertQueue(QUEUE_NAME, { durable: true });

  await channel.bindQueue(
    QUEUE_NAME,
    EXCHANGE_NAME,
    "wallet.transfer.completed"
  );

  await channel.bindQueue(
  QUEUE_NAME,
  EXCHANGE_NAME,
  "wallet.credit.completed"
);

await channel.bindQueue(
  QUEUE_NAME,
  EXCHANGE_NAME,
  "wallet.debit.completed"
);

  channel.consume(
    QUEUE_NAME,
    async (msg) => {
      if (!msg) return;

      const client = await pool.connect();

      try {
        const payload = JSON.parse(msg.content.toString());
        const messageId = payload.transactionGroup || payload.eventId;

        const alreadyProcessed =
          await eventRepository.hasProcessed(
            client,
            "notification_consumer",
            messageId
          );

        if (alreadyProcessed) {
          logger.warn({
            action: "DUPLICATE_SKIPPED",
            consumer: "notification",
            messageId,
          });

          channel.ack(msg);
          return;
        }

        logger.info({
          action: "NOTIFICATION_SENT",
          payload,
        });

        await eventRepository.markProcessed(
          client,
          "notification_consumer",
          messageId
        );

        channel.ack(msg);

      } catch (error) {
        logger.error(
          {
            err: error,
            message: error.message,
            stack: error.stack,
          }, "Notification consumer failed");

        channel.nack(msg, false, false);
      } finally {
        client.release();
      }
    },
    { noAck: false }
  );

  logger.info("Notification consumer started");
}