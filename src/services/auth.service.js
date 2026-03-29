const { createUser } = require("../repositories/auth.repository");
const {
  seedDefaultDashboard,
} = require("../repositories/dashboard.repository");

async function create({ auth0Id, email, name, picture, provider, role }) {
  const result = await createUser({
    auth0Id,
    email,
    name,
    picture,
    provider,
    role,
  });
  seedDefaultDashboard(auth0Id);
  if (!result) throw new Error("User not created");

  return result;
}

module.exports = { create };
