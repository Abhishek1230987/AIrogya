import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Try multiple connection configurations
const connectionConfigs = [
  // Try with consultancy_user first
  {
    user: process.env.DB_USER || "consultancy_user",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "e_consultancy",
    password: process.env.DB_PASSWORD || "consultancy_2025",
    port: parseInt(process.env.DB_PORT || "5432"),
  },
  // Fallback to postgres user with common passwords
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
  {
    user: "postgres",
    host: "localhost",
    database: "postgres",
    password: "admin",
    port: 5432,
  },
  {
    user: "postgres",
    host: "localhost",
    database: "postgres",
    password: "",
    port: 5432,
  },
];

let pool = null;
let connectedConfig = null;

// Function to test database connection
async function testConnection(config) {
  const testPool = new Pool(config);
  try {
    const client = await testPool.connect();
    await client.query("SELECT NOW()");
    client.release();
    return testPool;
  } catch (error) {
    await testPool.end();
    throw error;
  }
}

// Try connecting with different configurations
async function connectToDatabase() {
  for (let i = 0; i < connectionConfigs.length; i++) {
    const config = connectionConfigs[i];
    try {
      console.log(
        `🔄 Trying to connect as '${config.user}' to '${config.database}'...`
      );
      pool = await testConnection(config);
      connectedConfig = config;
      console.log(
        `✅ Connected successfully as '${config.user}' to '${config.database}'`
      );
      return pool;
    } catch (error) {
      console.log(`❌ Failed to connect as '${config.user}': ${error.message}`);
    }
  }
  throw new Error("Could not connect to PostgreSQL with any configuration");
}

// Initialize database schema
export const initializeDatabase = async () => {
  if (!pool) {
    pool = await connectToDatabase();
  }

  const client = await pool.connect();

  try {
    // If we connected to postgres database, create our app database first
    if (connectedConfig.database === "postgres") {
      console.log("🔧 Creating application database...");

      try {
        await client.query("CREATE DATABASE e_consultancy;");
        console.log("✅ Database e_consultancy created");
      } catch (error) {
        if (error.code === "42P04") {
          console.log("ℹ️ Database e_consultancy already exists");
        } else {
          console.log("⚠️ Error creating database:", error.message);
        }
      }

      try {
        await client.query(
          "CREATE USER consultancy_user WITH ENCRYPTED PASSWORD 'consultancy_2025';"
        );
        console.log("✅ User consultancy_user created");
      } catch (error) {
        if (error.code === "42710") {
          console.log("ℹ️ User consultancy_user already exists");
        } else {
          console.log("⚠️ Error creating user:", error.message);
        }
      }

      await client.query(
        "GRANT ALL PRIVILEGES ON DATABASE e_consultancy TO consultancy_user;"
      );

      // Now connect to the actual application database
      client.release();

      const appConfig = {
        ...connectedConfig,
        database: "e_consultancy",
      };

      const appPool = new Pool(appConfig);
      const appClient = await appPool.connect();

      await appClient.query("GRANT ALL ON SCHEMA public TO consultancy_user;");
      await appClient.query(
        "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO consultancy_user;"
      );

      client = appClient;
      pool = appPool;
    }

    // Create application tables
    console.log("🔧 Creating application tables...");

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
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
      WITH (OIDS=FALSE);
      
      ALTER TABLE sessions ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    `);

    console.log("✅ Database schema initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing database schema:", error);
    throw error;
  } finally {
    client.release();
  }
};

export default pool;
