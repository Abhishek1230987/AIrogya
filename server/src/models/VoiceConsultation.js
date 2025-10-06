import { pool } from "../config/database-hybrid.js";

export class VoiceConsultationModel {
  /**
   * Create a new voice consultation record
   */
  static async create(consultationData) {
    const {
      userId,
      audioFileId,
      audioCloudUrl,
      audioFilename,
      originalFilename,
      originalText,
      translatedText,
      detectedLanguage,
      transcriptionConfidence,
      aiResponse,
      patientAge,
      patientGender,
      symptomsCategory,
      urgencyLevel,
      processingTimeMs,
    } = consultationData;

    const query = `
      INSERT INTO voice_consultations (
        user_id, audio_file_id, audio_cloud_url, audio_filename, original_filename,
        original_text, translated_text, detected_language, transcription_confidence,
        ai_response, patient_age, patient_gender, symptoms_category, urgency_level,
        processing_time_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      userId,
      audioFileId,
      audioCloudUrl,
      audioFilename,
      originalFilename,
      originalText,
      translatedText,
      detectedLanguage,
      transcriptionConfidence,
      aiResponse,
      patientAge,
      patientGender,
      symptomsCategory,
      urgencyLevel,
      processingTimeMs,
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error creating voice consultation:", error);
      throw error;
    }
  }

  /**
   * Get voice consultations by user ID
   */
  static async getByUserId(userId, limit = 20, offset = 0) {
    const query = `
      SELECT 
        id, audio_file_id, audio_cloud_url, audio_filename,
        original_text, translated_text, detected_language,
        ai_response, patient_age, patient_gender, symptoms_category,
        urgency_level, created_at
      FROM voice_consultations 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;

    try {
      const result = await pool.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      console.error("Error fetching user consultations:", error);
      throw error;
    }
  }

  /**
   * Get a specific consultation by ID
   */
  static async getById(consultationId) {
    const query = `
      SELECT * FROM voice_consultations 
      WHERE id = $1
    `;

    try {
      const result = await pool.query(query, [consultationId]);
      return result.rows[0];
    } catch (error) {
      console.error("Error fetching consultation by ID:", error);
      throw error;
    }
  }

  /**
   * Log transcription details
   */
  static async logTranscription(transcriptionData) {
    const {
      consultationId,
      speechServiceUsed,
      languageCode,
      confidenceScore,
      wordCount,
      translationService,
      sourceLanguage,
      targetLanguage,
      transcriptionTimeMs,
      translationTimeMs,
    } = transcriptionData;

    const query = `
      INSERT INTO transcription_logs (
        consultation_id, speech_service_used, language_code, confidence_score,
        word_count, translation_service, source_language, target_language,
        transcription_time_ms, translation_time_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      consultationId,
      speechServiceUsed,
      languageCode,
      confidenceScore,
      wordCount,
      translationService,
      sourceLanguage,
      targetLanguage,
      transcriptionTimeMs,
      translationTimeMs,
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error logging transcription:", error);
      throw error;
    }
  }

  /**
   * Log AI response details
   */
  static async logAIResponse(responseData) {
    const {
      consultationId,
      modelName,
      promptTokens,
      completionTokens,
      totalTokens,
      responseTimeMs,
      responseLengthChars,
      containsDisclaimer,
      mentionsProfessionalHelp,
    } = responseData;

    const query = `
      INSERT INTO ai_response_logs (
        consultation_id, model_name, prompt_tokens, completion_tokens,
        total_tokens, response_time_ms, response_length_chars,
        contains_disclaimer, mentions_professional_help
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      consultationId,
      modelName,
      promptTokens,
      completionTokens,
      totalTokens,
      responseTimeMs,
      responseLengthChars,
      containsDisclaimer,
      mentionsProfessionalHelp,
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error logging AI response:", error);
      throw error;
    }
  }

  /**
   * Get consultation analytics
   */
  static async getAnalytics(days = 30) {
    const query = `
      SELECT * FROM consultation_analytics 
      WHERE consultation_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY consultation_date DESC
    `;

    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error("Error fetching consultation analytics:", error);
      throw error;
    }
  }

  /**
   * Search consultations by text content
   */
  static async searchByText(userId, searchText, limit = 10) {
    const query = `
      SELECT 
        id, original_text, translated_text, detected_language,
        ai_response, symptoms_category, created_at
      FROM voice_consultations 
      WHERE user_id = $1 
      AND (
        original_text ILIKE $2 OR 
        translated_text ILIKE $2 OR 
        ai_response ILIKE $2 OR
        symptoms_category ILIKE $2
      )
      ORDER BY created_at DESC 
      LIMIT $3
    `;

    try {
      const searchPattern = `%${searchText}%`;
      const result = await pool.query(query, [userId, searchPattern, limit]);
      return result.rows;
    } catch (error) {
      console.error("Error searching consultations:", error);
      throw error;
    }
  }

  /**
   * Update consultation urgency level
   */
  static async updateUrgencyLevel(consultationId, urgencyLevel) {
    const query = `
      UPDATE voice_consultations 
      SET urgency_level = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [urgencyLevel, consultationId]);
      return result.rows[0];
    } catch (error) {
      console.error("Error updating urgency level:", error);
      throw error;
    }
  }

  /**
   * Get urgent consultations for admin review
   */
  static async getUrgentConsultations(limit = 50) {
    const query = `
      SELECT 
        vc.*, u.name as user_name, u.email as user_email
      FROM voice_consultations vc
      JOIN users u ON vc.user_id = u.id
      WHERE vc.urgency_level IN ('high', 'emergency')
      ORDER BY 
        CASE 
          WHEN vc.urgency_level = 'emergency' THEN 1
          WHEN vc.urgency_level = 'high' THEN 2
          ELSE 3
        END,
        vc.created_at DESC
      LIMIT $1
    `;

    try {
      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error("Error fetching urgent consultations:", error);
      throw error;
    }
  }
}

export default VoiceConsultationModel;
