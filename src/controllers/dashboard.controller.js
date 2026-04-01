const dashboardService = require("../services/dashboard.service");

exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const result = await dashboardService.getDashboardData(userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.getWidget = async (req, res, next) => {
  try {
    const { dataType, days = "30" } = req.query;
    const userId = req.params.userId;
    const result = await dashboardService.getWidgetData(userId, dataType, days);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.updateDashboard = async (req, res, next) => {
  try {
    const data = req.body;
    await dashboardService.updateDashboard(data.widgets);
    res.json({ success: true, message: "Data saved to database" });
  } catch (err) {
    next(err);
  }
};
