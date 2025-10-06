import CloudVoiceService from "../services/cloudVoiceService.js";
import VoiceConsultationModel from "../models/VoiceConsultation.js";
import { geminiService } from "../services/geminiService.js";
import fs from "fs";

const cloudVoiceService = new CloudVoiceService();

// Initialize speech client (will work with service account or default credentials)
let speechClient = null;
try {
  speechClient = new SpeechClient();
} catch (error) {
  console.log("⚠️ Google Speech-to-Text not configured, using fallback method");
}

/**
 * Transcribe audio file to text
 * @param {string} audioFilePath - Path to the audio file
 * @param {string} language - Language code (auto for auto-detection)
 * @returns {Object} Transcription result with original message, English translation, and detected language
 */
export const transcribeAudio = async (audioFilePath, language = "auto") => {
  try {
    // Validate audio file exists and has sufficient size
    const MIN_AUDIO_SIZE = 1000; // 1KB minimum

    if (!fs.existsSync(audioFilePath)) {
      throw new Error("Audio file not found");
    }

    const stats = fs.statSync(audioFilePath);
    if (stats.size < MIN_AUDIO_SIZE) {
      console.log(
        `❌ Audio file too small (${stats.size} bytes) - likely silent or no voice detected`
      );
      throw new Error("VOICE_NOT_DETECTED");
    }

    // Method 1: Google Speech-to-Text (Primary)
    if (speechClient) {
      return await transcribeWithGoogle(audioFilePath, language);
    }

    // Method 2: Mock transcription (Development)
    console.log("⚠️ Using mock transcription for development");

    // Simulate different languages for testing
    const mockScenarios = [
      {
        originalMessage:
          "Tengo dolor de cabeza y fiebre desde hace 3 días. El dolor es muy fuerte y la fiebre llega a 39°C.",
        transcription:
          "I have been experiencing headache and fever for the past 3 days. The headache is severe and the fever reaches 102°F.",
        detectedLanguage: "es",
        confidence: 0.95,
      },
      {
        originalMessage:
          "J'ai mal à la tête et de la fièvre depuis 3 jours. La douleur est intense.",
        transcription:
          "I have a headache and fever for 3 days. The pain is intense.",
        detectedLanguage: "fr",
        confidence: 0.92,
      },
      {
        originalMessage:
          "मुझे तीन दिन से सिरदर्द और बुखार है। दर्द बहुत तेज है।",
        transcription:
          "I have had headache and fever for three days. The pain is very severe.",
        detectedLanguage: "hi",
        confidence: 0.88,
      },
      {
        originalMessage:
          "I have been experiencing headache and fever for the past 3 days. The headache is severe and I feel tired.",
        transcription:
          "I have been experiencing headache and fever for the past 3 days. The headache is severe and I feel tired.",
        detectedLanguage: "en",
        confidence: 0.97,
      },
    ];

    // Return a random scenario for testing
    return mockScenarios[Math.floor(Math.random() * mockScenarios.length)];
  } catch (error) {
    console.error("❌ Transcription error:", error);
    throw new Error("Failed to transcribe audio");
  }
};

/**
 * Transcribe using Google Speech-to-Text
 */
const transcribeWithGoogle = async (audioFilePath, language) => {
  try {
    const audioBytes = fs.readFileSync(audioFilePath).toString("base64");

    const audio = {
      content: audioBytes,
    };

    const config = {
      encoding: "WEBM_OPUS",
      sampleRateHertz: 48000,
      languageCode: language === "auto" ? "en-US" : language,
      alternativeLanguageCodes: [
        "es-ES",
        "fr-FR",
        "de-DE",
        "it-IT",
        "pt-BR",
        "hi-IN",
      ],
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: false,
      model: "medical_conversation", // Use medical model if available
    };

    const request = {
      audio: audio,
      config: config,
    };

    console.log("🔄 Sending to Google Speech-to-Text...");
    const [response] = await speechClient.recognize(request);

    if (response.results && response.results.length > 0) {
      const transcription = response.results
        .map((result) => result.alternatives[0].transcript)
        .join(" ");

      const detectedLanguage =
        response.results[0]?.languageCode?.substring(0, 2) || "en";

      console.log("✅ Google transcription successful");

      // If the detected language is not English, we'll need translation
      if (detectedLanguage !== "en") {
        // For now, return the same text as both original and translated
        // In production, you'd use Google Translate API here
        return {
          originalMessage: transcription,
          transcription: transcription, // Would be translated to English
          detectedLanguage: detectedLanguage,
          confidence: response.results[0]?.alternatives[0]?.confidence || 0.9,
        };
      } else {
        return {
          originalMessage: transcription,
          transcription: transcription,
          detectedLanguage: "en",
          confidence: response.results[0]?.alternatives[0]?.confidence || 0.9,
        };
      }
    } else {
      throw new Error("No transcription results from Google Speech-to-Text");
    }
  } catch (error) {
    console.error("❌ Google Speech-to-Text error:", error);
    throw error;
  }
};

