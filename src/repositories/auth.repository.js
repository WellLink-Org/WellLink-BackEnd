const pool = require("../config/database");

async function createUser({ auth0Id, email, name, picture, provider, role }) {
  const query = `
    INSERT INTO users (user_id, email, name, picture, provider, role)
    VALUES ($1, $2, $3, $4, $5, $6)
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
  ];

  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

async function updateUserRole(auth0Id, role) {
  const query = `
    UPDATE users
    SET role = $2
    WHERE user_id = $1
    RETURNING *;
  `;
  const values = [auth0Id, role];

  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

module.exports = {
  createUser,
  updateUserRole,
};
