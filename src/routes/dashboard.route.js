const { Router } = require("express");
const dashboardController = require("../controllers/dashboard.controller");

const router = Router();

router.get("/:userId", dashboardController.getDashboard);
router.patch("/widgets", dashboardController.updateDashboard);
router.get("/widget-data", dashboardController.getWidget);

module.exports = router;
