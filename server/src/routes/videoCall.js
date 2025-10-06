import express from "express";
import {
  getActiveRooms,
  getRoomDetails,
  disconnectUserFromRoom,
} from "../services/webrtcService.js";
import { authenticateToken as authMiddleware } from "../middleware/auth.js";

const router = express.Router();

/**
 * @route   GET /api/video/rooms
 * @desc    Get list of active video call rooms
 * @access  Private
 */
router.get("/rooms", authMiddleware, async (req, res) => {
  try {
    const rooms = getActiveRooms();
    res.json({
      success: true,
      rooms,
      count: rooms.length,
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rooms",
    });
  }
});

/**
 * @route   GET /api/video/rooms/:roomId
 * @desc    Get details of a specific room
 * @access  Private
 */
router.get("/rooms/:roomId", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = getRoomDetails(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    res.json({
      success: true,
      room,
    });
  } catch (error) {
    console.error("Error fetching room details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch room details",
    });
  }
});

/**
 * @route   POST /api/video/rooms/:roomId/kick/:userId
 * @desc    Kick a user from a video call room (admin/doctor only)
 * @access  Private
 */
router.post("/rooms/:roomId/kick/:userId", authMiddleware, async (req, res) => {
  try {
    const { roomId, userId } = req.params;

    // Check if requester is doctor or admin
    if (req.user.role !== "doctor" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only doctors and admins can kick users",
      });
    }

    const success = disconnectUserFromRoom(roomId, userId);

    if (success) {
      res.json({
        success: true,
        message: "User disconnected from room",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "User or room not found",
      });
    }
  } catch (error) {
    console.error("Error kicking user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to kick user",
    });
  }
});

/**
 * @route   POST /api/video/config
 * @desc    Get WebRTC configuration (STUN/TURN servers)
 * @access  Private
 */
router.get("/config", authMiddleware, (req, res) => {
  try {
    const iceServers = [
      {
        urls: [
          process.env.STUN_SERVER_URL || "stun:stun.l.google.com:19302",
          process.env.STUN_SERVER_URL_2 || "stun:stun1.l.google.com:19302",
        ],
      },
    ];

    // Add TURN server if configured
    if (
      process.env.TURN_SERVER_URL &&
      process.env.TURN_USERNAME &&
      process.env.TURN_PASSWORD
    ) {
      iceServers.push({
        urls: process.env.TURN_SERVER_URL,
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_PASSWORD,
      });
    }

    res.json({
      success: true,
      config: {
        iceServers,
        iceCandidatePoolSize: 10,
      },
    });
  } catch (error) {
    console.error("Error fetching WebRTC config:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch WebRTC configuration",
    });
  }
});

export default router;
