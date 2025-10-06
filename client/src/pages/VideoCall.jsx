import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function VideoCall() {
  const { user, loading: authLoading } = useAuth();
  const [socket, setSocket] = useState(null);
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerName, setCallerName] = useState("");
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const connectionRef = useRef(null);

  // Show loading if auth is still loading or user is not available
  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!user) return;

    // Connect to socket server
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    // Get media stream
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error accessing media devices:", err);
        setError(
          "Unable to access camera/microphone. Please check permissions."
        );
        setLoading(false);
      });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.emit("join", {
      userId: user.id,
      name: user.name,
      role: user.role || "patient",
    });

    socket.on("userList", (users) => {
      setAvailableUsers(users.filter((u) => u.id !== user.id));
    });

    socket.on("callReceived", ({ from, signal }) => {
      setReceivingCall(true);
      setCaller(from);
      setCallerSignal(signal);
    });

    socket.on("callAccepted", ({ signal }) => {
      setCallAccepted(true);
      if (connectionRef.current) {
        connectionRef.current.peer.signal(signal);
      }
    });

    socket.on("callEnded", () => {
      setCallEnded(true);
      if (connectionRef.current) {
        connectionRef.current.peer.destroy();
      }
    });

    return () => {
      socket.off("userList");
      socket.off("callReceived");
      socket.off("callAccepted");
      socket.off("callEnded");
    };
  }, [socket, user]);

  const callUser = (userId) => {
    if (!stream) {
      setError("No media stream available");
      return;
    }

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: userId,
        signalData: data,
        from: user.id,
      });
    });

    peer.on("stream", (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    peer.on("error", (err) => {
      console.error("Peer connection error:", err);
      setError("Connection failed. Please try again.");
    });

    connectionRef.current = { peer, userId };
  };

  const answerCall = () => {
    if (!stream) {
      setError("No media stream available");
      return;
    }

    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("acceptCall", { signal: data, to: caller });
    });

    peer.on("stream", (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    peer.on("error", (err) => {
      console.error("Peer connection error:", err);
      setError("Connection failed. Please try again.");
    });

    peer.signal(callerSignal);
    connectionRef.current = { peer, userId: caller };
  };

  const leaveCall = () => {
    setCallEnded(true);
    if (connectionRef.current) {
      connectionRef.current.peer.destroy();
    }
    // Reset call state instead of reloading
    setReceivingCall(false);
    setCaller("");
    setCallerName("");
    setCallerSignal(null);
    setCallAccepted(false);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Video Consultation
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Connect with healthcare professionals through video call
        </p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {loading ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center py-12"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              Setting up video call...
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="p-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Your Video
                </h2>
                <div className="mt-2 relative w-full">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <video
                      playsInline
                      muted
                      ref={myVideo}
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="p-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Remote Video
                </h2>
                <div className="mt-2 relative w-full">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    {callAccepted && !callEnded ? (
                      <video
                        playsInline
                        ref={userVideo}
                        autoPlay
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-500 dark:text-gray-400">
                        No remote video
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white dark:bg-gray-800 shadow rounded-lg"
          >
            <div className="p-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Controls
              </h2>
              <div className="mt-4 flex flex-wrap gap-4">
                {receivingCall && !callAccepted ? (
                  <button
                    onClick={answerCall}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Answer Call from {callerName}
                  </button>
                ) : null}

                {callAccepted && !callEnded ? (
                  <button
                    onClick={leaveCall}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    End Call
                  </button>
                ) : null}
              </div>
            </div>

            {!callAccepted && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Available Users
                </h3>
                <div className="mt-4 space-y-2">
                  {availableUsers.map((user) => (
                    <button
                      key={user.userId}
                      onClick={() => callUser(user.userId)}
                      className="w-full text-left px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition transform hover:-translate-y-0.5 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {user.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
