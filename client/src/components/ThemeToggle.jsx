import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../contexts/ThemeContext";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDarkMode ? 180 : 0, scale: isDarkMode ? 0 : 1 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="absolute"
      >
        <SunIcon className="h-5 w-5 text-yellow-500" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{ rotate: isDarkMode ? 0 : -180, scale: isDarkMode ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="absolute"
      >
        <MoonIcon className="h-5 w-5 text-indigo-400" />
      </motion.div>
    </button>
  );
}
