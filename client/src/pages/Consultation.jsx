import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import {
  MicrophoneIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  XMarkIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";

export default function Consultation() {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState("");
  const mediaRecorderRef = useRef(null);
  const [stream, setStream] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Request microphone access
  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      setStream(mediaStream);
      const mediaRecorder = new MediaRecorder(mediaStream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      addMessage(
        "system",
        "Unable to access microphone. Please check permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const processAudio = async (audioBlob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);

      const response = await fetch(
        "http://localhost:5000/api/voice/transcribe",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to process audio");
      }

      const data = await response.json();

      // Add user message (transcription)
      addMessage("user", data.transcription || "Voice message");

      // Add AI response
      setTimeout(() => {
        addMessage(
          "ai",
          data.medicalResponse ||
            "I'm processing your request. Please provide more details about your symptoms."
        );
      }, 500);
    } catch (error) {
      console.error("Error processing audio:", error);
      addMessage(
        "system",
        "Failed to process audio. Please try again or type your message."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const userMessage = textInput.trim();
    setTextInput("");
    addMessage("user", userMessage);

    setIsProcessing(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/consultation/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ message: userMessage }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      setTimeout(() => {
        addMessage(
          "ai",
          data.response ||
            "I understand your concern. Could you please provide more specific details about your symptoms?"
        );
      }, 500);
    } catch (error) {
      console.error("Error getting consultation:", error);
      setTimeout(() => {
        addMessage(
          "ai",
          "I'm here to help. Please describe your symptoms in detail, and I'll provide guidance."
        );
      }, 500);
    } finally {
      setIsProcessing(false);
    }
  };

  const addMessage = (type, content) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type,
        content,
        timestamp: new Date(),
      },
    ]);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 rounded-t-xl p-6 text-white shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
              <ChatBubbleLeftRightIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Medical Consultation</h1>
              <p className="text-blue-100 text-sm">
                Get instant medical guidance powered by AI
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearChat}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors flex items-center gap-2"
            >
              <XMarkIcon className="w-4 h-4" />
              Clear Chat
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Chat Messages */}
      <div className="flex-1 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-6 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-8 rounded-full mb-6">
                <PlusCircleIcon className="w-16 h-16 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to Medical Consultation
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
                Describe your symptoms or health concerns. You can type or use
                voice input.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
                {[
                  "I have a headache and fever",
                  "What are symptoms of flu?",
                  "I need health advice",
                ].map((suggestion, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setTextInput(suggestion)}
                    className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm hover:shadow-md"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex gap-3 ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.type === "ai" && (
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl px-6 py-4 shadow-md ${
                      message.type === "user"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                        : message.type === "ai"
                        ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                        : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p
                      className={`text-xs mt-2 ${
                        message.type === "user"
                          ? "text-blue-200"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {message.type === "user" && (
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 shadow-lg">
                        <UserCircleIcon className="w-8 h-8" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </AnimatePresence>

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 max-w-4xl mx-auto mt-4"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
            </div>
            <div className="bg-white rounded-2xl px-6 py-4 shadow-md border border-gray-200">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 rounded-b-xl shadow-lg"
      >
        <form onSubmit={handleTextSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`flex-shrink-0 p-4 rounded-full transition-all shadow-md ${
                isRecording
                  ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <MicrophoneIcon className="w-6 h-6" />
            </motion.button>

            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                isRecording
                  ? "Recording..."
                  : "Type your symptoms or health concerns..."
              }
              disabled={isRecording || isProcessing}
              className="flex-1 px-6 py-4 rounded-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />

            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!textInput.trim() || isProcessing || isRecording}
              className="flex-shrink-0 p-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="w-6 h-6" />
            </motion.button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
            💡 Click the microphone to speak or type your message. This is
            AI-powered guidance, not a replacement for professional medical
            advice.
          </p>
        </form>
      </motion.div>
    </div>
  );
}
