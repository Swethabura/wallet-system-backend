import crypto from "crypto";

const createWallet = async (client, userId) => {
  const query = `INSERT INTO wallets(user_id) VALUES ($1) RETURNING *;`;

  const { rows } = await client.query(query, [userId]);
  return rows[0];
};

const getWalletById = async (client, walletId) => {
  const query = `SELECT * FROM wallets WHERE id = $1`;

  const { rows } = await client.query(query, [walletId]);
  return rows[0];
};

const getWalletByUserId = async (client, userId) => {
  const query = `
    SELECT *
    FROM wallets
    WHERE user_id = $1;
  `;

  const { rows } = await client.query(query, [userId]);
  return rows[0];
};

const getWalletByIdForUpdate = async (client, walletId) => {
  const query = `
    SELECT *
    FROM wallets
    WHERE id = $1
    FOR UPDATE;
  `;

  const { rows } = await client.query(query, [walletId]);
  return rows[0];
};

const updateWalletBalance = async (client, walletId, balance) => {
  const query = `UPDATE wallets SET balance = $2 WHERE id = $1 RETURNING *;`;

  const { rows } = await client.query(query, [walletId, balance]);
  return rows[0];
};

const insertLedgerEntry = async (
  client,
  {
    walletId,
    entryType,
    amount,
    referenceWalletId = null,
    transactionGroup = crypto.randomUUID(),
    description = null,
  },
) => {
  const query = `
    INSERT INTO ledger_entries (
      wallet_id,
      transaction_group,
      entry_type,
      amount,
      reference_wallet_id,
      description
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const { rows } = await client.query(query, [
    walletId,
    transactionGroup,
    entryType,
    amount,
    referenceWalletId,
    description,
  ]);

  return rows[0];
};

const createIdempotencyKey = async (client, userId, key, requestHash) => {
  const query = `
    INSERT INTO idempotency_keys (
      user_id,
      idempotency_key,
      request_hash
    )
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const { rows } = await client.query(query, [userId, key, requestHash]);

  return rows[0];
};

const getIdempotencyKey = async (client, userId, key) => {
  const query = `
    SELECT *
    FROM idempotency_keys
    WHERE user_id = $1
    AND idempotency_key = $2;
  `;

  const { rows } = await client.query(query, [userId, key]);
  return rows[0];
};

const updateIdempotencyResponse = async (
  client,
  userId,
  key,
  responsePayload,
  statusCode,
) => {
  const query = `
    UPDATE idempotency_keys
    SET
      response_payload = $3,
      status_code = $4
    WHERE user_id = $1
    AND idempotency_key = $2
    RETURNING *;
  `;

  const { rows } = await client.query(query, [
    userId,
    key,
    responsePayload,
    statusCode,
  ]);

  return rows[0];
};

const getWalletForTransfer = async (client, walletId1, walletId2) => {
  const query = `SELECT * FROM wallets WHERE id = ANY($1) ORDER BY id FOR UPDATE;`;

  const { rows } = await client.query(query, [[walletId1, walletId2]]);

  return rows;
};

const getWalletByUserIdForUpdate = async (client, userId) => {
  const query = `
    SELECT *
    FROM wallets
    WHERE user_id = $1
    FOR UPDATE;
  `;

  const { rows } = await client.query(query, [userId]);

  return rows[0];
};

const getWalletLedger = async (client, walletId, page = 1, limit = 10 ) => {

  const offset = (page - 1) * limit;
  
  const ledgerQuery = `
    SELECT *
    FROM ledger_entries
    WHERE wallet_id = $1
    ORDER BY created_at DESC LIMIT $2 OFFSET $3;
  `;

  const countQuery = `SELECT COUNT(*) AS total FROM ledger_entries WHERE wallet_id = $1`;

  const [ledgerResult, countResult] = await Promise.all([
    client.query(ledgerQuery, [walletId, limit, offset]),
    client.query(countQuery, [walletId]),
  ]);

  return {
    entries: ledgerResult.rows,
    total: Number(countResult.rows[0].total),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult.rows[0].total)/limit),
  }
};

const getWalletByIdForUpdateUnsafe = async (client, walletId) => {
  const query = `SELECT * FROM wallets WHERE id = $1 FOR UPDATE;`;

  const { rows } = await client.query(query, [walletId]);

  return rows[0];
};

export default {
  createWallet,
  getWalletById,
  getWalletByUserId,
  getWalletByIdForUpdate,
  updateWalletBalance,
  insertLedgerEntry,
  createIdempotencyKey,
  getIdempotencyKey,
  updateIdempotencyResponse,
  getWalletForTransfer,
  getWalletByUserIdForUpdate,
  getWalletLedger,
  getWalletByIdForUpdateUnsafe,
};
