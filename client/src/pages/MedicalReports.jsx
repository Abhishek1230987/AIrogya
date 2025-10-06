import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  PhotoIcon,
  XMarkIcon,
  EyeIcon,
  CheckCircleIcon,
  TrashIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import AnimatedButton from "../components/AnimatedButton";

export default function MedicalReports() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [extractedData, setExtractedData] = useState([]);
  const [error, setError] = useState("");

  // Load previously uploaded documents
  useEffect(() => {
    const loadUploadedDocuments = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          "http://localhost:5000/api/medical/reports",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.reports) {
            console.log("📄 Loaded uploaded documents:", data.reports);
            console.log("📄 First document structure:", data.reports[0]);
            console.log("📄 First document _id:", data.reports[0]?._id);
            setUploadedDocuments(data.reports);
          }
        }
      } catch (error) {
        console.error("Error loading uploaded documents:", error);
      } finally {
        setLoadingDocuments(false);
      }
    };

    loadUploadedDocuments();
  }, []);

  // View document
  const viewDocument = (document) => {
    console.log("👁️ Viewing document:", document);
    console.log("👁️ File path:", document.filePath);
    console.log("👁️ File name:", document.fileName);

    // Remove "uploads/" prefix if it exists in filePath
    const cleanPath =
      document.filePath?.replace(/^uploads\//, "") || document.fileName;
    const fileUrl = `http://localhost:5000/uploads/${cleanPath}`;

    console.log("👁️ Opening URL:", fileUrl);
    window.open(fileUrl, "_blank");
  };

  // Delete document
  const deleteDocument = async (documentId, fileName) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      console.log("🗑️ Deleting document:", {
        documentId,
        fileName,
        token: token ? "present" : "missing",
      });

      const response = await fetch(
        `http://localhost:5000/api/medical/reports/${documentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("🗑️ Response status:", response.status);
      console.log("🗑️ Response headers:", response.headers);

      // Check content type before parsing
      const contentType = response.headers.get("content-type");
      console.log("🗑️ Content-Type:", contentType);

      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("❌ Non-JSON response:", text);
        throw new Error(
          "Server returned non-JSON response. Check server logs."
        );
      }

      const data = await response.json();
      console.log("🗑️ Delete response:", data);

      if (response.ok) {
        setUploadedDocuments((prev) =>
          prev.filter((doc) => doc._id !== documentId)
        );
        alert("Document deleted successfully");
      } else {
        alert(`Failed to delete document: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("❌ Error deleting document:", error);
      alert(`Error deleting document: ${error.message}`);
    }
  };

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle dropped files
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  // Handle selected files
  const handleFiles = (selectedFiles) => {
    console.log(
      "Files selected:",
      selectedFiles.map((f) => ({ name: f.name, type: f.type, size: f.size }))
    );

    const validFiles = selectedFiles.filter((file) => {
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/tiff",
        "image/bmp",
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB

      console.log(
        `Validating file: ${file.name}, type: ${file.type}, size: ${file.size}`
      );

      if (!validTypes.includes(file.type)) {
        const errorMsg = `${file.name} is not a supported file type. Got: ${file.type}. Supported: PDF, JPEG, PNG, TIFF, BMP`;
        setError(errorMsg);
        console.error(errorMsg);
        return false;
      }
      if (file.size > maxSize) {
        const errorMsg = `${
          file.name
        } is too large. Maximum size is 10MB, got: ${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)}MB`;
        setError(errorMsg);
        console.error(errorMsg);
        return false;
      }
      console.log(`✅ File ${file.name} is valid`);
      return true;
    });

    const newFiles = validFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "pending", // pending, uploading, processing, completed, error
      progress: 0,
      extractedInfo: null,
      preview: null,
    }));

    // Create preview for images
    newFiles.forEach((fileObj) => {
      if (fileObj.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileObj.id ? { ...f, preview: e.target.result } : f
            )
          );
        };
        reader.readAsDataURL(fileObj.file);
      }
    });

    setFiles((prev) => [...prev, ...newFiles]);
    setError("");
  };

  // Remove file
  const removeFile = (fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Upload and process files
  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProcessing(true);
    const token = localStorage.getItem("token");
    console.log(
      "🔑 Token from localStorage:",
      token ? `${token.substring(0, 20)}...` : "No token"
    );

    for (const fileObj of files) {
      if (fileObj.status !== "pending") continue;

      try {
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileObj.id ? { ...f, status: "uploading" } : f
          )
        );

        // Create FormData
        const formData = new FormData();
        formData.append("file", fileObj.file);
        formData.append("fileName", fileObj.name);
        formData.append("fileType", fileObj.type);

        // Upload file with progress tracking
        const response = await fetch(
          "http://localhost:5000/api/medical/upload-report",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Upload failed for ${fileObj.name}`
          );
        }

        // Update status to processing
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileObj.id
              ? { ...f, status: "processing", progress: 50 }
              : f
          )
        );

        const result = await response.json();
        console.log("📄 Upload response received:", result);
        console.log("🔬 Extracted info:", result.extractedInfo);

        // Update with extracted information
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileObj.id
              ? {
                  ...f,
                  status: "completed",
                  progress: 100,
                  extractedInfo: result.extractedInfo,
                }
              : f
          )
        );

        // Add to extracted data for review
        if (result.extractedInfo) {
          console.log("✅ Adding to extracted data:", result.extractedInfo);
          setExtractedData((prev) => [
            ...prev,
            {
              fileName: fileObj.name,
              ...result.extractedInfo,
            },
          ]);
          console.log(
            "📊 Updated extracted data length:",
            extractedData.length + 1
          );
        } else {
          console.error("❌ No extracted info in response");
        }
      } catch (error) {
        console.error(`Error processing ${fileObj.name}:`, error);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileObj.id ? { ...f, status: "error", progress: 0 } : f
          )
        );
        setError(`Failed to process ${fileObj.name}`);
      }
    }

    setUploading(false);
    setProcessing(false);

    // Reload uploaded documents list
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/medical/reports",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.reports) {
          setUploadedDocuments(data.reports);
        }
      }
    } catch (error) {
      console.error("Error reloading uploaded documents:", error);
    }
  };

  // Get file icon
  const getFileIcon = (type) => {
    if (type === "application/pdf") {
      return <DocumentTextIcon className="h-8 w-8 text-red-500" />;
    } else if (type.startsWith("image/")) {
      return <PhotoIcon className="h-8 w-8 text-blue-500" />;
    }
    return <DocumentTextIcon className="h-8 w-8 text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
              <CloudArrowUpIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Upload Medical Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Upload your medical reports, lab results, prescriptions, and other
            medical documents. Our AI will extract important information
            automatically.
          </p>
        </div>

        {/* Previously Uploaded Documents */}
        {!loadingDocuments && uploadedDocuments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Your Uploaded Documents
            </h2>
            <div className="space-y-3">
              {uploadedDocuments.map((doc) => (
                <motion.div
                  key={doc._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    {doc.fileType?.startsWith("image/") ? (
                      <PhotoIcon className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                    ) : (
                      <DocumentTextIcon className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {doc.originalName || doc.fileName}
                      </p>
                      <div className="flex items-center space-x-3 mt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {doc.fileSize
                            ? formatFileSize(doc.fileSize)
                            : "Unknown size"}
                        </p>
                        {doc.uploadedAt && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            • {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        )}
                        {doc.extractedInfo && (
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                            Analyzed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => viewDocument(doc)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                      title="View document"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        window.open(
                          `http://localhost:5000/uploads/${(
                            doc.filePath || doc.fileName
                          ).replace(/^uploads\//, "")}`,
                          "_blank"
                        )
                      }
                      className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                      title="Download document"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        deleteDocument(
                          doc._id,
                          doc.originalName || doc.fileName
                        )
                      }
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      title="Delete document"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Loading State for Documents */}
        {loadingDocuments && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 mb-8"
          >
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mr-3"></div>
              <p className="text-gray-500 dark:text-gray-400">
                Loading your documents...
              </p>
            </div>
          </motion.div>
        )}

        {/* Upload Area */}
        <motion.div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 mb-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Drag and Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Drop your medical files here
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              or click to browse your files
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              Supported formats: PDF, JPEG, JPG, PNG, TIFF, BMP • Max size: 10MB
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp"
              onChange={(e) => handleFiles(Array.from(e.target.files))}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
            >
              Choose Files
            </label>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Supports: PDF, JPG, PNG, TIFF, BMP (Max 10MB each)
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Selected Files ({files.length})
              </h3>
              <div className="space-y-3">
                {files.map((fileObj) => (
                  <motion.div
                    key={fileObj.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      {fileObj.preview ? (
                        <img
                          src={fileObj.preview}
                          alt={fileObj.name}
                          className="h-12 w-12 object-cover rounded"
                        />
                      ) : (
                        getFileIcon(fileObj.type)
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {fileObj.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(fileObj.size)}
                        </p>
                        {fileObj.status !== "pending" && (
                          <div className="flex items-center mt-1">
                            {fileObj.status === "completed" && (
                              <CheckCircleIcon className="h-4 w-4 text-green-500 dark:text-green-400 mr-1" />
                            )}
                            <span
                              className={`text-xs ${
                                fileObj.status === "completed"
                                  ? "text-green-600 dark:text-green-400"
                                  : fileObj.status === "error"
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-blue-600 dark:text-blue-400"
                              }`}
                            >
                              {fileObj.status === "uploading" && "Uploading..."}
                              {fileObj.status === "processing" &&
                                "Processing..."}
                              {fileObj.status === "completed" && "Completed"}
                              {fileObj.status === "error" && "Error"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {fileObj.status === "completed" &&
                        fileObj.extractedInfo && (
                          <button
                            type="button"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            title="View extracted information"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                        )}
                      {fileObj.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => removeFile(fileObj.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Upload Button */}
              <div className="flex justify-end mt-6">
                <AnimatedButton
                  onClick={uploadFiles}
                  disabled={
                    uploading || files.every((f) => f.status !== "pending")
                  }
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {uploading ? "Processing Files..." : "Upload & Analyze Files"}
                </AnimatedButton>
              </div>
            </div>
          )}
        </motion.div>

        {/* Extracted Information Review */}
        {extractedData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Extracted Medical Information
            </h2>
            <div className="space-y-6">
              {extractedData.map((data, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                    <span>From: {data.fileName}</span>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded">
                        {data.source || "AI Analysis"}
                      </span>
                      {data.confidence && (
                        <span className="bg-green-100 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded ml-2">
                          {data.confidence}% confidence
                        </span>
                      )}
                    </div>
                  </h3>

                  {/* Patient Information */}
                  {data.patientInfo && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                        Patient Information:
                      </h4>
                      <div className="text-sm text-blue-800 dark:text-blue-200 grid grid-cols-2 gap-2">
                        {data.patientInfo.name && (
                          <div>
                            <strong>Name:</strong> {data.patientInfo.name}
                          </div>
                        )}
                        {data.patientInfo.patientId && (
                          <div>
                            <strong>ID:</strong> {data.patientInfo.patientId}
                          </div>
                        )}
                        {data.patientInfo.dateOfBirth && (
                          <div>
                            <strong>DOB:</strong> {data.patientInfo.dateOfBirth}
                          </div>
                        )}
                        {data.patientInfo.age && (
                          <div>
                            <strong>Age:</strong> {data.patientInfo.age}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {data.medications && data.medications.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300">
                          Medications:
                        </h4>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                          {data.medications.map((med, i) => (
                            <li key={i}>{med}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {data.conditions && data.conditions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300">
                          Conditions:
                        </h4>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                          {data.conditions.map((condition, i) => (
                            <li key={i}>{condition}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {data.labResults && data.labResults.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300">
                          Lab Results:
                        </h4>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                          {data.labResults.map((result, i) => (
                            <li key={i}>{result}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {data.vitals && data.vitals.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300">
                          Vital Signs:
                        </h4>
                        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                          {data.vitals.map((vital, i) => (
                            <li key={i}>{vital}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {data.dateOfReport && (
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300">
                          Report Date:
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {data.dateOfReport}
                        </p>
                      </div>
                    )}
                    {data.doctorName && (
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300">
                          Doctor:
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {data.doctorName}
                        </p>
                      </div>
                    )}
                    {data.facility && (
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300">
                          Facility:
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {data.facility}
                        </p>
                      </div>
                    )}
                    {data.reportType && (
                      <div>
                        <h4 className="font-medium text-gray-700 dark:text-gray-300">
                          Report Type:
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {data.reportType}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Key Findings Section */}
                  {data.keyFindings && data.keyFindings.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <h4 className="font-medium text-yellow-900 dark:text-yellow-300 mb-2">
                        Key Findings & Notes:
                      </h4>
                      <ul className="list-disc list-inside text-sm text-yellow-800 dark:text-yellow-200">
                        {data.keyFindings.map((finding, i) => (
                          <li key={i}>{finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Processing Details */}
                  {(data.extractedTextLength || data.processingMethod) && (
                    <div className="mt-4 p-2 bg-gray-50 dark:bg-gray-900/50 rounded text-xs text-gray-500 dark:text-gray-400">
                      {data.extractedTextLength && (
                        <span>
                          Extracted {data.extractedTextLength} characters •{" "}
                        </span>
                      )}
                      {data.processingMethod && (
                        <span>Method: {data.processingMethod}</span>
                      )}
                      {data.timestamp && (
                        <span>
                          {" "}
                          • {new Date(data.timestamp).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Review Later
              </button>
              <AnimatedButton
                onClick={() => navigate("/medical-history")}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Update Medical History
              </AnimatedButton>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
