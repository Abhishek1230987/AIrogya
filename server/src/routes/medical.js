import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { auth } from "../middleware/auth.js";
import { medicalReportsDb } from "../helpers/userDatabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "file-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images and documents are allowed"));
    }
  },
});

// Protected routes - require authentication
router.use(auth);

// Test endpoint
router.get("/test", (req, res) => {
  res.json({ message: "Medical routes working", user: req.user });
});

// Debug endpoint - get raw reports from database
router.get("/debug/reports", async (req, res) => {
  try {
    const userId = req.user.id;
    const reports = await medicalReportsDb.getByUserId(userId);
    res.json({
      userId,
      totalReports: reports.length,
      rawReports: reports,
      firstReportKeys: reports[0] ? Object.keys(reports[0]) : [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all medical reports for the authenticated user
router.get("/reports", async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("📋 Fetching reports for user:", userId);

    const reports = await medicalReportsDb.getByUserId(userId);
    console.log("📋 Raw reports from DB:", reports);
    console.log("📋 First report ID:", reports[0]?.id);

    const mappedReports = reports.map((report) => ({
      _id: report.id,
      fileName: report.original_name || report.file_name,
      filePath: report.file_path,
      fileSize: report.file_size,
      uploadDate: report.uploaded_at,
      documentType: report.document_type,
      analyzed: !!report.extracted_info,
    }));

    console.log("📋 Mapped reports:", mappedReports);
    console.log("📋 First mapped report _id:", mappedReports[0]?._id);

    res.json({
      success: true,
      reports: mappedReports,
    });
  } catch (error) {
    console.error("Error fetching medical reports:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching medical reports",
    });
  }
});

// Upload a new medical report
router.post("/upload-report", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const userId = req.user.id;
    const { documentType } = req.body;

    const reportData = {
      userId,
      documentType: documentType || "general",
      fileName: req.file.originalname,
      filePath: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      extractedData: null,
    };

    const savedReport = await medicalReportsDb.create(reportData);

    res.json({
      success: true,
      message: "File uploaded successfully",
      report: {
        _id: savedReport.id,
        fileName: savedReport.original_name,
        filePath: savedReport.file_path,
        fileSize: savedReport.file_size,
        uploadDate: savedReport.uploaded_at,
        documentType: savedReport.document_type,
      },
    });
  } catch (error) {
    console.error("Error uploading medical report:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading file",
    });
  }
});

// Delete a medical report
router.delete("/reports/:id", async (req, res) => {
  try {
    console.log("🗑️ DELETE request received");
    console.log("🗑️ Headers:", req.headers);
    console.log("🗑️ User from auth:", req.user);
    console.log("🗑️ Report ID:", req.params.id);

    if (!req.user || !req.user.id) {
      console.log("❌ No user in request");
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId = req.user.id;
    const reportId = req.params.id;

    console.log("🗑️ Delete request received:", { userId, reportId });

    const deletedReport = await medicalReportsDb.delete(reportId, userId);

    console.log("🗑️ Delete result:", deletedReport);

    if (!deletedReport) {
      console.log("❌ Report not found or permission denied");
      return res.status(404).json({
        success: false,
        message: "Report not found or you don't have permission to delete it",
      });
    }

    // Delete the physical file
    const filePath = path.join(
      __dirname,
      "../../uploads",
      deletedReport.file_path
    );
    console.log("🗑️ Attempting to delete file:", filePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("✅ Physical file deleted");
    } else {
      console.log("⚠️ Physical file not found:", filePath);
    }

    console.log("✅ Sending success response");
    return res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting medical report:", error);
    console.error("❌ Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Error deleting report",
      error: error.message,
    });
  }
});

export default router;
