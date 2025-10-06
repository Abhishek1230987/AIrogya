import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import { createServer } from "http";
import { initializeDatabase } from "./config/database.js";
import passport from "./config/passport.js";
import authRoutes from "./routes/auth.js";
import consultationRoutes from "./routes/consultation.js";
import medicalRoutes from "./routes/medical.js";
import videoCallRoutes from "./routes/videoCall.js";
import { initializeSocketIO } from "./services/webrtcService.js";

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Static files - serve uploaded files
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/consultation", consultationRoutes);
app.use("/api/medical", medicalRoutes);
app.use("/api/video", videoCallRoutes);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Initialize Socket.IO for WebRTC
const io = initializeSocketIO(httpServer);

// Start server and initialize database
const PORT = process.env.PORT || 5000;
initializeDatabase()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check available at http://localhost:${PORT}/health`);
    });
  })
  .catch((error) => {
    console.error("Server startup failed:", error);
    process.exit(1);
  });
