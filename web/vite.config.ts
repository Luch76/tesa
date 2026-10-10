import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Built as a static single-page app. The NestJS server in the repo root serves the
// output from dist/client behind Google login and provides the /api and /auth routes.
export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
      spa: { enabled: true },
    }),
    viteReact(),
  ],
  css: { transformer: "lightningcss" },
  resolve: {
    alias: { "@": `${process.cwd()}/src` },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  // The build pre-renders the app shell by fetching from a temporary preview server.
  // Pin it to IPv4: in some Docker builders "localhost" resolves to an unreachable ::1.
  preview: { host: "127.0.0.1" },
  server: {
    // During `npm run dev`, send API and auth calls to the NestJS server on :3000.
    proxy: { "/api": "http://localhost:3000", "/auth": "http://localhost:3000" },
  },
});
