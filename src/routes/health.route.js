const { Router } = require("express");
const healthController = require("../controllers/health.controller");
// const { authenticate } = require("../middleware/auth.middleware");

const router = Router();

// router.post("/", authenticate, healthController.sync)
router.post("/", healthController.sync);
router.get("/export/:userId", healthController.exportExcel);

module.exports = router;
