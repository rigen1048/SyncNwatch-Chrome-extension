import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),

        // Content script(s)
        content: resolve(__dirname, "src/content/content.ts"),

        // Background service worker (Manifest V3)
        background: resolve(__dirname, "src/background.js"),
      },
      output: {
        // Ensure predictable filenames (no hashes) for manifest.json references
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
});
