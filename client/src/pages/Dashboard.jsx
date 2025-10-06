import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  HeartIcon,
  DocumentTextIcon,
  PlusIcon,
  CalendarIcon,
  UserIcon,
  ChartBarIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";
import AnimatedButton from "../components/AnimatedButton";

export default function Dashboard() {
  const { user } = useAuth();
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [medicalReports, setMedicalReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReports: 0,
    completedHistory: false,
    lastUpload: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Fetch medical history
        const historyResponse = await fetch(
          "http://localhost:5000/api/medical/history",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          if (historyData.success && historyData.history) {
            setMedicalHistory(historyData.history);
          }
        }

        // Fetch medical reports
        const reportsResponse = await fetch(
          "http://localhost:5000/api/medical/reports",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          const reports = reportsData.success ? reportsData.reports : [];
          setMedicalReports(reports);

          // Update stats
          setStats({
            totalReports: reports.length,
            completedHistory: !!medicalHistory,
            lastUpload:
              reports.length > 0
                ? reports[reports.length - 1].uploadedAt
                : null,
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array - only fetch once on mount

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
              >
                <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your medical information and consultations
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HeartIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Medical History
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {medicalHistory ? "Complete" : "Incomplete"}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3">
            {medicalHistory ? (
              <Link
                to="/medical-history"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
              >
                Update history
              </Link>
            ) : (
              <Link
                to="/medical-history"
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
              >
                Complete now
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Medical Reports
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {medicalReports.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3">
            <Link
              to="/medical-reports"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
            >
              Upload reports
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Consultations
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    0
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3">
            <Link
              to="/book-appointment"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 shadow rounded-lg"
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Quick Actions
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/medical-history"
              className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <HeartIcon className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Medical History
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Update your information
                </p>
              </div>
            </Link>

            <Link
              to="/medical-reports"
              className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <CloudArrowUpIcon className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Upload Reports
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add medical documents
                </p>
              </div>
            </Link>

            <Link
              to="/book-appointment"
              className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <UserIcon className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Book Appointment
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Find nearby hospitals
                </p>
              </div>
            </Link>

            <Link
              to="/video-call"
              className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChartBarIcon className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Video Call
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Join consultation
                </p>
              </div>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Medical History Summary */}
      {medicalHistory && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 shadow rounded-lg"
        >
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Medical History Summary
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Basic Information
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Age:</span>{" "}
                    {medicalHistory.patient?.dateOfBirth
                      ? new Date().getFullYear() -
                        new Date(
                          medicalHistory.patient.dateOfBirth
                        ).getFullYear()
                      : "Not provided"}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Gender:</span>{" "}
                    {medicalHistory.patient?.gender || "Not provided"}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Blood Type:</span>{" "}
                    {medicalHistory.patient?.bloodType || "Not provided"}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Emergency Contact
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Name:</span>{" "}
                    {medicalHistory.emergencyContact?.name || "Not provided"}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Relationship:</span>{" "}
                    {medicalHistory.emergencyContact?.relationship ||
                      "Not provided"}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Phone:</span>{" "}
                    {medicalHistory.emergencyContact?.phone || "Not provided"}
                  </p>
                </div>
              </div>
            </div>

            {(medicalHistory.conditions?.length > 0 ||
              medicalHistory.medications?.length > 0 ||
              medicalHistory.allergies?.length > 0) && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {medicalHistory.conditions?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Conditions
                      </h3>
                      <ul className="text-sm space-y-1">
                        {medicalHistory.conditions
                          .slice(0, 3)
                          .map((condition, index) => (
                            <li
                              key={index}
                              className="text-gray-600 dark:text-gray-400"
                            >
                              • {condition}
                            </li>
                          ))}
                        {medicalHistory.conditions.length > 3 && (
                          <li className="text-blue-600 dark:text-blue-400">
                            + {medicalHistory.conditions.length - 3} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {medicalHistory.medications?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Medications
                      </h3>
                      <ul className="text-sm space-y-1">
                        {medicalHistory.medications
                          .slice(0, 3)
                          .map((medication, index) => (
                            <li
                              key={index}
                              className="text-gray-600 dark:text-gray-400"
                            >
                              • {medication}
                            </li>
                          ))}
                        {medicalHistory.medications.length > 3 && (
                          <li className="text-blue-600 dark:text-blue-400">
                            + {medicalHistory.medications.length - 3} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {medicalHistory.allergies?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Allergies
                      </h3>
                      <ul className="text-sm space-y-1">
                        {medicalHistory.allergies
                          .slice(0, 3)
                          .map((allergy, index) => (
                            <li
                              key={index}
                              className="text-red-600 dark:text-red-400"
                            >
                              ⚠ {allergy}
                            </li>
                          ))}
                        {medicalHistory.allergies.length > 3 && (
                          <li className="text-blue-600 dark:text-blue-400">
                            + {medicalHistory.allergies.length - 3} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Recent Medical Reports */}
      {medicalReports.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 shadow rounded-lg"
        >
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Recent Medical Reports
              </h2>
              <Link
                to="/medical-reports"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {medicalReports.slice(0, 3).map((report, index) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {report.originalName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Uploaded{" "}
                        {new Date(report.uploadedAt).toLocaleDateString()}
                      </p>
                      {report.extractedInfo && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          ✓ Information extracted successfully
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
