const {
  createUser,
  updateUserRole,
} = require("../repositories/auth.repository");

async function create({ auth0Id, email, name, picture, provider, role }) {
  const result = await createUser({
    auth0Id,
    email,
    name,
    picture,
    provider,
    role,
  });
  if (!result) throw new Error("User not created");

  return result;
}

async function updateRole(auth0Id, role) {
  const result = await updateUserRole(auth0Id, role);
  if (!result) throw new Error("User role update failed");

  return result;
}

module.exports = { create, updateRole };
