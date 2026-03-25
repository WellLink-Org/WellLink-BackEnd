require("dotenv").config();
const express = require("express");
const { initDB } = require("./src/config/database");
const routes = require("./src/routes");
const errorMiddleware = require("./src/middleware/error.middleware");
const { auth } = require("express-oauth2-jwt-bearer");
const authController = require("./src/controllers/auth.controller");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 4200;

app.use(express.json({ limit: "50mb" }));

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

const jwtCheck = auth({
  audience: process.env.PRODUCT_URL,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
  tokenSigningAlg: "RS256",
});

app.post("/api/auth/sync-user", authController.syncUser);
app.post("/api/auth/update-role", authController.updateRole);

app.use("/api", jwtCheck, routes);

app.use(errorMiddleware);

initDB().then(() => {
  app.listen(port, () =>
    console.log(`Server running on http://localhost:${port}`),
  );
});
