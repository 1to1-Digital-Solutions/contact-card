import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // La lógica que probamos es pura (vCard, muelles): no necesita DOM.
    environment: "node",
    include: ["{lib,components,app}/**/*.test.{ts,tsx}"],
  },
  resolve: {
    // Lo que vive en `app/` importa con el alias de Next, así que Vitest tiene
    // que resolverlo igual para poder cargar esos módulos en un test.
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
});
