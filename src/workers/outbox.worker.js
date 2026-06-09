import logger from "../config/logger.js";
import pool from "../db/db.js";
import outboxRepository from "../modules/outbox/outbox.repository.js";
import { publishEvent } from "../queues/publisher.js";

const POLL_INTERVAL = 5000;

let intervalId = null;

async function processOutbox() {
  const client = await pool.connect();

  try {
    const events = await outboxRepository.getPendingOutboxEvents(client);

    if (!events.length) return;

    // console.log("events ->", events);

    logger.info({
      action: "OUTBOX_BATCH_FOUND",
      count: events.length,
    });

    for (const event of events) {
      try {
        //         logger.info({
        //   action: "OUTBOX_PAYLOAD_DEBUG",
        //   eventId: event.id,
        //   payload: event.payload,
        //   payloadType: typeof event.payload,
        // });
        await publishEvent(event.routing_key, event.payload);

        await outboxRepository.markOutboxPublished(client, event.id);

        logger.info({
          action: "OUTBOX_EVENT_PUBLISHED",
          eventId: event.id,
        });
      } catch (error) {
        await outboxRepository.markOutboxFailed(client, event.id);

        logger.error(
          {
            err: error,
            message: error.message,
            stack: error.stack,
            eventId: event.id,
          },
          "Outbox publish failed",
        );
      }
    }
  } finally {
    client.release();
  }
}

export function startOutboxWorker() {
  intervalId = setInterval(processOutbox, POLL_INTERVAL);

  logger.info("Outbox worker started");
}

export function stopOutboxWorker() {
  if (intervalId) {
    clearInterval(intervalId);
  }

  logger.info("Outbox worker stopped");
}
