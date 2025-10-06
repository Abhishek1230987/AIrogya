import pool from "../config/database.js";
import bcrypt from "bcryptjs";

export class User {
  constructor(id, name, email, password, googleId, role, createdAt, updatedAt) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.googleId = googleId;
    this.role = role || "patient";
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Create a new user
  static async create({ name, email, password, googleId, role = "patient" }) {
    const client = await pool.connect();

    try {
      let hashedPassword = null;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(password, salt);
      }

      const result = await client.query(
        `INSERT INTO users (name, email, password, google_id, role) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [name, email, hashedPassword, googleId, role]
      );

      const userData = result.rows[0];
      return new User(
        userData.id,
        userData.name,
        userData.email,
        userData.password,
        userData.google_id,
        userData.role,
        userData.created_at,
        userData.updated_at
      );
    } finally {
      client.release();
    }
  }

  // Find user by email
  static async findByEmail(email) {
    const client = await pool.connect();

    try {
      const result = await client.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const userData = result.rows[0];
      return new User(
        userData.id,
        userData.name,
        userData.email,
        userData.password,
        userData.google_id,
        userData.role,
        userData.created_at,
        userData.updated_at
      );
    } finally {
      client.release();
    }
  }

  // Find user by ID
  static async findById(id) {
    const client = await pool.connect();

    try {
      const result = await client.query("SELECT * FROM users WHERE id = $1", [
        id,
      ]);

      if (result.rows.length === 0) {
        return null;
      }

      const userData = result.rows[0];
      return new User(
        userData.id,
        userData.name,
        userData.email,
        userData.password,
        userData.google_id,
        userData.role,
        userData.created_at,
        userData.updated_at
      );
    } finally {
      client.release();
    }
  }

  // Find user by Google ID
  static async findByGoogleId(googleId) {
    const client = await pool.connect();

    try {
      const result = await client.query(
        "SELECT * FROM users WHERE google_id = $1",
        [googleId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const userData = result.rows[0];
      return new User(
        userData.id,
        userData.name,
        userData.email,
        userData.password,
        userData.google_id,
        userData.role,
        userData.created_at,
        userData.updated_at
      );
    } finally {
      client.release();
    }
  }

  // Compare password for login
  async comparePassword(candidatePassword) {
    try {
      if (!this.password) {
        return false; // Google users don't have passwords
      }
      return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
      throw error;
    }
  }

  // Convert to JSON (exclude password)
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
