const cors = require("cors");
const connectDB = require("./config/db");
const { requiredEnvChecks } = require("./config/env");
const app = require("./app");

requiredEnvChecks();
connectDB();

// ✅ CORS FIRST
app.use(cors({
  origin: "https://ethara-ass.vercel.app",
  credentials: true
}));

app.options("*", cors());

// ✅ PORT
const PORT = process.env.PORT || 8080;

// ✅ START SERVER
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

