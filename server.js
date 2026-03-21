require("dotenv").config();
const express = require("express");
const { initDB } = require("./src/config/database");
const routes = require("./src/routes");git init
const errorMiddleware = require("./src/middleware/error.middleware");

const app = express();
const port = process.env.PORT || 4200;

app.use(express.json({ limit: "50mb" }));
app.use("/api", routes);
app.use(errorMiddleware);

initDB().then(() => {
  app.listen(port, () =>
    console.log(`Server running on http://localhost:${port}`),
  );
});
