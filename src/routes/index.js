const { Router } = require("express");
const healthRoutes = require("./health.route");
// const authRoutes = require("./auth.routes");

const router = Router();

// router.use("/auth", authRoutes);
router.use("/health", healthRoutes);

module.exports = router;
