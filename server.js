require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/colonmovies";

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// MongoDB Connection (Serverless cached connection)
let isConnected = false;
const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) return;
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 4000
    });
    isConnected = true;
    console.log(`✔ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.warn(`[Notice] MongoDB connection note: ${err.message}`);
  }
};
connectDB();

app.use(async (req, res, next) => {
  if (!isConnected && mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  next();
});

// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));

// Health check endpoint
app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  res.json({
    status: "ok",
    app: "Colon-Movies API",
    database: states[dbState] || "unknown",
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html for non-API web routes
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ success: false, message: "API endpoint not found" });
  }
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start server locally if run via 'node server.js'
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🎬 Colon-Movies Server is running!`);
    console.log(`🌐 Web App URL: http://localhost:${PORT}`);
    console.log(`📡 REST API URL: http://localhost:${PORT}/api`);
    console.log(`======================================================\n`);
  });
}

// Export app for Vercel Serverless
module.exports = app;
