import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The logic under test is pure (vCard, springs): it needs no DOM.
    environment: "node",
    include: ["{lib,components,app}/**/*.test.{ts,tsx}"],
  },
  resolve: {
    // What lives in `app/` imports with Next's alias, so Vitest has to
    // resolve it the same way to be able to load those modules in a test.
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
});
