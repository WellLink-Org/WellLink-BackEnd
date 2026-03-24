const { Router } = require("express");
const healthRoutes = require("./health.route");

const router = Router();

router.use("/health", healthRoutes);

module.exports = router;
