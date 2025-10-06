// Database models for E-Consultancy
import pool from "../config/database-flexible.js";

export class UserModel {
  static async findById(id) {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0];
  }

  static async findByGoogleId(googleId) {
    const result = await pool.query(
      "SELECT * FROM users WHERE google_id = $1",
      [googleId]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return result.rows[0];
  }

  static async create(userData) {
    const { name, email, google_id, profile_picture } = userData;
    const result = await pool.query(
      "INSERT INTO users (name, email, google_id, profile_picture) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, email, google_id, profile_picture]
    );
    return result.rows[0];
  }

  static async update(id, userData) {
    const fields = Object.keys(userData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ");
    const values = Object.values(userData);
    const result = await pool.query(
      `UPDATE users SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  }
}

export class MedicalHistoryModel {
  static async findByUserId(userId) {
    const result = await pool.query(
      "SELECT * FROM medical_history WHERE user_id = $1",
      [userId]
    );
    return result.rows[0];
  }

  static async create(userId, medicalData) {
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

    const result = await pool.query(
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
    return result.rows[0];
  }

  static async update(userId, medicalData) {
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

    const result = await pool.query(
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
    return result.rows[0];
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
    const result = await pool.query(
      "SELECT * FROM medical_reports WHERE user_id = $1 ORDER BY uploaded_at DESC",
      [userId]
    );
    return result.rows;
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

    const result = await pool.query(
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
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      "SELECT * FROM medical_reports WHERE id = $1",
      [id]
    );
    return result.rows[0];
  }

  static async updateExtractedInfo(id, extractedInfo) {
    const result = await pool.query(
      "UPDATE medical_reports SET extracted_info = $1, processing_status = $2 WHERE id = $3 RETURNING *",
      [JSON.stringify(extractedInfo), "completed", id]
    );
    return result.rows[0];
  }

  static async delete(id, userId) {
    const result = await pool.query(
      "DELETE FROM medical_reports WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, userId]
    );
    return result.rows[0];
  }
}

export class ConsultationModel {
  static async findByUserId(userId) {
    const result = await pool.query(
      "SELECT * FROM consultations WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return result.rows;
  }

  static async create(userId, consultationData) {
    const {
      doctorId,
      symptoms,
      diagnosis,
      prescription,
      doctorNotes,
      languageUsed,
      audioRecording,
      transcription,
      status,
    } = consultationData;

    const result = await pool.query(
      `
      INSERT INTO consultations (
        user_id, doctor_id, symptoms, diagnosis, prescription,
        doctor_notes, language_used, audio_recording,
        transcription, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
      [
        userId,
        doctorId,
        symptoms,
        diagnosis || null,
        prescription || null,
        doctorNotes || null,
        languageUsed || "en",
        audioRecording || null,
        transcription || null,
        status || "pending",
      ]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      "SELECT * FROM consultations WHERE id = $1",
      [id]
    );
    return result.rows[0];
  }

  static async update(id, updateData) {
    const fields = Object.keys(updateData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ");
    const values = Object.values(updateData);
    const result = await pool.query(
      `UPDATE consultations SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  }
}
