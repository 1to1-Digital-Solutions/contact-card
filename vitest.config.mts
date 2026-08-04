import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // La lógica que probamos es pura (vCard, muelles): no necesita DOM.
    environment: "node",
    include: ["{lib,components,app}/**/*.test.{ts,tsx}"],
  },
});
