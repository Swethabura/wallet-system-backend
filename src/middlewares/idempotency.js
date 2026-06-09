import pool from "../db/db.js";
import AppError from "../utils/AppError.js";
import crypto from "crypto";

const idempotency = async (req, res, next) => {
  const key = req.header("Idempotency-Key");

  if (!key) {
    throw new AppError("Idempotency-Key header is required", 400);
  }

  if (!req.user?.userId) {
    throw new AppError("Unauthorized", 401);
  }

  const userId = req.user.userId;

  const requestHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(req.body))
    .digest("hex");

  const client = await pool.connect();

  try {
    const { rows } = await client.query(
      `SELECT * FROM idempotency_keys WHERE user_id = $1 AND idempotency_key = $2;`,
      [userId, key],
    );

    if (rows.length > 0) {
      const record = rows[0];

      if (record.request_hash !== requestHash) {
        throw new AppError(
          "Idempotency key reused with different payload",
          409,
        );
      }

      if (record.response_payload) {
        return res.status(record.status_code).json(record.response_payload);
      }
    }

    req.idempotencyKey = key;
    req.requestHash = requestHash;

    next();
  } finally {
    client.release();
  }
};

export default idempotency;
