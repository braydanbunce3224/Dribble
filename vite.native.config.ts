import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { grokPwaPlugin } from "./scripts/grok-pwa-plugin.mjs";
import { appEnvPlugin } from "./scripts/app-env-plugin.mjs";

/** Static SPA for Capacitor App Store / Play Store shells. Preview still uses vite.config.ts. */
export default defineConfig({
  base: "./",
  server: { host: "0.0.0.0", port: 8080, strictPort: true },
  resolve: { tsconfigPaths: true },
  plugins: [
    appEnvPlugin(),
    grokPwaPlugin(),
    tailwindcss(),
    tanstackStart({ spa: { enabled: true } }),
    viteReact(),
  ],
  build: {
    outDir: "native/www",
    emptyOutDir: true,
    sourcemap: false,
  },
});
