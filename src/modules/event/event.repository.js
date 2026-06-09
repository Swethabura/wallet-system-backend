const hasProcessed = async (
    client,
    consumerName,
    messageId
) => {
    const query = `SELECT 1 FROM processed_messages WHERE consumer_name = $1 AND message_id = $2;`;

    const {rows} = await client.query(query, [consumerName, messageId]);

    return rows.length > 0;
};

const markProcessed = async (
    client,
    consumerName,
    messageId,
) => {
    const query = `INSERT INTO processed_messages ( consumer_name, message_id) VALUES ($1, $2);`;

    const {rows} = client.query(query, [consumerName, messageId]);

    // return rows[0]
};

export default {
    hasProcessed,
    markProcessed,
};