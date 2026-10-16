import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Seam A: route handlers and server modules run in Node, like they do in production. */
const SERVER_TESTS = ["app/api/**/*.test.ts", "server/**/*.test.ts", "proxy.test.ts"];

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    // `server-only` throws outside the react-server condition; tests import server modules directly.
    alias: { "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)) },
  },
  test: {
    css: false,
    projects: [
      {
        extends: true,
        test: {
          name: "server",
          environment: "node",
          include: SERVER_TESTS,
        },
      },
      {
        extends: true,
        test: {
          name: "ui",
          environment: "jsdom",
          setupFiles: ["./tests/setup.ts"],
          include: ["**/*.test.{ts,tsx}"],
          exclude: ["**/node_modules/**", ".next", ".claude/**", ...SERVER_TESTS],
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["components/**", "hooks/**", "lib/**", "constants/**", "context/**", "server/**", "data.ts", "app/**", "proxy.ts"],
      exclude: ["**/*.test.*", "app/layout.tsx", "app/opengraph-image.tsx", "app/icon.tsx", "components/ui/[a-z]*.tsx"],
    },
  },
});
