import { motion } from "framer-motion";

export default function BackgroundDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {/* Radial glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-blue-200/50 to-indigo-300/40 blur-3xl" />
      {/* Subtle grid overlay */}
      <motion.div
        className="absolute inset-0 opacity-[0.07]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.07 }}
        transition={{ duration: 1.2 }}
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}
