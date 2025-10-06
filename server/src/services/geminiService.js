import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

/**
 * Gemini AI Service for Medical Analysis and Voice Consultation
 * Using Google's Gemini API (free tier available)
 *
 * Supported Models:
 * - gemini-pro: Default, balanced performance (Recommended)
 * - gemini-1.5-pro: Latest, best quality
 * - gemini-1.5-flash: Fastest, lower cost
 */
class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || "gemini-pro";
    this.genAI = null;
    this.model = null;

    if (this.apiKey && this.apiKey !== "your-gemini-api-key-here") {
      try {
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: this.modelName });
        console.log(
          `✅ Gemini AI initialized successfully (Model: ${this.modelName})`
        );
      } catch (error) {
        console.error("❌ Gemini AI initialization error:", error.message);
      }
    } else {
      console.log("⚠️ Gemini AI not configured - using mock responses");
      console.log(
        "   Get your free API key from: https://makersuite.google.com/app/apikey"
      );
      console.log("   Add GEMINI_API_KEY to your .env file");
    }
  }

  /**
   * Check if Gemini is available
   */
  isAvailable() {
    return this.model !== null;
  }

  /**
   * Analyze medical document text using Gemini
   */
  async analyzeMedicalDocument(text, fileName) {
    if (!this.isAvailable()) {
      throw new Error("Gemini AI not configured");
    }

    try {
      const prompt = `You are a medical document analyzer. Analyze the following medical document and extract key information.

Document Name: ${fileName}
Document Content:
${text}

Please provide a JSON response with the following structure:
{
  "patientInfo": {
    "name": "patient name if found",
    "patientId": "ID if found",
    "dateOfBirth": "DOB if found"
  },
  "vitals": ["list of vital signs found"],
  "labResults": ["list of lab results found"],
  "dateOfReport": "date of report if found",
  "reportType": "type of medical report",
  "keyFindings": ["list of key medical findings"],
  "recommendations": ["any recommendations or notes from doctor"]
}

Only include fields where you found actual data. Return valid JSON only, no additional text.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();

      // Try to parse JSON from response
      try {
        // Remove markdown code blocks if present
        const cleanedText = textResponse
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        const parsedData = JSON.parse(cleanedText);

        return {
          ...parsedData,
          source: "Google Gemini AI",
          confidence: 90,
          processingMethod: "AI_ANALYSIS",
          extractedTextLength: text.length,
          timestamp: new Date().toISOString(),
        };
      } catch (parseError) {
        console.error("Failed to parse Gemini response as JSON:", parseError);
        // Return structured data from text response
        return {
          patientInfo: { name: "Unknown" },
          vitals: [],
          labResults: [],
          keyFindings: [textResponse.substring(0, 500)],
          source: "Google Gemini AI (text)",
          confidence: 70,
          processingMethod: "AI_ANALYSIS",
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error("Gemini medical analysis error:", error.message);
      throw error;
    }
  }

  /**
   * Generate medical consultation response based on symptoms
   */
  async generateMedicalConsultation(symptoms, userContext = {}) {
    if (!this.isAvailable()) {
      throw new Error("Gemini AI not configured");
    }

    try {
      // Build detailed patient context
      let patientContext = "";

      if (userContext.medicalHistory) {
        const history = userContext.medicalHistory;

        // Add allergies if present
        if (history.allergies && history.allergies.length > 0) {
          patientContext += `\n**Known Allergies:** ${
            Array.isArray(history.allergies)
              ? history.allergies.join(", ")
              : history.allergies
          }`;
        }

        // Add chronic conditions
        if (history.chronicConditions && history.chronicConditions.length > 0) {
          patientContext += `\n**Chronic Conditions:** ${
            Array.isArray(history.chronicConditions)
              ? history.chronicConditions.join(", ")
              : history.chronicConditions
          }`;
        }

        // Add current medications
        if (
          history.currentMedications &&
          history.currentMedications.length > 0
        ) {
          patientContext += `\n**Current Medications:** ${
            Array.isArray(history.currentMedications)
              ? history.currentMedications.join(", ")
              : history.currentMedications
          }`;
        }

        // Add family history
        if (history.familyHistory && history.familyHistory.length > 0) {
          patientContext += `\n**Family Medical History:** ${
            Array.isArray(history.familyHistory)
              ? history.familyHistory.join(", ")
              : history.familyHistory
          }`;
        }

        // Add past surgeries
        if (history.pastSurgeries && history.pastSurgeries.length > 0) {
          patientContext += `\n**Past Surgeries:** ${
            Array.isArray(history.pastSurgeries)
              ? history.pastSurgeries.join(", ")
              : history.pastSurgeries
          }`;
        }

        // Add blood type
        if (history.bloodType) {
          patientContext += `\n**Blood Type:** ${history.bloodType}`;
        }

        // Add gender and age context
        if (history.gender) {
          patientContext += `\n**Gender:** ${history.gender}`;
        }
        if (history.dateOfBirth) {
          const age =
            new Date().getFullYear() -
            new Date(history.dateOfBirth).getFullYear();
          patientContext += `\n**Age:** ${age} years`;
        }
      }

      const prompt = `You are an empathetic and knowledgeable medical AI assistant providing personalized preliminary health advice.

**Patient's Current Query/Symptoms:**
${symptoms}
${patientContext ? `\n**Patient's Medical Background:**${patientContext}` : ""}

**LANGUAGE INSTRUCTION:**
- Detect the language of the patient's query by analyzing the text
- If the query is in ENGLISH (Latin alphabet: a-z), respond in ENGLISH
- If the query contains Devanagari script (ह, म, क, etc.), respond in Hindi Devanagari - NOT Hinglish
- If the query contains Bengali script (বাংলা), respond in Bengali script - NOT English letters
- If the query contains Tamil script (தமிழ்), respond in Tamil script - NOT English letters
- If the query contains any regional script, respond in that same script - NOT transliteration
- Default to English if the query is in Latin alphabet

**Instructions:**
- Provide a brief, personalized response (3-5 sentences) considering the patient's medical history
- If the patient has allergies, warn about medications/treatments they should avoid
- If they have chronic conditions, explain how current symptoms might relate to existing conditions
- Consider medication interactions if they're on current medications
- Be concise and direct - use bullet points for recommendations when appropriate
- Only provide detailed paragraphs if the query is complex or requires careful explanation

**Response Style:**
- Start with brief empathetic acknowledgment (1 sentence)
- Give concise analysis and recommendations (2-3 sentences or bullet points)
- Mention when to seek immediate care if serious
- Keep total response under 100 words for simple queries, 150 words max for complex ones

Remember: This is preliminary guidance, not a substitute for professional medical diagnosis. Be helpful but concise.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const medicalResponse = response.text();

      return {
        transcription: symptoms,
        detectedLanguage: "English",
        medicalResponse: medicalResponse.trim(),
        source: "Google Gemini AI",
        timestamp: new Date().toISOString(),
        usedMedicalHistory: !!userContext.medicalHistory,
      };
    } catch (error) {
      console.error("Gemini consultation error:", error.message);
      throw error;
    }
  }

  /**
   * Analyze symptoms and provide diagnosis suggestions
   */
  async analyzeSymptoms(symptoms) {
    if (!this.isAvailable()) {
      throw new Error("Gemini AI not configured");
    }

    try {
      const prompt = `As a medical AI, analyze these symptoms and provide possible conditions:

Symptoms: ${symptoms}

Provide a JSON response with:
{
  "possibleConditions": ["condition1", "condition2"],
  "urgencyLevel": "low|medium|high|emergency",
  "recommendations": ["recommendation1", "recommendation2"],
  "redFlags": ["warning sign 1", "warning sign 2"]
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();

      try {
        const cleanedText = textResponse
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        return JSON.parse(cleanedText);
      } catch {
        return {
          possibleConditions: ["Unable to analyze"],
          urgencyLevel: "medium",
          recommendations: [textResponse],
          redFlags: [],
        };
      }
    } catch (error) {
      console.error("Gemini symptom analysis error:", error.message);
      throw error;
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
export default geminiService;
