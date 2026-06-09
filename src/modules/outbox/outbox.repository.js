const createOutboxEvent = async (
    client, 
    {
        eventType,
        routingKey,
        payload,
    }
) => {
    const query = `INSERT INTO outbox_events (
    event_type, routing_key, payload) VALUES ($1, $2, $3)
    RETURNING *;`;

    const {rows} = await client.query(query, [eventType, routingKey, payload]);

    return rows[0];
};

const getPendingOutboxEvents = async (
    client, 
    limit = 50
) => {
    const query = `SELECT * FROM outbox_events WHERE status = 'pending' ORDER BY created_at ASC LIMIT $1`;

    const {rows} = await client.query(query, [limit]);

    return rows;
};

const markOutboxPublished = async (
    client, 
    eventId
) => {
    const query = `UPDATE outbox_events SET status = 'published', published_at = NOW() WHERE id = $1 RETURNING *;`;

    const {rows} = await client.query(query, [eventId]);

    return rows[0];
};

const markOutboxFailed = async (
    client, eventId
) => {
    const query = `UPDATE outbox_events SET retry_count = retry_count + 1 WHERE id = $1 RETURNING *;`;

    const {rows } = await client.query(query, [eventId]);

    return rows[0];
};

export default {
    createOutboxEvent,
    getPendingOutboxEvents,
    markOutboxPublished,
    markOutboxFailed,
}