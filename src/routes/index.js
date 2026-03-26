const { Router } = require("express");
const healthRoutes = require("./health.route");
const userRoutes = require("./user.route");

const router = Router();

router.use("/health", healthRoutes);
router.use("/users", userRoutes);

module.exports = router;
