import { Server } from "socket.io";

export const setupVideoCallService = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  const users = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // User joins with their details
    socket.on("join", ({ userId, name, role }) => {
      users.set(userId, { id: userId, socketId: socket.id, name, role });
      io.emit("userList", Array.from(users.values()));
    });

    // Handle call initiation
    socket.on("callUser", ({ userToCall, signalData, from }) => {
      const user = Array.from(users.values()).find((u) => u.id === userToCall);
      if (user) {
        io.to(user.socketId).emit("callReceived", { signal: signalData, from });
      }
    });

    // Handle accepting calls
    socket.on("acceptCall", ({ to, signal }) => {
      const user = Array.from(users.values()).find((u) => u.id === to);
      if (user) {
        io.to(user.socketId).emit("callAccepted", { signal });
      }
    });

    // Handle call end
    socket.on("endCall", ({ to }) => {
      const user = Array.from(users.values()).find((u) => u.id === to);
      if (user) {
        io.to(user.socketId).emit("callEnded");
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      const userId = Array.from(users.entries()).find(
        ([_, user]) => user.socketId === socket.id
      )?.[0];
      if (userId) {
        users.delete(userId);
        io.emit("userList", Array.from(users.values()));
      }
      console.log("User disconnected:", socket.id);
    });
  });
};
