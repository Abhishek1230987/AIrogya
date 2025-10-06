import { motion } from "framer-motion";

export default function AnimatedButton({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
  type = "button",
}) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm hover:from-blue-500 hover:to-indigo-600 hover:shadow-lg focus:ring-blue-500",
    secondary:
      "bg-gray-100 text-gray-900 hover:bg-gray-200 shadow hover:shadow-md focus:ring-gray-500",
    outline:
      "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
    danger:
      "bg-gradient-to-br from-rose-600 to-red-600 text-white hover:from-rose-500 hover:to-red-600 shadow-sm hover:shadow-lg focus:ring-red-500",
    ghost:
      "bg-transparent text-gray-700 hover:bg-gray-100 border border-transparent hover:border-gray-200",
  };

  return (
    <motion.button
      type={type}
      whileHover={{ y: -1, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      <span className="inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}
