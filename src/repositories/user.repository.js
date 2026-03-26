const { pool } = require("../config/database");

async function getUserByUserID(userId) {
  const query = `
    SELECT * FROM users
    WHERE user_id = $1 ;
  `;
  const values = [userId];

  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

async function getUserByUserEmail(email) {
  const query = `
    SELECT * FROM users
    WHERE email = $1 ;
  `;
  const values = [email];

  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

async function updateUserRole(auth0Id, role) {
  const query = `
    UPDATE users
    SET role = $2,role_updated = $3
    WHERE user_id = $1
    RETURNING *;
  `;
  const values = [auth0Id, role, true];

  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}
module.exports = { getUserByUserID, getUserByUserEmail, updateUserRole };
