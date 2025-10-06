import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

let pool = null;
let usingDatabase = false;

// In-memory storage fallback
const memoryStore = {
  users: new Map(),
  medicalHistories: new Map(),
  medicalReports: new Map(),
  consultations: new Map(),
};

// Try to connect to PostgreSQL
async function initializeDatabase() {
  const connectionConfigs = [
    {
      user: process.env.DB_USER || "consultancy_user",
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "e_consultancy",
      password: process.env.DB_PASSWORD || "consultancy_2025",
      port: parseInt(process.env.DB_PORT || "5432"),
    },
    {
      user: "postgres",
      host: "localhost",
      database: "postgres",
      password: "postgres",
      port: 5432,
    },
    {
      user: "postgres",
      host: "localhost",
      database: "postgres",
      password: "password",
      port: 5432,
    },
  ];

  for (const config of connectionConfigs) {
    try {
      console.log(`🔄 Trying to connect to PostgreSQL as '${config.user}'...`);
      const testPool = new Pool(config);
      const client = await testPool.connect();
      await client.query("SELECT NOW()");
      client.release();

      pool = testPool;
      usingDatabase = true;
      console.log(`✅ Connected to PostgreSQL as '${config.user}'`);

      // Create tables if needed
      await createTables();
      return;
    } catch (error) {
      console.log(`❌ Failed to connect as '${config.user}': ${error.message}`);
    }
  }

  console.log("⚠️  PostgreSQL connection failed. Using in-memory storage.");
  console.log("💡 Your data will not persist between server restarts.");
  console.log(
    "🔧 To set up PostgreSQL, run as Administrator: .\\reset-postgres-password.bat"
  );
  usingDatabase = false;
}

async function createTables() {
  if (!pool) return;

  const client = await pool.connect();

  try {
    // Create tables (same as before)
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

    console.log("✅ Database tables verified/created");
  } catch (error) {
    console.error("❌ Error creating tables:", error.message);
  } finally {
    client.release();
  }
}

// Hybrid data access functions
export const dbQuery = async (text, params) => {
  if (usingDatabase && pool) {
    const result = await pool.query(text, params);
    return result.rows;
  } else {
    throw new Error("Database not available - using memory storage");
  }
};

export const isUsingDatabase = () => usingDatabase;
export const getMemoryStore = () => memoryStore;

export { initializeDatabase };
export default pool;
