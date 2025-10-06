import express from "express";
import passport from "../config/passport.js";
import { register, login, googleCallback } from "../controllers/auth.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Regular authentication routes
router.post("/register", register);
router.post("/login", login);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  googleCallback
);

// Get current user (validate token)
router.get("/me", authenticateToken, async (req, res) => {
  try {
    res.json({
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      googleId: req.user.google_id,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
