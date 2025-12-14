const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ===== ADMIN NAME =====
const ADMIN_NAME = "Skedbord Play Park Admin";

// ===== CONNECT MONGODB =====
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("Mongo error:", err));

// ===== TEST ROUTE =====
app.get("/", (req, res) => {
  res.send("Skedbord Play Park Backend is Running 🚀");
});

// ===== START SERVER (RENDER SAFE) =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
