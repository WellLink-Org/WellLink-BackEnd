const userService = require("../services/user.service");

exports.getUserById = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const result = await userService.getUserById(userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.getUserByEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    const result = await userService.getUserByEmail(email);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    const data = req.body;
    const userId = req.params.userId;

    await userService.updateRole(userId, data.role);
    res.json({ success: true, message: "Data saved to database" });
  } catch (err) {
    next(err);
  }
};
