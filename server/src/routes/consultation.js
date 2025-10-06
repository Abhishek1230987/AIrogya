import express from "express";
import multer from "multer";
import { auth } from "../middleware/auth.js";
import {
  getMedicalHistory,
  createMedicalHistory,
  processAudioConsultation,
} from "../controllers/consultation.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Protected routes - require authentication
router.use(auth);

// Medical history routes
router.get("/medical-history", getMedicalHistory);
router.post("/medical-history", createMedicalHistory);

// Audio consultation route
router.post("/process-audio", upload.single("audio"), processAudioConsultation);

export default router;
