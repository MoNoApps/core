import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname, "src/client"),
  plugins: [react({})],
  build: {
    outDir: path.resolve(__dirname, "public/dist"),
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 3000,
    fs: {
      allow: [path.resolve(__dirname)],
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:1345",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/socket.io": {
        target: "http://127.0.0.1:1344",
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/client"),
      "@config": path.resolve(__dirname, "config.json"),
    },
  },
});
