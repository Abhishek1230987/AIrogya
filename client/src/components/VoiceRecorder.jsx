import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MicrophoneIcon,
  StopIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  SpeakerWaveIcon,
} from "@heroicons/react/24/outline";

const VoiceRecorder = ({ onAudioRecorded, onTranscriptionReceived }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [error, setError] = useState("");
  const [recognizedText, setRecognizedText] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);

  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Already stopped
        }
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError("");
      setRecognizedText("");

      // Check for Web Speech API support
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setSpeechSupported(false);
        setError(
          "⚠️ Voice recognition not supported in this browser. Please use Chrome or Edge, or try the text input option below."
        );
        console.warn(
          "Web Speech API not supported. Use Chrome/Edge for voice features."
        );
      } else {
        // Initialize Speech Recognition
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        // Set default to English - user can speak any language
        // The AI will detect and respond in the language of the text
        recognition.lang = "en-US";
        recognition.maxAlternatives = 1;

        console.log("🎙️ Speech Recognition initialized (language: en-US)");

        // Capture speech as user speaks
        recognition.onresult = (event) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + " ";
            } else {
              interimTranscript += transcript;
            }
          }

          // Update recognized text in real-time
          setRecognizedText((prev) => prev + finalTranscript);
          console.log("🎙️ Recognized:", finalTranscript || interimTranscript);
        };

        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error, event);

          // Handle different error types
          if (event.error === "no-speech") {
            console.warn("⚠️ No speech detected, but recording continues");
            // Don't show error - user might still be thinking
          } else if (event.error === "network") {
            console.error("❌ Network error - Google Speech API unreachable");
            console.log("💡 This can happen due to:");
            console.log("   - Internet connection issues");
            console.log("   - Google Speech API quota limits");
            console.log("   - Browser security settings");
            console.log(
              "📝 Audio recording continues, but speech recognition unavailable"
            );
            setSpeechSupported(false);
            setError(
              "⚠️ Voice recognition temporarily unavailable. Audio is still recording - use text input after recording, or try again later."
            );
          } else if (
            event.error === "not-allowed" ||
            event.error === "service-not-allowed"
          ) {
            console.error("❌ Microphone permission denied");
            setError(
              "❌ Microphone access denied. Please allow microphone permissions and try again."
            );
            setSpeechSupported(false);
          } else if (event.error === "aborted") {
            console.log("ℹ️ Speech recognition aborted (normal on stop)");
            // Don't show error - this is expected when stopping
          } else {
            console.error("❌ Speech recognition error:", event.error);
            setError(
              `⚠️ Voice recognition error: ${event.error}. Try text input instead.`
            );
          }
        };

        recognition.onend = () => {
          console.log("📝 Speech recognition session ended");
          // Auto-restart if still recording (unless manually stopped)
          if (isRecording && recognitionRef.current) {
            try {
              console.log("🔄 Restarting speech recognition...");
              recognition.start();
            } catch (restartError) {
              console.warn(
                "⚠️ Could not restart recognition:",
                restartError.message
              );
            }
          }
        };

        // Start speech recognition
        try {
          recognition.start();
          recognitionRef.current = recognition;
          console.log("✅ Real-time speech recognition started");
        } catch (speechError) {
          console.error("Failed to start speech recognition:", speechError);
        }
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        // Stop speech recognition
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            console.log("Recognition already stopped");
          }
        }

        // Notify parent component
        if (onAudioRecorded) {
          onAudioRecorded(blob);
        }
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Failed to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setTranscription("");
    setRecognizedText("");
    setError("");

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const uploadAndTranscribe = async () => {
    if (!audioBlob && !recognizedText) return;

    setIsProcessing(true);
    setError("");

    try {
      // Check if we have real-time recognized text from Web Speech API
      if (recognizedText && recognizedText.trim().length > 0) {
        console.log("✅ Using real-time recognized text:", recognizedText);
        console.log("📤 Sending to AI for medical consultation...");

        // Send recognized text directly to text-consultation endpoint
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
              message: recognizedText.trim(),
              language: "en",
            }),
          }
        );

        console.log("📥 Response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error("❌ Server error:", errorData);
          throw new Error(
            errorData?.message || `Consultation failed: ${response.status}`
          );
        }

        const result = await response.json();
        console.log("✅ Server response:", result);

        if (!result.success) {
          throw new Error(
            result.message || "Failed to process voice consultation"
          );
        }

        setTranscription(recognizedText);

        if (onTranscriptionReceived) {
          onTranscriptionReceived(
            recognizedText,
            recognizedText,
            result.medicalResponse,
            "en"
          );
        }

        console.log("🎉 Real voice transcription successful!");
      } else {
        // Fallback: No recognized text available
        console.warn("⚠️ No speech recognized during recording");
        console.log("💡 Possible reasons:");
        console.log("   - Microphone not working or muted");
        console.log("   - Background noise too loud");
        console.log("   - Speech recognition network error");
        console.log("   - No speech detected by the API");
        console.log("📝 Suggestion: Use the text input option below instead");

        setError(
          "⚠️ No speech was recognized. Please try:\n" +
            "1. Use the text input field below to type your question, OR\n" +
            "2. Check your microphone settings and try recording again\n" +
            "3. Ensure you're using Chrome or Edge browser"
        );
      }
    } catch (err) {
      console.error("Transcription error:", err);
      setError(err.message || "Failed to transcribe audio. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Voice Medical Consultation
        </h3>
        <p className="text-sm text-gray-600">
          Record your medical query and get AI-powered responses
        </p>
        {!speechSupported && (
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <p className="font-semibold">⚠️ Voice recognition unavailable</p>
            <p className="text-xs mt-1">
              Please use Chrome/Edge browser or scroll down to use text input
            </p>
          </div>
        )}
      </div>

      {/* Recording Controls */}
      <div className="flex justify-center items-center space-x-4 mb-6">
        {!isRecording && !audioBlob && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startRecording}
            className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg transition-colors"
          >
            <MicrophoneIcon className="h-8 w-8" />
          </motion.button>
        )}

        {isRecording && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={stopRecording}
            className="bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-full shadow-lg transition-colors"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <StopIcon className="h-8 w-8" />
          </motion.button>
        )}

        {audioBlob && !isRecording && (
          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isPlaying ? pauseAudio : playAudio}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-colors"
            >
              {isPlaying ? (
                <PauseIcon className="h-6 w-6" />
              ) : (
                <PlayIcon className="h-6 w-6" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearRecording}
              className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-colors"
            >
              <TrashIcon className="h-6 w-6" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={uploadAndTranscribe}
              disabled={isProcessing}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white p-3 rounded-full shadow-lg transition-colors"
            >
              {isProcessing ? (
                <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <ArrowUpTrayIcon className="h-6 w-6" />
              )}
            </motion.button>
          </div>
        )}
      </div>

      {/* Recording Timer */}
      <AnimatePresence>
        {(isRecording || audioBlob) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center mb-4"
          >
            <div className="bg-gray-100 rounded-lg py-2 px-4 inline-block">
              <span className="text-lg font-mono text-gray-700">
                {formatTime(recordingTime)}
              </span>
              {isRecording && (
                <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Player */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {/* Real-time Speech Recognition Display */}
      <AnimatePresence>
        {recognizedText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4"
          >
            <h4 className="font-semibold text-green-800 mb-2 flex items-center">
              <SpeakerWaveIcon className="h-5 w-5 mr-2" />
              What you said:
            </h4>
            <p className="text-green-700 text-sm">"{recognizedText}"</p>
            <p className="text-xs text-green-600 mt-2">
              ✅ Real-time voice recognition active
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcription Result */}
      <AnimatePresence>
        {transcription && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <h4 className="font-semibold text-blue-800 mb-2">Transcription:</h4>
            <p className="text-blue-700 text-sm">{transcription}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording Status */}
      <div className="text-center text-sm text-gray-500 mt-4">
        {isRecording && speechSupported && (
          <span className="flex items-center justify-center">
            <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full mr-2" />
            Recording in progress... 🎙️ Speech recognition active
          </span>
        )}
        {isRecording && !speechSupported && (
          <span className="flex items-center justify-center">
            <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full mr-2" />
            Recording audio only (use text input for Chrome/Edge voice features)
          </span>
        )}
        {isProcessing && (
          <span>Processing your message and generating AI response...</span>
        )}
        {!isRecording && !audioBlob && !isProcessing && (
          <span>
            {speechSupported
              ? "Tap the microphone to start - your words will be recognized in real-time"
              : "Tap the microphone to start recording"}
          </span>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;
