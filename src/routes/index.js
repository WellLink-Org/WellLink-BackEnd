const { Router } = require("express");
const healthRoutes = require("./health.route");
const userRoutes = require("./user.route");
const dashboardRoutes = require("./dashboard.route");

const router = Router();

router.use("/health", healthRoutes);
router.use("/users", userRoutes);
router.use("/dashboard", dashboardRoutes);

module.exports = router;
