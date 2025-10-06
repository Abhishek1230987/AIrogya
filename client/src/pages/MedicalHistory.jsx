import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  UserIcon,
  HeartIcon,
  PlusIcon,
  XMarkIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BeakerIcon,
  FireIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import AnimatedButton from "../components/AnimatedButton";

export default function MedicalHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  // Define steps for the wizard
  const steps = [
    {
      id: 0,
      title: "Personal Info",
      icon: UserIcon,
      description: "Basic information about you",
    },
    {
      id: 1,
      title: "Medical Conditions",
      icon: HeartIcon,
      description: "Health conditions and medications",
    },
    {
      id: 2,
      title: "Lifestyle",
      icon: FireIcon,
      description: "Daily habits and activities",
    },
    {
      id: 3,
      title: "Emergency Contact",
      icon: PhoneIcon,
      description: "Someone we can reach out to",
    },
  ];

  // Medical History State
  const [medicalHistory, setMedicalHistory] = useState({
    // Personal Information
    dateOfBirth: "",
    gender: "",
    bloodType: "",
    height: "",
    weight: "",

    // Medical Conditions
    chronicConditions: [],
    currentMedications: [],
    allergies: [],
    surgeries: [],

    // Family History
    familyHistory: [],

    // Lifestyle
    smoking: "",
    alcohol: "",
    exercise: "",

    // Emergency Contact
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
    },

    // Additional Notes
    additionalNotes: "",
  });

  // Load existing medical history on component mount
  useEffect(() => {
    const loadMedicalHistory = async () => {
      if (!user) return;

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          "http://localhost:5000/api/medical/history",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.history) {
            const serverHistory = data.history;

            const formatDateForInput = (dateString) => {
              if (!dateString) return "";
              const date = new Date(dateString);
              if (isNaN(date.getTime())) return "";
              return date.toISOString().split("T")[0];
            };

            setMedicalHistory({
              dateOfBirth:
                formatDateForInput(serverHistory.patient?.dateOfBirth) || "",
              gender: serverHistory.patient?.gender || "",
              bloodType: serverHistory.patient?.bloodType || "",
              height: serverHistory.patient?.height?.toString() || "",
              weight: serverHistory.patient?.weight?.toString() || "",
              chronicConditions:
                serverHistory.conditions?.map((c) =>
                  typeof c === "string" ? c : c.condition
                ) || [],
              currentMedications:
                serverHistory.medications?.map((m) =>
                  typeof m === "string" ? m : `${m.name} - ${m.dosage}`
                ) || [],
              allergies: serverHistory.allergies || [],
              surgeries: serverHistory.surgeries || [],
              familyHistory: serverHistory.familyHistory || [],
              smoking:
                serverHistory.lifestyle?.smoking ||
                serverHistory.patient?.smoking ||
                "",
              alcohol:
                serverHistory.lifestyle?.alcohol ||
                serverHistory.patient?.alcohol ||
                "",
              exercise:
                serverHistory.lifestyle?.exercise ||
                serverHistory.patient?.exercise ||
                "",
              emergencyContact: serverHistory.emergencyContact || {
                name: "",
                relationship: "",
                phone: "",
              },
              additionalNotes:
                serverHistory.additionalNotes || serverHistory.notes || "",
            });
          }
        }
      } catch (error) {
        console.error("Error loading medical history:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadMedicalHistory();
  }, [user]);

  // Helper functions
  const addItem = (field) => {
    setMedicalHistory((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeItem = (field, index) => {
    setMedicalHistory((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const updateItem = (field, index, value) => {
    setMedicalHistory((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const updateField = (field, value) => {
    setMedicalHistory((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateNestedField = (parentField, childField, value) => {
    setMedicalHistory((prev) => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value,
      },
    }));
  };

  // Step navigation
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex) => {
    setCurrentStep(stepIndex);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const requestBody = {
        patient: {
          dateOfBirth: medicalHistory.dateOfBirth,
          gender: medicalHistory.gender,
          bloodType: medicalHistory.bloodType,
          height: medicalHistory.height,
          weight: medicalHistory.weight,
        },
        allergies: medicalHistory.allergies,
        medications: medicalHistory.currentMedications,
        conditions: medicalHistory.chronicConditions,
        emergencyContact: medicalHistory.emergencyContact,
      };

      const response = await fetch(
        "http://localhost:5000/api/medical/history",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save medical history");
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Medical history submission error:", err);
      setError("Failed to save medical history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Render dynamic list field
  const renderDynamicList = (field, label, placeholder) => (
    <div>
      <div className="flex justify-between items-center mb-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <motion.button
          type="button"
          onClick={() => addItem(field)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center px-3 py-1.5 text-sm text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:shadow-lg transition-all"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add
        </motion.button>
      </div>
      <div className="space-y-3">
        {medicalHistory[field].length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No {label.toLowerCase()} added yet. Click "Add" to include one.
          </p>
        ) : (
          medicalHistory[field].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={item}
                onChange={(e) => updateItem(field, index, e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all"
              />
              <motion.button
                type="button"
                onClick={() => removeItem(field, index)}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="p-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </motion.button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="flex justify-center mb-4"
          >
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
              <HeartIcon className="h-10 w-10 text-white" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
          >
            {initialLoading
              ? "Loading Your Medical History..."
              : "Complete Your Medical History"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            {initialLoading
              ? "Please wait while we load your existing information..."
              : "Help us provide better healthcare by sharing your medical information"}
          </motion.p>
        </div>

        {/* Progress Steps */}
        {!initialLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <motion.button
                      onClick={() => goToStep(index)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative flex flex-col items-center group cursor-pointer ${
                        index === 0 ? "" : "flex-1"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isCompleted
                            ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/50"
                            : isCurrent
                            ? "bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/50 ring-4 ring-blue-200 dark:ring-blue-900/50"
                            : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircleIcon className="h-6 w-6 text-white" />
                        ) : (
                          <Icon
                            className={`h-6 w-6 ${
                              isCurrent
                                ? "text-white"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          />
                        )}
                      </div>
                      <div className="mt-2 text-center hidden sm:block">
                        <p
                          className={`text-sm font-medium ${
                            isCurrent
                              ? "text-blue-600 dark:text-blue-400"
                              : isCompleted
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {step.title}
                        </p>
                      </div>
                    </motion.button>

                    {index < steps.length - 1 && (
                      <div className="flex-1 h-1 mx-2 relative">
                        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{
                            width: index < currentStep ? "100%" : "0%",
                          }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="mt-6 max-w-3xl mx-auto">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${((currentStep + 1) / steps.length) * 100}%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-lg"
                />
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Step {currentStep + 1} of {steps.length}
                </span>
                <span>
                  {Math.round(((currentStep + 1) / steps.length) * 100)}%
                  Complete
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {initialLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-2xl rounded-2xl p-8"
          >
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Loading your medical history...
              </p>
            </div>
          </motion.div>
        ) : (
          /* Form */
          <motion.form
            onSubmit={handleSubmit}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-2xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50"
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6"
              >
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </p>
              </motion.div>
            )}

            {/* Step Header */}
            <motion.div
              key={`header-${currentStep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {steps[currentStep].title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {steps[currentStep].description}
              </p>
            </motion.div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="min-h-[450px]"
              >
                {/* Step 0: Personal Information */}
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Date of Birth *
                        </label>
                        <input
                          type="date"
                          value={medicalHistory.dateOfBirth}
                          onChange={(e) =>
                            updateField("dateOfBirth", e.target.value)
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 [color-scheme:light] dark:[color-scheme:dark] transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Gender *
                        </label>
                        <select
                          value={medicalHistory.gender}
                          onChange={(e) =>
                            updateField("gender", e.target.value)
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                          required
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer-not-to-say">
                            Prefer not to say
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Blood Type
                        </label>
                        <select
                          value={medicalHistory.bloodType}
                          onChange={(e) =>
                            updateField("bloodType", e.target.value)
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                        >
                          <option value="">Select Blood Type</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="unknown">Unknown</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Height (cm)
                        </label>
                        <input
                          type="number"
                          value={medicalHistory.height}
                          onChange={(e) =>
                            updateField("height", e.target.value)
                          }
                          placeholder="170"
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          value={medicalHistory.weight}
                          onChange={(e) =>
                            updateField("weight", e.target.value)
                          }
                          placeholder="70"
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1: Medical Conditions */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    {renderDynamicList(
                      "chronicConditions",
                      "Chronic Conditions",
                      "e.g., Diabetes, Hypertension"
                    )}
                    {renderDynamicList(
                      "currentMedications",
                      "Current Medications",
                      "e.g., Metformin 500mg twice daily"
                    )}
                    {renderDynamicList(
                      "allergies",
                      "Allergies",
                      "e.g., Penicillin, Peanuts"
                    )}
                    {renderDynamicList(
                      "surgeries",
                      "Past Surgeries",
                      "e.g., Appendectomy - 2015"
                    )}
                  </div>
                )}

                {/* Step 2: Lifestyle */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Smoking
                        </label>
                        <select
                          value={medicalHistory.smoking}
                          onChange={(e) =>
                            updateField("smoking", e.target.value)
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                        >
                          <option value="">Select</option>
                          <option value="never">Never</option>
                          <option value="former">Former Smoker</option>
                          <option value="occasional">Occasionally</option>
                          <option value="regular">Regularly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Alcohol
                        </label>
                        <select
                          value={medicalHistory.alcohol}
                          onChange={(e) =>
                            updateField("alcohol", e.target.value)
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                        >
                          <option value="">Select</option>
                          <option value="never">Never</option>
                          <option value="occasionally">Occasionally</option>
                          <option value="regularly">Regularly</option>
                          <option value="daily">Daily</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Exercise
                        </label>
                        <select
                          value={medicalHistory.exercise}
                          onChange={(e) =>
                            updateField("exercise", e.target.value)
                          }
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                        >
                          <option value="">Select</option>
                          <option value="none">None</option>
                          <option value="light">Light (1-2 times/week)</option>
                          <option value="moderate">
                            Moderate (3-4 times/week)
                          </option>
                          <option value="intensive">
                            Intensive (5+ times/week)
                          </option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Additional Notes
                      </label>
                      <textarea
                        value={medicalHistory.additionalNotes}
                        onChange={(e) =>
                          updateField("additionalNotes", e.target.value)
                        }
                        rows={6}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all"
                        placeholder="Any additional medical information, symptoms, or concerns you'd like to share..."
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Emergency Contact */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                      <p className="text-blue-800 dark:text-blue-200 text-sm">
                        💡 Please provide an emergency contact who we can reach
                        in case of urgent medical situations.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Contact Name *
                        </label>
                        <input
                          type="text"
                          value={medicalHistory.emergencyContact.name}
                          onChange={(e) =>
                            updateNestedField(
                              "emergencyContact",
                              "name",
                              e.target.value
                            )
                          }
                          placeholder="John Doe"
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Relationship *
                        </label>
                        <input
                          type="text"
                          value={medicalHistory.emergencyContact.relationship}
                          onChange={(e) =>
                            updateNestedField(
                              "emergencyContact",
                              "relationship",
                              e.target.value
                            )
                          }
                          placeholder="Spouse, Parent, Sibling, etc."
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          value={medicalHistory.emergencyContact.phone}
                          onChange={(e) =>
                            updateNestedField(
                              "emergencyContact",
                              "phone",
                              e.target.value
                            )
                          }
                          placeholder="+1 (555) 123-4567"
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all"
                          required
                        />
                      </div>
                    </div>

                    {/* Review Summary */}
                    <div className="mt-8 p-6 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 border border-green-200 dark:border-green-800 rounded-xl">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        📋 Review Your Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Personal Info:</span>{" "}
                          {medicalHistory.gender || "Not specified"},{" "}
                          {medicalHistory.bloodType ||
                            "Blood type not specified"}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Conditions:</span>{" "}
                          {medicalHistory.chronicConditions.length} recorded
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Medications:</span>{" "}
                          {medicalHistory.currentMedications.length} recorded
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="font-medium">
                            Emergency Contact:
                          </span>{" "}
                          {medicalHistory.emergencyContact.name ||
                            "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t dark:border-gray-700">
              <div>
                {currentStep > 0 && (
                  <motion.button
                    type="button"
                    onClick={prevStep}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all"
                  >
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Previous
                  </motion.button>
                )}
              </div>

              <div className="flex gap-3">
                <motion.button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Skip for Now
                </motion.button>

                {currentStep < steps.length - 1 ? (
                  <motion.button
                    type="button"
                    onClick={nextStep}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center px-8 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    Next
                    <ArrowRightIcon className="h-5 w-5 ml-2" />
                  </motion.button>
                ) : (
                  <AnimatedButton
                    type="submit"
                    disabled={loading}
                    className="px-8 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 transition-all"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin h-5 w-5 mr-2"
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
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Save & Complete
                      </span>
                    )}
                  </AnimatedButton>
                )}
              </div>
            </div>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
}
