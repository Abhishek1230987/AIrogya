import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || "consultancy_user",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "e_consultancy",
  password: process.env.DB_PASSWORD || "consultancy_2025",
  port: parseInt(process.env.DB_PORT || "5432"),
});

// Test connection
let dbConnected = false;
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
  dbConnected = true;
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL connection error:", err.message);
  dbConnected = false;
});

// Initialize database schema
export const initializeDatabase = async () => {
  try {
    const client = await pool.connect();

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        google_id VARCHAR(255) UNIQUE,
        profile_picture TEXT,
        role VARCHAR(20) DEFAULT 'patient',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Users table ready");

    // Create medical_reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS medical_reports (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        document_type VARCHAR(100),
        file_name VARCHAR(255),
        file_path TEXT,
        extracted_data JSONB,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Add missing columns if they don't exist (for existing tables)
    try {
      await client.query(`
        ALTER TABLE medical_reports 
        ADD COLUMN IF NOT EXISTS document_type VARCHAR(100)
      `);
      await client.query(`
        ALTER TABLE medical_reports 
        ADD COLUMN IF NOT EXISTS extracted_data JSONB
      `);
      await client.query(`
        ALTER TABLE medical_reports 
        ADD COLUMN IF NOT EXISTS original_name VARCHAR(255)
      `);
      await client.query(`
        ALTER TABLE medical_reports 
        ADD COLUMN IF NOT EXISTS file_size BIGINT
      `);
      await client.query(`
        ALTER TABLE medical_reports 
        ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100)
      `);
      await client.query(`
        ALTER TABLE medical_reports 
        ADD COLUMN IF NOT EXISTS extracted_info JSONB
      `);
    } catch (alterError) {
      // Columns might already exist, that's okay
    }

    console.log("✅ Medical reports table ready");

    // Create medical_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS medical_history (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE,
        date_of_birth DATE,
        gender VARCHAR(20),
        blood_type VARCHAR(10),
        allergies TEXT[],
        chronic_conditions TEXT[],
        current_medications TEXT[],
        past_surgeries TEXT[],
        family_history TEXT[],
        emergency_contact JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Add missing columns if they don't exist (for existing tables)
    try {
      await client.query(`
        ALTER TABLE medical_history 
        ADD COLUMN IF NOT EXISTS blood_type VARCHAR(10)
      `);
    } catch (alterError) {
      // Column might already exist, that's okay
    }

    console.log("✅ Medical history table ready");

    // Create voice_consultations table (without foreign key if it causes issues)
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS voice_consultations (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255),
          original_message TEXT,
          transcription TEXT,
          detected_language VARCHAR(50),
          medical_response TEXT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Try to add foreign key separately
      try {
        await client.query(`
          ALTER TABLE voice_consultations 
          ADD CONSTRAINT voice_consultations_user_id_fkey 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        `);
      } catch (fkError) {
        // Foreign key constraint already exists or can't be added - that's okay
        console.log(
          "ℹ️  Voice consultations foreign key already exists or skipped"
        );
      }

      console.log("✅ Voice consultations table ready");
    } catch (vcError) {
      console.error("⚠️  Voice consultations table error:", vcError.message);
      // Continue anyway - table might already exist
    }

    client.release();
    console.log("✅ Database schema initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Database initialization error:", error.message);
    return false;
  }
};

