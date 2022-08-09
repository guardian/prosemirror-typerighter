import { defineConfig } from "vite";
import packageJson from "./package.json";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
      babel: {
        plugins: ["@emotion/babel-plugin"]
      }
    })
  ],
  esbuild: {
    logOverride: { "this-is-undefined-in-esm": "silent" }
  },
  server: {
    port: 5000,
    hmr: {
      protocol: "wss",
      port: 5000,
      clientPort: 443,
      path: "ws/"
    }
  },
  build: {
    outDir: "dist/",
    sourcemap: true,
    lib: {
      entry: "src/ts/index.ts",
      formats: ["cjs", "es"],
      fileName: "index"
    },
    rollupOptions: {
      // We do not bundle any dependencies specified by node_modules –
      // they should be bundled by the application using this module.
      external: Object.keys(packageJson.dependencies)
    }
  }
});
