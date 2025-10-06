import pool from "../config/database.js";

export class MedicalHistory {
  constructor(
    id,
    userId,
    date,
    symptoms,
    diagnosis,
    prescription,
    doctorNotes,
    languageUsed,
    audioRecording,
    transcription,
    createdAt,
    updatedAt
  ) {
    this.id = id;
    this.userId = userId;
    this.date = date;
    this.symptoms = symptoms;
    this.diagnosis = diagnosis;
    this.prescription = prescription;
    this.doctorNotes = doctorNotes;
    this.languageUsed = languageUsed || "en";
    this.audioRecording = audioRecording;
    this.transcription = transcription;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Create a new medical history entry
  static async create({
    userId,
    symptoms,
    diagnosis,
    prescription,
    doctorNotes,
    languageUsed = "en",
    audioRecording,
    transcription,
  }) {
    const client = await pool.connect();

    try {
      const result = await client.query(
        `INSERT INTO medical_history (user_id, symptoms, diagnosis, prescription, doctor_notes, language_used, audio_recording, transcription) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [
          userId,
          symptoms,
          diagnosis,
          prescription,
          doctorNotes,
          languageUsed,
          audioRecording,
          transcription,
        ]
      );

      const data = result.rows[0];
      return new MedicalHistory(
        data.id,
        data.user_id,
        data.date,
        data.symptoms,
        data.diagnosis,
        data.prescription,
        data.doctor_notes,
        data.language_used,
        data.audio_recording,
        data.transcription,
        data.created_at,
        data.updated_at
      );
    } finally {
      client.release();
    }
  }

  // Find medical history by user ID
  static async findByUserId(userId) {
    const client = await pool.connect();

    try {
      const result = await client.query(
        "SELECT * FROM medical_history WHERE user_id = $1 ORDER BY date DESC",
        [userId]
      );

      return result.rows.map(
        (data) =>
          new MedicalHistory(
            data.id,
            data.user_id,
            data.date,
            data.symptoms,
            data.diagnosis,
            data.prescription,
            data.doctor_notes,
            data.language_used,
            data.audio_recording,
            data.transcription,
            data.created_at,
            data.updated_at
          )
      );
    } finally {
      client.release();
    }
  }

  // Find medical history by ID
  static async findById(id) {
    const client = await pool.connect();

    try {
      const result = await client.query(
        "SELECT * FROM medical_history WHERE id = $1",
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const data = result.rows[0];
      return new MedicalHistory(
        data.id,
        data.user_id,
        data.date,
        data.symptoms,
        data.diagnosis,
        data.prescription,
        data.doctor_notes,
        data.language_used,
        data.audio_recording,
        data.transcription,
        data.created_at,
        data.updated_at
      );
    } finally {
      client.release();
    }
  }

  // Update medical history
  async update(updateData) {
    const client = await pool.connect();

    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;

      if (updateData.symptoms) {
        setClause.push(`symptoms = $${paramCount}`);
        values.push(updateData.symptoms);
        paramCount++;
      }

      if (updateData.diagnosis) {
        setClause.push(`diagnosis = $${paramCount}`);
        values.push(updateData.diagnosis);
        paramCount++;
      }

      if (updateData.prescription) {
        setClause.push(`prescription = $${paramCount}`);
        values.push(updateData.prescription);
        paramCount++;
      }

      if (updateData.doctorNotes) {
        setClause.push(`doctor_notes = $${paramCount}`);
        values.push(updateData.doctorNotes);
        paramCount++;
      }

      if (updateData.languageUsed) {
        setClause.push(`language_used = $${paramCount}`);
        values.push(updateData.languageUsed);
        paramCount++;
      }

      if (updateData.transcription) {
        setClause.push(`transcription = $${paramCount}`);
        values.push(updateData.transcription);
        paramCount++;
      }

      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(this.id);

      const result = await client.query(
        `UPDATE medical_history SET ${setClause.join(
          ", "
        )} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      const data = result.rows[0];
      this.symptoms = data.symptoms;
      this.diagnosis = data.diagnosis;
      this.prescription = data.prescription;
      this.doctorNotes = data.doctor_notes;
      this.languageUsed = data.language_used;
      this.transcription = data.transcription;
      this.updatedAt = data.updated_at;

      return this;
    } finally {
      client.release();
    }
  }

  // Delete medical history
  async delete() {
    const client = await pool.connect();

    try {
      await client.query("DELETE FROM medical_history WHERE id = $1", [
        this.id,
      ]);
      return true;
    } finally {
      client.release();
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      date: this.date,
      symptoms: this.symptoms,
      diagnosis: this.diagnosis,
      prescription: this.prescription,
      doctorNotes: this.doctorNotes,
      languageUsed: this.languageUsed,
      audioRecording: this.audioRecording,
      transcription: this.transcription,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
