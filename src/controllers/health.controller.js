const healthService = require("../services/health.service");
const excelService = require("../services/excel.service");

exports.sync = async (req, res, next) => {
  try {
    const data = req.body;
    const userId = data.userId;
    console.log(`Received sync for: ${userId}`);

    await healthService.syncHealthData(userId, data);
    res.json({ success: true, message: "Data saved to database" });
  } catch (err) {
    next(err); // passes to error middleware
  }
};

exports.exportExcel = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const data = await healthService.loadAllRecords(userId);

    if (Object.keys(data).length === 0) {
      return res
        .status(404)
        .json({ error: "No data in database for this user." });
    }

    const workbook = excelService.buildWorkbook(data);

    const filename = `healthdata_${userId}_${new Date().toISOString().split("T")[0]}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

exports.getDashboardNames = async (req, res, next) => {
  try {
    const data = await healthService.getHealthNames();
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