/**
 * Generate medical response using AI (Gemini) or mock response
 * @param {string} transcription - The transcribed medical query
 * @returns {string} AI-generated medical response
 */
export const generateMedicalResponse = async (transcription) => {
  try {
    // Method 1: Google Gemini AI (Primary)
    if (geminiService.isAvailable()) {
      return await generateWithGemini(transcription);
    }

    // Method 2: Mock response (Development)
    console.log("⚠️ Using mock medical response for development");
    return generateMockMedicalResponse(transcription);
  } catch (error) {
    console.error("❌ Medical response generation error:", error);
    throw new Error("Failed to generate medical response");
  }
};

/**
 * Generate medical response using Google Gemini AI
 */
const generateWithGemini = async (transcription) => {
  try {
    console.log("🤖 Generating response with Google Gemini AI...");

    const result = await geminiService.generateMedicalConsultation(
      transcription
    );
    console.log("✅ Gemini AI medical response generated");
    return result.medicalResponse;
  } catch (error) {
    console.error("❌ Gemini medical response error:", error);
    throw error;
  }
};

/**
 * Generate mock medical response for development
 */
const generateMockMedicalResponse = (transcription) => {
  const mockResponses = [
    `Based on your symptoms of headache and fever, this could indicate a viral infection or flu. Here are some general recommendations:

🌡️ **Immediate care:**
- Rest and stay hydrated
- Take acetaminophen or ibuprofen for fever
- Apply cold compress for headache

⚠️ **Seek medical attention if:**
- Fever exceeds 103°F (39.4°C)
- Severe headache with neck stiffness
- Symptoms worsen after 3-4 days

💡 **General advice:**
- Monitor your temperature regularly
- Get plenty of sleep
- Avoid close contact with others

**Disclaimer:** This is general information only. Please consult a healthcare professional for proper diagnosis and treatment.`,

    `Your symptoms suggest you may be experiencing a common cold or viral infection. Here's what you can do:

🏠 **Home care:**
- Rest is crucial for recovery
- Drink plenty of fluids (water, herbal tea)
- Use a humidifier if available

💊 **Symptom management:**
- Over-the-counter pain relievers for aches
- Throat lozenges for throat discomfort
- Saltwater gargle may help

📞 **Contact a doctor if:**
- Symptoms persist beyond a week
- Difficulty breathing or chest pain
- High fever that doesn't respond to medication

**Important:** This is educational information. Always consult healthcare professionals for medical concerns.`,
  ];

  return mockResponses[Math.floor(Math.random() * mockResponses.length)];
};

/**
 * Save audio to cloud storage (AWS S3 or Google Cloud Storage)
 * @param {string} audioFilePath - Local path to audio file
 * @param {string} fileName - Desired filename in cloud storage
 * @returns {string} Cloud storage URL
 */
export const saveToCloudStorage = async (audioFilePath, fileName) => {
  try {
    // TODO: Implement cloud storage upload
    // This is a placeholder for future implementation
    console.log("📁 Cloud storage not yet implemented");
    return `/uploads/audio/${fileName}`;
  } catch (error) {
    console.error("❌ Cloud storage error:", error);
    throw error;
  }
};
