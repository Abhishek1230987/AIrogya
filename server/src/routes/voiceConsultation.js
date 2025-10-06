import express from "express";
import multer from "multer";
import {
  transcribeAudio,
  getConsultationHistory,
  searchConsultations,
  getConsultationById,
} from "../controllers/voiceConsultation.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for audio file uploads with memory storage for cloud processing
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory for cloud upload
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for voice files
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files and webm (for browser recordings)
    if (file.mimetype.startsWith("audio/") || file.mimetype === "video/webm") {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"), false);
    }
  },
});

// @route   POST /api/voice/transcribe
// @desc    Upload voice, store in cloud, transcribe, and get AI response
// @access  Public (optional auth for better features)
router.post("/transcribe", upload.single("audio"), transcribeAudio);

// @route   GET /api/voice/history
// @desc    Get user's voice consultation history with pagination
// @access  Private
router.get("/history", authenticateToken, getConsultationHistory);

// @route   GET /api/voice/search
// @desc    Search consultations by text content
// @access  Private
router.get("/search", authenticateToken, searchConsultations);

// @route   GET /api/voice/:id
// @desc    Get specific consultation by ID
// @access  Private
router.get("/:id", authenticateToken, getConsultationById);

export default router;
