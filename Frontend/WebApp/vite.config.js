import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || "http://localhost:5059";

  return {
    base: "/app/",
    plugins: [react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url))
      }
    },
    server: {
      host: "0.0.0.0",
      proxy: {
        "/api": apiProxyTarget,
        "/uploads": apiProxyTarget
      }
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: false
    }
  };
});
