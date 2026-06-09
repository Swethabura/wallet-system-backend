const getAllUsers = async (client, page = 1, limit = 10, status = null) => {
  const offset = (page - 1) * limit;

  let query = `
    SELECT id, email, full_name, role, status, created_at
    FROM users
  `;

  const values = [];

  if (status) {
    query += ` WHERE status = $1`;
    values.push(status);
  }

  query += `
    ORDER BY id
    LIMIT $${values.length + 1}
    OFFSET $${values.length + 2}
  `;

  values.push(limit, offset);

  const { rows } = await client.query(query, values);

  return rows;
};

const updateUserStatus = async (client, userId, status) => {
  const query = `UPDATE users SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING id, email, full_name, status, role`;

  const { rows } = await client.query(query, [userId, status]);

  return rows[0];
};

const getUserStats = async (client) => {
  const query = `
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'active') AS active,
      COUNT(*) FILTER (WHERE status = 'inactive') AS inactive
    FROM users;
  `;

  const { rows } = await client.query(query);

  return rows[0];
};

const getWalletStats = async (client) => {
  const query = `SELECT COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'active') AS active,
        COUNT(*) FILTER (WHERE status = 'inactive') AS inactive
        FROM wallets`;

  const { rows } = await client.query(query);

  return rows[0];
};

const getAllWallets = async (client, page = 1, limit = 10, status = null) => {
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      w.id,
      w.user_id,
      w.balance,
      w.status,
      w.created_at,
      u.email,
      u.full_name
    FROM wallets w
    JOIN users u ON w.user_id = u.id
  `;

  const values = [];
  let paramIndex = 1;

  // WHERE clause
  if (status) {
    query += ` WHERE w.status = $${paramIndex}`;
    values.push(status);
    paramIndex++;
  }

  // ORDER
  query += ` ORDER BY w.created_at DESC`;

  // LIMIT + OFFSET
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  values.push(limit, offset);

  const { rows } = await client.query(query, values);

  return rows;
};

const updateWalletStatus = async (client, walletId, status) => {
  const query = `
    UPDATE wallets
    SET status = $2,
        updated_at = NOW()
    WHERE id = $1
    RETURNING *;
  `;

  const { rows } = await client.query(query, [walletId, status]);

  return rows[0];
};

const getLedgerEntries = async (
  client,
  {
    walletId = null,
    entryType = null,
    transactionGroup = null,
    page = 1,
    limit = 10,
  },
) => {
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      id,
      wallet_id,
      transaction_group,
      entry_type,
      amount,
      reference_wallet_id,
      description,
      created_at
    FROM ledger_entries
    WHERE 1=1
  `;

  const values = [];
  let index = 1;

  // wallet filter
  if (walletId) {
    query += ` AND wallet_id = $${index}`;
    values.push(walletId);
    index++;
  }

  // credit/debit filter
  if (entryType) {
    query += ` AND entry_type = $${index}`;
    values.push(entryType);
    index++;
  }

  // transaction group filter
  if (transactionGroup) {
    query += ` AND transaction_group = $${index}`;
    values.push(transactionGroup);
    index++;
  }

  // ordering
  query += ` ORDER BY created_at DESC`;

  // pagination
  query += ` LIMIT $${index} OFFSET $${index + 1}`;
  values.push(limit, offset);

  const { rows } = await client.query(query, values);

  return rows;
};

const getReconstructedWalletBalance = async (client, walletId) => {
  const query = `SELECT wallet_id, SUM(
        CASE
            WHEN entry_type = 'credit' THEN amount
            WHEN entry_type = 'debut' THEN -amount
        END
     ) AS reconstructed_balance FROM ledger_entries WHERE wallet_id = $1 GROUP BY wallet_id`;

  const { rows } = await client.query(query, [walletId]);

  return (
    rows[0] || {
      wallet_id: walletId,
      reconstructed_balance: 0,
    }
  );
};

const getWalletBalance = async (client, walletId) => {
  const query = `
    SELECT id, balance
    FROM wallets
    WHERE id = $1;
  `;

  const { rows } = await client.query(query, [walletId]);

  return rows[0];
};

export default {
  getAllUsers,
  updateUserStatus,
  getUserStats,
  getWalletStats,
  getAllWallets,
  updateWalletStatus,
  getLedgerEntries,
  getReconstructedWalletBalance,
  getWalletBalance,
};
