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

async function getWidgetData(userId, dataType, days) {
  const result = await getWidget(userId, dataType, days);
  if (!result) throw new Error("Widget not created");
  return result;
}

async function updateDashboard(widgets) {
  const result = await updateWidgets(widgets);
  if (!result) throw new Error("Widgets not updated");

  return result;
}

module.exports = { getDashboardData, getWidgetData, updateDashboard };
