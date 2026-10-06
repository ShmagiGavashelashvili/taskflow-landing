import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["components/**", "hooks/**", "lib/**", "constants/**", "context/**", "data.ts", "app/**"],
      exclude: ["**/*.test.*", "app/layout.tsx", "app/opengraph-image.tsx", "app/icon.tsx"],
    },
  },
});
