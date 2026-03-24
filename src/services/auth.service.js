const { createUser, updateUserRole } = require("../config/database");

async function create({ auth0Id, email, name, picture, provider, role }) {
  console.log({ auth0Id, email, name, picture, provider, role });

  const result = await createUser({
    auth0Id,
    email,
    name,
    picture,
    provider,
    role,
  });
  return result;
}

async function updateRole(auth0Id, role) {
  const result = await updateUserRole(auth0Id, role);
  return result;
}

module.exports = { create, updateRole };
