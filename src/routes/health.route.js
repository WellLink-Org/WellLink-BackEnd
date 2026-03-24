const { Router } = require("express");
const healthController = require("../controllers/health.controller");

const router = Router();

router.post("/", healthController.sync);
router.get("/export/:userId", healthController.exportExcel);

module.exports = router;
