import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Google OAuth callback
export const googleCallback = async (req, res) => {
  try {
    const { user } = req;

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    // Redirect to frontend with token
    const frontendURL = process.env.CLIENT_URL || "http://localhost:5173";
    res.redirect(
      `${frontendURL}/auth/callback?token=${token}&user=${encodeURIComponent(
        JSON.stringify(user.toJSON())
      )}`
    );
  } catch (error) {
    console.error("Google callback error:", error);
    const frontendURL = process.env.CLIENT_URL || "http://localhost:5173";
    res.redirect(`${frontendURL}/login?error=auth_failed`);
  }
};
