import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Consultation from "./pages/Consultation.jsx";
import BookAppointment from "./pages/BookAppointment.jsx";
import VideoCall from "./pages/VideoCall.jsx";
import VoiceConsultation from "./pages/VoiceConsultation.jsx";
import MedicalHistory from "./pages/MedicalHistory.jsx";
import MedicalReports from "./pages/MedicalReports.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          {/* Protected Routes - Require Authentication */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="consultation"
            element={
              <ProtectedRoute>
                <Consultation />
              </ProtectedRoute>
            }
          />
          <Route
            path="book-appointment"
            element={
              <ProtectedRoute>
                <BookAppointment />
              </ProtectedRoute>
            }
          />
          <Route
            path="voice-consultation"
            element={
              <ProtectedRoute>
                <VoiceConsultation />
              </ProtectedRoute>
            }
          />
          <Route
            path="video-call"
            element={
              <ProtectedRoute>
                <VideoCall />
              </ProtectedRoute>
            }
          />
          <Route
            path="medical-history"
            element={
              <ProtectedRoute>
                <MedicalHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="medical-reports"
            element={
              <ProtectedRoute>
                <MedicalReports />
              </ProtectedRoute>
            }
          />

          {/* Auth callback - no protection needed */}
          <Route path="auth/callback" element={<AuthCallback />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
