import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import VoiceRecorder from "../components/VoiceRecorder";
import {
  ChatBubbleLeftRightIcon,
  MicrophoneIcon,
  DocumentTextIcon,
  ClockIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon,
  BeakerIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";

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
      originalMessage: originalMessage || transcription,
      transcription: transcription,
      response: medicalResponse,
      detectedLanguage: detectedLanguage,
      audioUrl: null,
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
          setTextInput("");
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

  const formatTime = (date) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) {
        return "Invalid date";
      }
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
      {/* Professional Header with Medical Theme */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <MicrophoneIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  AI Medical Consultation
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center mt-1">
                  <ShieldCheckIcon className="h-4 w-4 mr-1 text-green-500" />
                  Powered by Advanced AI • HIPAA Compliant
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold">
                  <BeakerIcon className="h-5 w-5 mr-1" />
                  <span className="text-lg">{consultationHistory.length}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Consultations
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center text-green-600 dark:text-green-400 font-semibold">
                  <HeartIcon className="h-5 w-5 mr-1" />
                  <span className="text-lg">Active</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Status
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Input Section */}
          <div className="lg:col-span-4 space-y-6">
            {/* Voice Recorder Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <MicrophoneIcon className="h-5 w-5 mr-2" />
                  Voice Recording
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  Speak your symptoms clearly
                </p>
              </div>
              <div className="p-6">
                <VoiceRecorder
                  onAudioRecorded={handleAudioRecorded}
                  onTranscriptionReceived={handleTranscriptionReceived}
                />
              </div>
            </motion.div>

            {/* Text Input Alternative */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                  Type Your Question
                </h2>
                <p className="text-purple-100 text-sm mt-1">
                  Prefer typing? Write here
                </p>
              </div>
              <div className="p-6">
                <form onSubmit={handleTextSubmit} className="space-y-4">
                  <div className="relative">
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Example: I have been experiencing headaches and dizziness for the past 3 days..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900 dark:text-white bg-white dark:bg-gray-900 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      rows={4}
                      disabled={isSubmittingText}
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400 dark:text-gray-500">
                      {textInput.length}/500
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!textInput.trim() || isSubmittingText}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg"
                  >
                    {isSubmittingText ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          viewBox="0 0 24 24"
                        >
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
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-5 w-5" />
                        Get AI Analysis
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>

            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                How It Works
              </h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold mr-2 mt-0.5">
                    1
                  </span>
                  <span>Record voice or type your symptoms</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold mr-2 mt-0.5">
                    2
                  </span>
                  <span>AI analyzes with your medical history</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold mr-2 mt-0.5">
                    3
                  </span>
                  <span>Get personalized health recommendations</span>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            {/* Current Consultation Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  AI Analysis Result
                </h2>
                <p className="text-green-100 text-sm mt-1">
                  Personalized medical guidance
                </p>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {currentConsultation ? (
                    <motion.div
                      key={currentConsultation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      {/* Your Query */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                            <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                            Your Question
                          </h3>
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-medium">
                            {formatTime(currentConsultation.timestamp)}
                          </span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                          "{currentConsultation.transcription}"
                        </p>
                      </div>

                      {/* AI Response */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center text-lg">
                            <BeakerIcon className="h-6 w-6 mr-2 text-green-600 dark:text-green-400" />
                            Medical Analysis
                          </h3>
                          <div className="flex items-center bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-semibold">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            AI Verified
                          </div>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                            {currentConsultation.response}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-16"
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ChatBubbleLeftRightIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Ready to Assist You
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        Record your voice or type your medical concerns to
                        receive personalized AI-powered health guidance
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Consultation History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              <div className="bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-800 dark:to-black px-6 py-4">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Previous Consultations
                </h2>
                <p className="text-gray-300 dark:text-gray-400 text-sm mt-1">
                  Your consultation history
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {consultationHistory.length > 0 ? (
                      consultationHistory.map((consultation, index) => (
                        <motion.div
                          key={consultation.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className="group relative bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer"
                          onClick={() => setCurrentConsultation(consultation)}
                        >
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs bg-blue-500 dark:bg-blue-600 text-white px-2 py-1 rounded-full">
                              View Details
                            </span>
                          </div>

                          <div className="flex items-start justify-between mb-3">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              {formatTime(consultation.timestamp)}
                            </span>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                Question
                              </h4>
                              <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                                {consultation.transcription}
                              </p>
                            </div>

                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                AI Response
                              </h4>
                              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                {consultation.response}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500 dark:text-green-400" />
                              Analysis Complete
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                      >
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                          <ClockIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 font-medium">
                          No consultations yet
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Your consultation history will appear here
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Professional Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 dark:border-amber-600 rounded-lg p-6"
        >
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                Medical Disclaimer
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                This AI consultation tool is designed for informational and
                educational purposes only. It should not be used as a substitute
                for professional medical advice, diagnosis, or treatment. Always
                seek the guidance of qualified healthcare providers with any
                questions regarding medical conditions. In case of emergency,
                contact emergency services immediately.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
