import logger from "../config/logger.js";
import { getChannel } from "../config/rabbitmq.js";
import { EXCHANGE_NAME } from "./setup.js";

export async function publishEvent( routingKey, payload) {
    const channel = getChannel();

    const published = channel.publish(
        EXCHANGE_NAME,
        routingKey,
        Buffer.from(JSON.stringify(payload)),
        {
            persistent: true
        }
    );

    if(published){
        logger.info({
            action: "EVENT PUBLISHED",
            routingKey,
            payload,
        });
    }
}