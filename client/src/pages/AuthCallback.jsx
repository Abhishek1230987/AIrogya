import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const userData = searchParams.get("user");
    const error = searchParams.get("error");

    if (error) {
      console.error("Authentication error:", error);
      navigate("/login?error=Authentication failed");
      return;
    }

    if (token && userData) {
      try {
        const user = JSON.parse(decodeURIComponent(userData));
        localStorage.setItem("token", token);
        setUser(user);
        navigate("/dashboard");
      } catch (err) {
        console.error("Error parsing user data:", err);
        navigate("/login?error=Invalid response");
      }
    } else {
      navigate("/login?error=Missing authentication data");
    }
  }, [searchParams, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Completing authentication...</p>
      </div>
    </div>
  );
}
