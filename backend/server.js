const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const stockRoutes = require("./routes/stock");
const assetRoutes = require("./routes/assets");
const userRoutes = require("./routes/users");
const analyticsRoutes = require("./routes/analytics");
const reportRoutes = require("./routes/reports");
const apiKeyRoutes = require("./routes/apiKeys");
const aiRoutes = require("./routes/ai");
const alertRoutes = require("./routes/alerts");
const externalRoutes = require("./routes/external");
const errorRoutes = require("./routes/errors");
const securityRoutes = require("./routes/security");
const systemConfigRoutes = require("./routes/systemConfig");

const errorHandler = require("./middleware/errorHandler");
const { connectDB } = require("./config/database");
const { apiKeyAuth, apiKeyRateLimit } = require("./middleware/apiKeyAuth");
const { auth, adminAuth, superAdminAuth } = require("./middleware/auth");
const { monitorApiUsage, checkBlocked } = require("./middleware/securityMonitor");

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(compression());


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

app.use((req, res, next) => {
  if (req.path === "/health") {
    return next(); 
  }
  return limiter(req, res, next);
});

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173", 
      "http://localhost:8080",
      "http://localhost:3000",
      /^https:\/\/.*\.lovable\.app$/,
      /^https:\/\/id-preview--.*\.lovable\.app$/
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type", 
      "Authorization", 
      "x-api-key",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers"
    ],
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
  })
);

// Explicitly handle OPTIONS requests
app.options("*", cors());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Security monitoring
app.use(checkBlocked);
app.use(monitorApiUsage);

// Logging
app.use(morgan("combined"));
// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
  });
});
// API Routes
// Auth routes - no authentication needed
app.use("/api/auth", authRoutes);

// Error reporting route - no authentication needed
app.use("/api/errors", errorRoutes);

// Regular routes - require JWT authentication only
app.use("/api/products", auth, productRoutes);
app.use("/api/stock", auth, stockRoutes);
app.use("/api/assets", auth, assetRoutes);
app.use("/api/users", adminAuth, userRoutes); // Users need admin access
app.use("/api/analytics", auth, analyticsRoutes);
app.use("/api/reports", auth, reportRoutes);
app.use("/api/ai", auth, aiRoutes);
app.use("/api/alerts", auth, alertRoutes);

// Admin routes - require JWT admin authentication  
app.use("/api/admin/api-keys", auth, apiKeyRoutes);

// Super Admin routes - require super admin privileges
app.use("/api/security", securityRoutes);
app.use("/api/system/config", systemConfigRoutes);

// External admin routes - require API key for external access  
app.use(
  "/api/external/admin/api-keys",
  apiKeyAuth(["admin"]),
  apiKeyRateLimit(),
  apiKeyRoutes
);

// External API routes - require API key with read permission
app.use("/api/external", externalRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Received SIGINT. Graceful shutdown...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Graceful shutdown...");
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
