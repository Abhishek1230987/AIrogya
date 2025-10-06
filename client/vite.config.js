import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, "."),
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      stream: "stream-browserify",
      util: "util",
    },
  },
  server: {
    historyApiFallback: true,
  },
});
