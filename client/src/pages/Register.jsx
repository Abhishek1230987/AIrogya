import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import AnimatedButton from "../components/AnimatedButton";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    console.log("🎯 Submitting registration for:", email);

    try {
      await register(name, email, password);
      console.log("✅ Registration completed successfully");
    } catch (err) {
      console.error("❌ Registration error:", err);
      const errorMessage =
        err.message || "Registration failed. Please try again.";
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-xl shadow-2xl"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              Sign in
            </Link>
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-md"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm space-y-4">
            <div className="relative group">
              <label htmlFor="name" className="sr-only">
                Full name
              </label>
              <UserIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 absolute top-3 left-3 transition-colors duration-200 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 focus:z-10 sm:text-sm transition-all duration-200 hover:border-blue-500 dark:hover:border-blue-400"
                placeholder="Full name"
              />
            </div>

            <div className="relative group">
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <EnvelopeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 absolute top-3 left-3 transition-colors duration-200 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 focus:z-10 sm:text-sm transition-all duration-200 hover:border-blue-500 dark:hover:border-blue-400"
                placeholder="Email address"
              />
            </div>

            <div className="relative group">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <LockClosedIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 absolute top-3 left-3 transition-colors duration-200 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 focus:z-10 sm:text-sm transition-all duration-200 hover:border-blue-500 dark:hover:border-blue-400"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <AnimatedButton
              type="submit"
              variant="primary"
              className="w-full py-3"
            >
              Create Account
            </AnimatedButton>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() =>
                (window.location.href = "http://localhost:5000/api/auth/google")
              }
              className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
