import { TranslationServiceClient } from "@google-cloud/translate";
import speech from "@google-cloud/speech";
import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";

const speechClient = new speech.SpeechClient();
const translationClient = new TranslationServiceClient();
const storage = new Storage();

export class AudioProcessingService {
  constructor() {
    this.bucketName = process.env.GOOGLE_CLOUD_BUCKET || "your-bucket-name";
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || "your-project-id";
  }

  async processAudio(audioBuffer, mimeType) {
    try {
      // Upload audio to Cloud Storage temporarily
      const fileName = `audio-${uuidv4()}`;
      const bucket = storage.bucket(this.bucketName);
      const file = bucket.file(fileName);
      await file.save(audioBuffer, {
        metadata: { contentType: mimeType },
      });

      // Get signed URL for the uploaded file
      const [url] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 60 * 1000, // 1 minute
      });

      // Perform speech recognition
      const [response] = await speechClient.recognize({
        audio: {
          uri: url,
        },
        config: {
          encoding: "LINEAR16",
          sampleRateHertz: 16000,
          languageCode: "te-IN", // Telugu language
          alternativeLanguageCodes: ["en-US", "hi-IN"], // Support for multiple languages
        },
      });

      // Get transcription and detected language
      const transcription = response.results
        .map((result) => result.alternatives[0].transcript)
        .join("\n");
      const detectedLanguage = response.results[0]?.languageCode || "unknown";

      // Translate to English if not in English
      let englishTranslation = transcription;
      if (detectedLanguage !== "en-US") {
        const [translation] = await translationClient.translateText({
          parent: `projects/${this.projectId}/locations/global`,
          contents: [transcription],
          mimeType: "text/plain",
          sourceLanguageCode: detectedLanguage.split("-")[0],
          targetLanguageCode: "en",
        });

        englishTranslation = translation.translations[0].translatedText;
      }

      // Clean up - delete the temporary file
      await file.delete();

      return {
        transcript: transcription,
        detectedLanguage,
        englishTranslation,
      };
    } catch (error) {
      console.error("Error processing audio:", error);
      throw error;
    }
  }
}

export const audioProcessingService = new AudioProcessingService();
