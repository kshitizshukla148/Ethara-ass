const connectDB = require("./config/db");
const { requiredEnvChecks } = require("./config/env");
const app = require("./app");

requiredEnvChecks();
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});