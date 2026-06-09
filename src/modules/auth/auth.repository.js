const createUser = async (
    client, {email, passwordHash, fullName}
) => {
    const query = `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING *; `;

    const {rows} = await client.query(query, [email, passwordHash, fullName]);

    return rows[0];
};

const getUserByEmail = async(client, email) => {
    const query = `SELECT * FROM users WHERE email = $1`;

    const {rows} = await client.query(query, [email]);

    return rows[0];
};

const getUserById = async (client, userId) => {
  const query = `SELECT
      id,
      email,
      full_name,
      is_verified,
      status,
      created_at,
      updated_at,
      role
    FROM users
    WHERE id = $1`;

  const { rows } = await client.query(query, [userId]);

  return rows[0];
};

const storeRefreshToken = async (
  client,
  {
    userId,
    tokenHash,
    expiresAt
  }
) => {
  const query = `
    INSERT INTO refresh_tokens (
      user_id,
      token_hash,
      expires_at
    )
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const { rows } = await client.query(query, [
    userId,
    tokenHash,
    expiresAt
  ]);

  return rows[0];
};

const getValidRefreshToken = async (
  client,
  tokenHash
) => {
  const query = `
    SELECT *
    FROM refresh_tokens
    WHERE token_hash = $1
      AND revoked = false
      AND expires_at > NOW();
  `;

  const { rows } = await client.query(query, [tokenHash]);

  return rows[0];
};

const revokeRefreshToken = async (
  client,
  tokenHash
) => {
  const query = `
    UPDATE refresh_tokens
    SET revoked = true
    WHERE token_hash = $1;
  `;

  await client.query(query, [tokenHash]);
};

export default {
    createUser,
    getUserByEmail,
    getUserById,
    storeRefreshToken,
    getValidRefreshToken,
    revokeRefreshToken
};
