const {
  getDashboard,
  getWidget,
  updateWidgets,
} = require("../repositories/dashboard.repository");

async function getDashboardData(userId) {
  const result = await getDashboard(userId);
  if (!result) throw new Error("Dashboard data not found");

  return result;
}

async function getWidget(userId, dataType, days) {
  const result = await getWidget(userId, dataType, days);
  if (!result) throw new Error("Widget not created");
  return result;
}

async function updateDashboard(widgets) {
  const result = await updateWidgets(widgets);
  seedDefaultDashboard(auth0Id);
  if (!result) throw new Error("User not created");

  return result;
}

module.exports = { getDashboardData, getWidget, updateDashboard };
