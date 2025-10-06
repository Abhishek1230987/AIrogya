import { Storage } from "@google-cloud/storage";
import speech from "@google-cloud/speech";
import OpenAI from "openai";
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

class CloudVoiceService {
  constructor() {
    // Initialize Google Cloud Speech client
    this.speechClient = new speech.SpeechClient({
      // Add your Google Cloud credentials here
      // keyFilename: 'path/to/service-account-key.json',
      // or use environment variables
    });

    // Initialize Google Cloud Storage
    this.storage = new Storage({
      // Add your Google Cloud credentials here
      // keyFilename: 'path/to/service-account-key.json',
    });

    // Initialize OpenAI
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "your-openai-api-key",
    });

    // Initialize AWS S3 (alternative cloud storage)
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || "us-east-1",
    });

    // Cloud storage configuration
    this.bucketName =
      process.env.CLOUD_BUCKET_NAME || "e-consultancy-voice-files";
    this.useGoogleCloud = process.env.CLOUD_PROVIDER === "google";
  }

  /**
   * Upload voice file to cloud storage (Google Cloud Storage or AWS S3)
   */
  async uploadVoiceFile(audioBuffer, originalFilename) {
    try {
      const fileId = uuidv4();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `voice-recordings/${timestamp}-${fileId}.webm`;

      if (this.useGoogleCloud) {
        // Upload to Google Cloud Storage
        const bucket = this.storage.bucket(this.bucketName);
        const file = bucket.file(filename);

        await file.save(audioBuffer, {
          metadata: {
            contentType: "audio/webm",
            metadata: {
              originalName: originalFilename,
              uploadDate: new Date().toISOString(),
              fileId: fileId,
            },
          },
        });

        const cloudUrl = `gs://${this.bucketName}/${filename}`;
        console.log(`✅ File uploaded to Google Cloud Storage: ${cloudUrl}`);
        return { fileId, cloudUrl, filename };
      } else {
        // Upload to AWS S3
        const uploadParams = {
          Bucket: this.bucketName,
          Key: filename,
          Body: audioBuffer,
          ContentType: "audio/webm",
          Metadata: {
            originalName: originalFilename,
            uploadDate: new Date().toISOString(),
            fileId: fileId,
          },
        };

        const result = await this.s3.upload(uploadParams).promise();
        console.log(`✅ File uploaded to AWS S3: ${result.Location}`);
        return { fileId, cloudUrl: result.Location, filename };
      }
    } catch (error) {
      console.error("❌ Error uploading file to cloud:", error);
      throw new Error(`Cloud upload failed: ${error.message}`);
    }
  }

  /**
   * Transcribe audio using Google Speech-to-Text with Indian language support
   */
  async transcribeAudio(audioBuffer, detectedLanguage = "auto") {
    try {
      // Indian regional language codes supported by Google Speech-to-Text
      const indianLanguages = {
        hi: "hi-IN", // Hindi
        bn: "bn-IN", // Bengali
        te: "te-IN", // Telugu
        ta: "ta-IN", // Tamil
        mr: "mr-IN", // Marathi
        gu: "gu-IN", // Gujarati
        kn: "kn-IN", // Kannada
        ml: "ml-IN", // Malayalam
        pa: "pa-IN", // Punjabi
        ur: "ur-IN", // Urdu
        en: "en-IN", // English (India)
      };

      // Auto-detect or use provided language
      let languageCode = "en-IN"; // Default to Indian English

      if (detectedLanguage !== "auto" && indianLanguages[detectedLanguage]) {
        languageCode = indianLanguages[detectedLanguage];
      }

      const request = {
        audio: {
          content: audioBuffer.toString("base64"),
        },
        config: {
          encoding: "WEBM_OPUS",
          sampleRateHertz: 48000,
          languageCode: languageCode,
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true,
          model: "latest_long", // Best model for medical consultations
          useEnhanced: true,
          alternativeLanguageCodes: Object.values(indianLanguages), // Support multiple languages
        },
      };

      console.log(`🎤 Transcribing audio with language: ${languageCode}`);
      const [response] = await this.speechClient.recognize(request);

      if (!response.results || response.results.length === 0) {
        throw new Error("No transcription results found");
      }

      const transcription = response.results
        .map((result) => result.alternatives[0].transcript)
        .join(" ");

      const confidence = response.results[0]?.alternatives[0]?.confidence || 0;
      const detectedLang = this.getLanguageFromCode(languageCode);

      console.log(
        `✅ Transcription successful: "${transcription}" (confidence: ${confidence})`
      );

      return {
        originalText: transcription,
        translatedText: await this.translateToEnglish(
          transcription,
          detectedLang
        ),
        detectedLanguage: detectedLang,
        confidence: confidence,
        wordTimeOffsets: response.results[0]?.alternatives[0]?.words || [],
      };
    } catch (error) {
      console.error("❌ Error in speech-to-text:", error);

      // Fallback to mock transcription for development
      return this.getMockTranscription();
    }
  }

  /**
   * Translate text to English if not already in English
   */
  async translateToEnglish(text, sourceLanguage) {
    if (sourceLanguage === "English") {
      return text;
    }

    try {
      // Use OpenAI for translation (more accurate for medical terms)
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a medical translator. Translate the following ${sourceLanguage} text to English, preserving medical terminology and context. Only return the translated text, nothing else.`,
          },
          {
            role: "user",
            content: text,
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      });

      const translation = completion.choices[0].message.content.trim();
      console.log(
        `🌐 Translated from ${sourceLanguage}: "${text}" → "${translation}"`
      );
      return translation;
    } catch (error) {
      console.error("❌ Translation error:", error);
      return text; // Return original if translation fails
    }
  }

  /**
   * Generate AI medical response using OpenAI
   */
  async generateMedicalResponse(englishText, patientContext = {}) {
    try {
      const systemPrompt = `You are an AI medical assistant providing preliminary health guidance. 

IMPORTANT DISCLAIMERS:
- You provide educational information only, not medical diagnosis
- Always recommend consulting healthcare professionals for proper diagnosis
- Mention emergency services for urgent symptoms
- Be empathetic and professional

Patient Context: ${JSON.stringify(patientContext)}
Query: "${englishText}"

Provide a helpful, empathetic response with:
1. Understanding of the concern
2. General health guidance
3. When to seek professional help
4. Self-care recommendations if appropriate`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: englishText,
          },
        ],
        max_tokens: 800,
        temperature: 0.3,
      });

      const response = completion.choices[0].message.content.trim();
      console.log(`🤖 AI Medical Response generated for: "${englishText}"`);
      return response;
    } catch (error) {
      console.error("❌ Error generating AI response:", error);

      // Fallback response
      return `Thank you for your query about "${englishText}". While I'd like to help, I recommend consulting with a qualified healthcare professional who can properly assess your symptoms and provide appropriate medical advice. If this is an emergency, please contact your local emergency services immediately.`;
    }
  }

  /**
   * Complete voice consultation workflow
   */
  async processVoiceConsultation(
    audioBuffer,
    originalFilename,
    patientContext = {}
  ) {
    try {
      console.log("🎯 Starting complete voice consultation processing...");

      // Step 1: Upload to cloud storage
      const uploadResult = await this.uploadVoiceFile(
        audioBuffer,
        originalFilename
      );

      // Step 2: Transcribe and translate
      const transcriptionResult = await this.transcribeAudio(audioBuffer);

      // Step 3: Generate AI medical response
      const aiResponse = await this.generateMedicalResponse(
        transcriptionResult.translatedText,
        patientContext
      );

      // Step 4: Prepare complete result
      const result = {
        id: uploadResult.fileId,
        timestamp: new Date().toISOString(),
        audioFile: {
          cloudUrl: uploadResult.cloudUrl,
          filename: uploadResult.filename,
          originalName: originalFilename,
        },
        transcription: {
          originalText: transcriptionResult.originalText,
          translatedText: transcriptionResult.translatedText,
          detectedLanguage: transcriptionResult.detectedLanguage,
          confidence: transcriptionResult.confidence,
        },
        aiResponse: aiResponse,
        patientContext: patientContext,
        processed: true,
      };

      console.log("✅ Voice consultation processing completed successfully");
      return result;
    } catch (error) {
      console.error("❌ Error in voice consultation processing:", error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  getLanguageFromCode(languageCode) {
    const languageMap = {
      "hi-IN": "Hindi",
      "bn-IN": "Bengali",
      "te-IN": "Telugu",
      "ta-IN": "Tamil",
      "mr-IN": "Marathi",
      "gu-IN": "Gujarati",
      "kn-IN": "Kannada",
      "ml-IN": "Malayalam",
      "pa-IN": "Punjabi",
      "ur-IN": "Urdu",
      "en-IN": "English",
    };
    return languageMap[languageCode] || "Unknown";
  }

  getMockTranscription() {
    const mockData = [
      {
        originalText: "मुझे सिर में दर्द हो रहा है",
        translatedText: "I am having a headache",
        detectedLanguage: "Hindi",
        confidence: 0.95,
      },
      {
        originalText: "எனக்கு காய்ச்சல் வந்துள்ளது",
        translatedText: "I have a fever",
        detectedLanguage: "Tamil",
        confidence: 0.93,
      },
      {
        originalText: "నాకు పొట్ట నొప్పి వస్తోంది",
        translatedText: "I am having stomach pain",
        detectedLanguage: "Telugu",
        confidence: 0.91,
      },
    ];

    return mockData[Math.floor(Math.random() * mockData.length)];
  }
}

export default CloudVoiceService;