// User operations
export const userDb = {
  // Find user by email
  async findByEmail(email) {
    try {
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding user by email:", error);
      return null;
    }
  },

  // Find user by Google ID
  async findByGoogleId(googleId) {
    try {
      const result = await pool.query(
        "SELECT * FROM users WHERE google_id = $1",
        [googleId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding user by Google ID:", error);
      return null;
    }
  },

  // Find user by ID
  async findById(id) {
    try {
      const result = await pool.query("SELECT * FROM users WHERE id = $1", [
        id,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding user by ID:", error);
      return null;
    }
  },

  // Create new user
  async create(userData) {
    try {
      const { name, email, googleId, profilePicture, role } = userData;
      const result = await pool.query(
        `INSERT INTO users (name, email, google_id, profile_picture, role) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [name, email, googleId, profilePicture, role || "patient"]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  // Update user
  async update(id, userData) {
    try {
      // Build dynamic UPDATE query based on provided fields
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (userData.name !== undefined) {
        updates.push(`name = $${paramCount}`);
        values.push(userData.name);
        paramCount++;
      }
      if (userData.email !== undefined) {
        updates.push(`email = $${paramCount}`);
        values.push(userData.email);
        paramCount++;
      }
      if (userData.profilePicture !== undefined) {
        updates.push(`profile_picture = $${paramCount}`);
        values.push(userData.profilePicture);
        paramCount++;
      }
      if (userData.hasCompletedMedicalHistory !== undefined) {
        updates.push(`has_completed_medical_history = $${paramCount}`);
        values.push(userData.hasCompletedMedicalHistory);
        paramCount++;
      }

      // Always update timestamp
      updates.push("updated_at = CURRENT_TIMESTAMP");

      // Add id as last parameter
      values.push(id);

      const result = await pool.query(
        `UPDATE users 
         SET ${updates.join(", ")} 
         WHERE id = $${paramCount} 
         RETURNING *`,
        values
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },
};

// Medical reports operations
export const medicalReportsDb = {
  // Get all reports for a user
  async getByUserId(userId) {
    try {
      const result = await pool.query(
        "SELECT * FROM medical_reports WHERE user_id = $1 ORDER BY uploaded_at DESC",
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error("Error getting medical reports:", error);
      return [];
    }
  },

  // Create new report
  async create(reportData) {
    try {
      const {
        userId,
        documentType,
        fileName,
        filePath,
        extractedData,
        fileSize,
        mimeType,
      } = reportData;
      const result = await pool.query(
        `INSERT INTO medical_reports (user_id, original_name, file_name, file_path, file_size, mime_type, extracted_info, document_type) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [
          userId,
          fileName,
          fileName,
          filePath,
          fileSize,
          mimeType,
          extractedData,
          documentType,
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error creating medical report:", error);
      throw error;
    }
  },

  // Delete a report
  async delete(reportId, userId) {
    try {
      const result = await pool.query(
        "DELETE FROM medical_reports WHERE id = $1 AND user_id = $2 RETURNING *",
        [reportId, userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error deleting medical report:", error);
      throw error;
    }
  },
};

// Medical history operations
export const medicalHistoryDb = {
  // Get medical history for a user
  async getByUserId(userId) {
    try {
      const result = await pool.query(
        "SELECT * FROM medical_history WHERE user_id = $1",
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error getting medical history:", error);
      return null;
    }
  },

  // Create or update medical history
  async upsert(userId, historyData) {
    try {
      const {
        dateOfBirth,
        gender,
        bloodGroup,
        allergies,
        chronicConditions,
        currentMedications,
        familyHistory,
        emergencyContact,
      } = historyData;

      // First, try to check if record exists
      const existingRecord = await pool.query(
        "SELECT id FROM medical_history WHERE user_id = $1",
        [userId]
      );

      if (existingRecord.rows.length > 0) {
        // Update existing record
        const result = await pool.query(
          `UPDATE medical_history 
           SET date_of_birth = $2, gender = $3, blood_type = $4, allergies = $5, 
               chronic_conditions = $6, current_medications = $7, 
               family_history = $8, emergency_contact = $9, updated_at = CURRENT_TIMESTAMP 
           WHERE user_id = $1
           RETURNING *`,
          [
            userId,
            dateOfBirth,
            gender,
            bloodGroup,
            JSON.stringify(allergies),
            JSON.stringify(chronicConditions),
            JSON.stringify(currentMedications),
            JSON.stringify(familyHistory),
            JSON.stringify(emergencyContact),
          ]
        );
        return result.rows[0];
      } else {
        // Insert new record
        const result = await pool.query(
          `INSERT INTO medical_history 
           (user_id, date_of_birth, gender, blood_type, allergies, chronic_conditions, 
            current_medications, family_history, emergency_contact) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
           RETURNING *`,
          [
            userId,
            dateOfBirth,
            gender,
            bloodGroup,
            JSON.stringify(allergies),
            JSON.stringify(chronicConditions),
            JSON.stringify(currentMedications),
            JSON.stringify(familyHistory),
            JSON.stringify(emergencyContact),
          ]
        );
        return result.rows[0];
      }
      return result.rows[0];
    } catch (error) {
      console.error("Error upserting medical history:", error);
      throw error;
    }
  },
};

// Voice consultations operations
export const voiceConsultationsDb = {
  // Get all consultations for a user
  async getByUserId(userId) {
    try {
      const result = await pool.query(
        "SELECT * FROM voice_consultations WHERE user_id = $1 ORDER BY timestamp DESC",
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error("Error getting voice consultations:", error);
      return [];
    }
  },

  // Create new consultation
  async create(consultationData) {
    try {
      const {
        id,
        userId,
        originalMessage,
        transcription,
        detectedLanguage,
        medicalResponse,
      } = consultationData;

      const result = await pool.query(
        `INSERT INTO voice_consultations 
         (id, user_id, original_message, transcription, detected_language, medical_response) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [
          id,
          userId,
          originalMessage,
          transcription,
          detectedLanguage,
          medicalResponse,
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error creating voice consultation:", error);
      throw error;
    }
  },
};

// Check if database is connected
export const isDatabaseConnected = () => dbConnected;

export default pool;
