import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: path.resolve(import.meta.dirname, "src/client"),
  plugins: [react({})],
  build: {
    outDir: path.resolve(import.meta.dirname, "public/dist"),
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 3000,
    fs: {
      allow: [path.resolve(import.meta.dirname)],
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:1345",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src/client"),
      "@config": path.resolve(import.meta.dirname, "config.json"),
    },
  },
});
