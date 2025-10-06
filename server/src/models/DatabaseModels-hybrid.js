// Hybrid database models that work with both PostgreSQL and in-memory storage
import {
  dbQuery,
  isUsingDatabase,
  getMemoryStore,
} from "../config/database-hybrid.js";

const memoryStore = getMemoryStore();
let userIdCounter = 1;
let reportIdCounter = 1;

export class UserModel {
  static async findById(id) {
    if (isUsingDatabase()) {
      const result = await dbQuery("SELECT * FROM users WHERE id = $1", [id]);
      return result[0];
    } else {
      // Search through all users by ID
      for (const [key, user] of memoryStore.users) {
        if (user.id == id) return user;
      }
      return null;
    }
  }

  static async findByGoogleId(googleId) {
    if (isUsingDatabase()) {
      const result = await dbQuery("SELECT * FROM users WHERE google_id = $1", [
        googleId,
      ]);
      return result[0];
    } else {
      return memoryStore.users.get(googleId);
    }
  }

  static async findByEmail(email) {
    if (isUsingDatabase()) {
      const result = await dbQuery("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      return result[0];
    } else {
      // Check if user exists with email as key (regular registration)
      if (memoryStore.users.has(email)) {
        return memoryStore.users.get(email);
      }
      // Otherwise search through all users by email
      for (const [key, user] of memoryStore.users) {
        if (user.email === email) return user;
      }
      return null;
    }
  }

  static async create(userData) {
    const { name, email, google_id, profile_picture, password } = userData;

    if (isUsingDatabase()) {
      const result = await dbQuery(
        "INSERT INTO users (name, email, google_id, profile_picture, password) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [name, email, google_id, profile_picture, password]
      );
      return result[0];
    } else {
      const user = {
        id: userIdCounter++,
        name,
        email,
        google_id,
        profile_picture,
        password,
        role: "patient",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      // For regular users, use email as key; for Google users, use google_id
      const key = google_id || email;
      memoryStore.users.set(key, user);
      return user;
    }
  }

  static async update(id, userData) {
    if (isUsingDatabase()) {
      const fields = Object.keys(userData)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(", ");
      const values = Object.values(userData);
      const result = await dbQuery(
        `UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [id, ...values]
      );
      return result[0];
    } else {
      // Find and update in memory
      for (const [key, user] of memoryStore.users) {
        if (user.id == id) {
          const updatedUser = {
            ...user,
            ...userData,
            updated_at: new Date().toISOString(),
          };
          memoryStore.users.set(key, updatedUser);
          return updatedUser;
        }
      }
      return null;
    }
  }
}

export class MedicalHistoryModel {
  static async findByUserId(userId) {
    if (isUsingDatabase()) {
      const result = await dbQuery(
        "SELECT * FROM medical_history WHERE user_id = $1",
        [userId]
      );
      return result[0];
    } else {
      return memoryStore.medicalHistories.get(userId);
    }
  }

  static async create(userId, medicalData) {
    if (isUsingDatabase()) {
      const {
        dateOfBirth,
        gender,
        bloodType,
        height,
        weight,
        chronicConditions,
        currentMedications,
        allergies,
        familyHistory,
        smokingStatus,
        drinkingStatus,
        exerciseFrequency,
        emergencyContact,
        additionalNotes,
      } = medicalData;

      const result = await dbQuery(
        `
        INSERT INTO medical_history (
          user_id, date_of_birth, gender, blood_type, height_cm, weight_kg,
          chronic_conditions, current_medications, allergies, family_history,
          smoking_status, drinking_status, exercise_frequency,
          emergency_contact, additional_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `,
        [
          userId,
          dateOfBirth,
          gender,
          bloodType,
          height,
          weight,
          JSON.stringify(chronicConditions || []),
          JSON.stringify(currentMedications || []),
          JSON.stringify(allergies || []),
          JSON.stringify(familyHistory || {}),
          smokingStatus,
          drinkingStatus,
          exerciseFrequency,
          JSON.stringify(emergencyContact || {}),
          additionalNotes,
        ]
      );
      return result[0];
    } else {
      const history = {
        id: Date.now(),
        user_id: userId,
        ...medicalData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryStore.medicalHistories.set(userId, history);
      return history;
    }
  }

  static async update(userId, medicalData) {
    if (isUsingDatabase()) {
      const {
        dateOfBirth,
        gender,
        bloodType,
        height,
        weight,
        chronicConditions,
        currentMedications,
        allergies,
        familyHistory,
        smokingStatus,
        drinkingStatus,
        exerciseFrequency,
        emergencyContact,
        additionalNotes,
      } = medicalData;

      const result = await dbQuery(
        `
        UPDATE medical_history SET
          date_of_birth = $2, gender = $3, blood_type = $4, height_cm = $5, weight_kg = $6,
          chronic_conditions = $7, current_medications = $8, allergies = $9,
          family_history = $10, smoking_status = $11, drinking_status = $12,
          exercise_frequency = $13, emergency_contact = $14, additional_notes = $15,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `,
        [
          userId,
          dateOfBirth,
          gender,
          bloodType,
          height,
          weight,
          JSON.stringify(chronicConditions || []),
          JSON.stringify(currentMedications || []),
          JSON.stringify(allergies || []),
          JSON.stringify(familyHistory || {}),
          smokingStatus,
          drinkingStatus,
          exerciseFrequency,
          JSON.stringify(emergencyContact || {}),
          additionalNotes,
        ]
      );
      return result[0];
    } else {
      const existing = memoryStore.medicalHistories.get(userId);
      if (existing) {
        const updated = {
          ...existing,
          ...medicalData,
          updated_at: new Date().toISOString(),
        };
        memoryStore.medicalHistories.set(userId, updated);
        return updated;
      }
      return null;
    }
  }

  static async upsert(userId, medicalData) {
    const existing = await this.findByUserId(userId);
    if (existing) {
      return this.update(userId, medicalData);
    } else {
      return this.create(userId, medicalData);
    }
  }
}

export class MedicalReportModel {
  static async findByUserId(userId) {
    if (isUsingDatabase()) {
      const result = await dbQuery(
        "SELECT * FROM medical_reports WHERE user_id = $1 ORDER BY uploaded_at DESC",
        [userId]
      );
      return result;
    } else {
      const reports = memoryStore.medicalReports.get(userId) || [];
      return reports.sort(
        (a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)
      );
    }
  }

  static async create(userId, reportData) {
    const {
      originalName,
      fileName,
      filePath,
      fileSize,
      mimeType,
      extractedInfo,
      processingStatus,
    } = reportData;

    if (isUsingDatabase()) {
      const result = await dbQuery(
        `
        INSERT INTO medical_reports (
          user_id, original_name, file_name, file_path,
          file_size, mime_type, extracted_info, processing_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
        [
          userId,
          originalName,
          fileName,
          filePath,
          fileSize,
          mimeType,
          JSON.stringify(extractedInfo || {}),
          processingStatus || "completed",
        ]
      );
      return result[0];
    } else {
      const report = {
        id: reportIdCounter++,
        user_id: userId,
        original_name: originalName,
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize,
        mime_type: mimeType,
        extracted_info: extractedInfo || {},
        processing_status: processingStatus || "completed",
        uploaded_at: new Date().toISOString(),
      };

      if (!memoryStore.medicalReports.has(userId)) {
        memoryStore.medicalReports.set(userId, []);
      }
      memoryStore.medicalReports.get(userId).push(report);
      return report;
    }
  }

  static async findById(id) {
    if (isUsingDatabase()) {
      const result = await dbQuery(
        "SELECT * FROM medical_reports WHERE id = $1",
        [id]
      );
      return result[0];
    } else {
      for (const [userId, reports] of memoryStore.medicalReports) {
        const report = reports.find((r) => r.id == id);
        if (report) return report;
      }
      return null;
    }
  }

  static async delete(id, userId) {
    if (isUsingDatabase()) {
      const result = await dbQuery(
        "DELETE FROM medical_reports WHERE id = $1 AND user_id = $2 RETURNING *",
        [id, userId]
      );
      return result[0];
    } else {
      const reports = memoryStore.medicalReports.get(userId) || [];
      const index = reports.findIndex((r) => r.id == id);
      if (index > -1) {
        return reports.splice(index, 1)[0];
      }
      return null;
    }
  }
}
