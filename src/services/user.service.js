const {
  getUserByUserID,
  getUserByUserEmail,
  updateUserRole,
} = require("../repositories/user.repository");

async function getUserById(userId) {
  const result = await getUserByUserID(userId);
  if (!result) throw new Error("User not found");

  return result;
}

async function getUserByEmail(email) {
  const result = await getUserByUserEmail({
    email,
  });
  if (!result) throw new Error("User not found");

  return result;
}

async function updateRole(auth0Id, role) {
  const result = await updateUserRole(auth0Id, role);
  if (!result) throw new Error("User role update failed");

  return result;
}

module.exports = { getUserById, getUserByEmail, updateRole };
