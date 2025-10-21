import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs-extra";

// Plugin to copy API files to dist
const copyApiPlugin = () => ({
  name: "copy-api",
  closeBundle: async () => {
    const apiSource = path.resolve(__dirname, "api");
    const apiDest = path.resolve(__dirname, "dist/api");
    
    try {
      await fs.copy(apiSource, apiDest, {
        overwrite: true,
        filter: (src: string) => !src.includes("node_modules")
      });
      console.log("✓ API files copied to dist/api");
    } catch (err) {
      console.error("Error copying API files:", err);
    }
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    mode === "production" && copyApiPlugin()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
