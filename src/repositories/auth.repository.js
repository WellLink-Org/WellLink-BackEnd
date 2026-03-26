const { pool } = require("../config/database");

async function createUser({ auth0Id, email, name, picture, provider, role }) {
  const query = `
    INSERT INTO users (user_id, email, name, picture, provider, role, role_updated)
    VALUES ($1, $2, $3, $4, $5, $6,$7)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING *;
  `;

  const values = [
    auth0Id,
    email,
    name,
    picture ?? null,
    provider,
    (role = "user"),
    false,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

module.exports = {
  createUser,
};
