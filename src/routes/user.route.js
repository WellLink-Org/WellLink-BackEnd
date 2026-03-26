const { Router } = require("express");
const userController = require("../controllers/user.controller");

const router = Router();

router.get("/:userId", userController.getUserById);
router.get("/", userController.getUserByEmail);
router.patch("/:userId/role", userController.updateRole);

module.exports = router;
