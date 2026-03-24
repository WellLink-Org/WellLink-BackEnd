const authService = require("../services/auth.service");

exports.syncUser = async (req, res, next) => {
  try {
    if (req.headers["x-auth0-secret"] !== process.env.AUTH0_SYNC_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const data = req.body;
    await authService.create(data);
    res.json({ success: true, message: "Data saved to database" });
  } catch (err) {
    next(err); // passes to error middleware
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    if (req.headers["x-auth0-secret"] !== process.env.AUTH0_SYNC_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const data = req.body;

    await authService.updateRole(data.auth0Id, data.role);
    res.json({ success: true, message: "Data saved to database" });
  } catch (err) {
    next(err); // passes to error middleware
  }
};
