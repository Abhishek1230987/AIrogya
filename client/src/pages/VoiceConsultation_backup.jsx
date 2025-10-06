import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import VoiceRecorder from "../components/VoiceRecorder";
import {
  ChatBubbleLeftIcon,
  SpeakerWaveIcon,
  DocumentTextIcon,
  ClockIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";

export default function VoiceConsultation() {
  const { user } = useAuth();
  const [consultationHistory, setConsultationHistory] = useState([]);
  const [currentConsultation, setCurrentConsultation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isSubmittingText, setIsSubmittingText] = useState(false);

  // Load consultation history on component mount
  useEffect(() => {
    const loadConsultationHistory = async () => {
      if (!user) return;

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          "http://localhost:5000/api/voice/history",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setConsultationHistory(data.consultations);
          }
        } else {
          console.error("Failed to load consultation history");
        }
      } catch (error) {
        console.error("Error loading consultation history:", error);
      }
    };

    loadConsultationHistory();
  }, [user]);

  const handleAudioRecorded = (audioBlob) => {
    console.log("Audio recorded:", audioBlob);
    // Audio blob is ready for upload
  };

  const handleTranscriptionReceived = (
    originalMessage,
    transcription,
    medicalResponse,
    detectedLanguage = "en"
  ) => {
    const consultation = {
      id: Date.now(),
      timestamp: new Date(),
      originalMessage: originalMessage || transcription, // Original voice message
      transcription: transcription, // English translation/transcription
      response: medicalResponse,
      detectedLanguage: detectedLanguage,
      audioUrl: null, // Will be populated when we implement playback
    };

    setConsultationHistory((prev) => [consultation, ...prev]);
    setCurrentConsultation(consultation);
  };

  // Handle text input submission
  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textInput.trim() || isSubmittingText) return;

    setIsSubmittingText(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/voice/text-consultation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: textInput.trim(),
            language: "en",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          handleTranscriptionReceived(
            textInput.trim(),
            textInput.trim(),
            data.medicalResponse,
            "en"
          );
          setTextInput(""); // Clear input after successful submission
        }
      } else {
        console.error("Text consultation failed");
      }
    } catch (error) {
      console.error("Error submitting text consultation:", error);
    } finally {
      setIsSubmittingText(false);
    }
  };

  const speakResponse = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Use a medical/professional voice if available
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (voice) =>
          voice.name.includes("Google") || voice.name.includes("Microsoft")
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      speechSynthesis.speak(utterance);
    }
  };

  const formatTime = (date) => {
    try {
      // Convert to Date object if it's a string or number
      const dateObj = date instanceof Date ? date : new Date(date);

      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return "Invalid date";
      }

      return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(dateObj);
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid date";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🎤 Voice Medical Consultation
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Speak your medical concerns and get instant AI-powered responses in
            multiple languages
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Voice Recorder Section */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <VoiceRecorder
                onAudioRecorded={handleAudioRecorded}
                onTranscriptionReceived={handleTranscriptionReceived}
              />
            </motion.div>

            {/* Text Input Alternative */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg shadow-md p-4 border border-purple-200 dark:border-purple-800"
            >
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                <ChatBubbleLeftIcon className="h-5 w-5 mr-2 text-purple-500 dark:text-purple-400" />
                Or Type Your Question
              </h3>
              <form onSubmit={handleTextSubmit} className="space-y-3">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Describe your symptoms or ask a medical question..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none"
                  rows={3}
                  disabled={isSubmittingText}
                />
                <button
                  type="submit"
                  disabled={!textInput.trim() || isSubmittingText}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg"
                >
                  {isSubmittingText ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-5 w-5" />
                      Send Question
                    </>
                  )}
                </button>
              </form>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                ✨ Get instant AI-powered medical advice based on your symptoms
              </p>
            </motion.div>

            {/* Quick Tips */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
            >
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                Quick Tips
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>• Speak clearly and at normal pace</li>
                <li>• Mention symptoms, duration, and severity</li>
                <li>• Include any relevant medical history</li>
                <li>• Works with multiple languages</li>
              </ul>
            </motion.div>
          </div>

          {/* Current Consultation Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6"
            >
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
                <ChatBubbleLeftIcon className="h-6 w-6 mr-2 text-green-500 dark:text-green-400" />
                Current Consultation
              </h2>

              <AnimatePresence mode="wait">
                {currentConsultation ? (
                  <motion.div
                    key="consultation"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Original Message and Translation Side by Side */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Original Voice Message */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                          🎤 Your Voice Message
                          {currentConsultation.detectedLanguage !== "en" && (
                            <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                              {currentConsultation.detectedLanguage?.toUpperCase()}
                            </span>
                          )}
                        </h3>
                        <p className="text-blue-700 dark:text-blue-200 leading-relaxed">
                          {currentConsultation.originalMessage}
                        </p>
                      </div>

                      {/* English Translation */}
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2 flex items-center">
                          🌍 English Translation
                          <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded">
                            EN
                          </span>
                        </h3>
                        <p className="text-purple-700 dark:text-purple-200 leading-relaxed">
                          {currentConsultation.transcription}
                        </p>
                      </div>
                    </div>

                    {/* AI Medical Response */}
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                      <h3 className="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center">
                        🤖 AI Medical Response
                      </h3>
                      <p className="text-green-800 dark:text-green-200 leading-relaxed mb-4">
                        {currentConsultation.response}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            speakResponse(currentConsultation.response)
                          }
                          className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                          <SpeakerWaveIcon className="h-4 w-4 mr-2" />
                          Listen to Response
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            speakResponse(currentConsultation.originalMessage)
                          }
                          className="flex items-center px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                        >
                          <SpeakerWaveIcon className="h-4 w-4 mr-2" />
                          Replay Original
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            navigator.clipboard.writeText(
                              `Original: ${currentConsultation.originalMessage}\n\nTranslation: ${currentConsultation.transcription}\n\nResponse: ${currentConsultation.response}`
                            )
                          }
                          className="flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                          <DocumentTextIcon className="h-4 w-4 mr-2" />
                          Copy All
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12 text-gray-500 dark:text-gray-400"
                  >
                    <ChatBubbleLeftIcon className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-lg">
                      Record your medical question to see AI response here
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Consultation History */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <ClockIcon className="h-6 w-6 mr-2 text-purple-500 dark:text-purple-400" />
                Consultation History
              </h2>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {consultationHistory.length > 0 ? (
                    consultationHistory.map((consultation, index) => (
                      <motion.div
                        key={consultation.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {formatTime(consultation.timestamp)}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {/* Original Message */}
                          <div>
                            <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-1 flex items-center">
                              🎤 Original Message
                              {consultation.detectedLanguage !== "en" && (
                                <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                                  {consultation.detectedLanguage?.toUpperCase()}
                                </span>
                              )}
                            </h4>
                            <p className="text-sm text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                              {consultation.originalMessage}
                            </p>
                          </div>

                          {/* English Translation */}
                          <div>
                            <h4 className="font-medium text-purple-700 dark:text-purple-400 mb-1 flex items-center">
                              🌍 English Translation
                            </h4>
                            <p className="text-sm text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 rounded p-2">
                              {consultation.transcription}
                            </p>
                          </div>

                          {/* AI Response */}
                          <div>
                            <h4 className="font-medium text-green-700 dark:text-green-400 mb-1 flex items-center">
                              🤖 AI Response
                            </h4>
                            <p className="text-sm text-green-600 dark:text-green-300 bg-green-50 dark:bg-green-900/20 rounded p-2">
                              {consultation.response}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() =>
                                speakResponse(consultation.response)
                              }
                              className="text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 flex items-center"
                            >
                              <SpeakerWaveIcon className="h-3 w-3 mr-1" />
                              Listen Response
                            </button>
                            <button
                              onClick={() =>
                                speakResponse(consultation.originalMessage)
                              }
                              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
                            >
                              <SpeakerWaveIcon className="h-3 w-3 mr-1" />
                              Play Original
                            </button>
                            <button
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  `Original: ${consultation.originalMessage}\nTranslation: ${consultation.transcription}\nResponse: ${consultation.response}`
                                )
                              }
                              className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 flex items-center"
                            >
                              <DocumentTextIcon className="h-3 w-3 mr-1" />
                              Copy
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 text-gray-500"
                    >
                      <ClockIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No consultation history yet</p>
                      <p className="text-sm">
                        Start by recording your first medical question
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <p className="text-yellow-800 text-sm">
            <strong>Medical Disclaimer:</strong> This AI consultation tool is
            for informational purposes only and should not replace professional
            medical advice. Always consult with qualified healthcare providers
            for proper diagnosis and treatment.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
