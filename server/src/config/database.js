import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "e_consultancy",
  password: process.env.DB_PASSWORD || "password",
  port: parseInt(process.env.DB_PORT || "5432"),
});

// Test the connection
pool.on("connect", () => {
  console.log("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Initialize database schema
export const initializeDatabase = async () => {
  const client = await pool.connect();

  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        google_id VARCHAR(255) UNIQUE,
        profile_picture TEXT,
        role VARCHAR(20) DEFAULT 'patient',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create medical_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS medical_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date_of_birth DATE,
        gender VARCHAR(20),
        blood_type VARCHAR(10),
        height_cm INTEGER,
        weight_kg INTEGER,
        chronic_conditions JSONB DEFAULT '[]'::jsonb,
        current_medications JSONB DEFAULT '[]'::jsonb,
        allergies JSONB DEFAULT '[]'::jsonb,
        family_history JSONB DEFAULT '{}'::jsonb,
        smoking_status VARCHAR(20),
        drinking_status VARCHAR(20),
        exercise_frequency VARCHAR(50),
        emergency_contact JSONB DEFAULT '{}'::jsonb,
        additional_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create medical_reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS medical_reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        original_name VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        extracted_info JSONB DEFAULT '{}'::jsonb,
        processing_status VARCHAR(20) DEFAULT 'pending',
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create consultations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS consultations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        doctor_id INTEGER REFERENCES users(id),
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        symptoms TEXT NOT NULL,
        diagnosis TEXT,
        prescription TEXT,
        doctor_notes TEXT,
        language_used VARCHAR(10) DEFAULT 'en',
        audio_recording TEXT,
        transcription TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sessions table for express-session
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
      WITH (OIDS=FALSE);
      
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    `);

    console.log("Database schema initialized successfully");
  } catch (error) {
    console.error("Error initializing database schema:", error);
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
