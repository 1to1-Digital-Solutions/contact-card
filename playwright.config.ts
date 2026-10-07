import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests for the card.
 *
 * They run against the **built** site, not against `next dev`: the build is
 * what gets published, and it is where a page that breaks while prerendering
 * shows up. Playwright starts the server itself and reuses one that is
 * already listening, so iterating does not wait for a build every time.
 *
 * `E2E_PORT` lets this suite run alongside another repo's without fighting
 * over the port, which is how they are used on the same machine.
 */

const PORT = Number(process.env.E2E_PORT ?? 3220);
const BASE = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE,
    trace: "on-first-retry",
  },
  projects: [
    // Desktop gets the side panel; a phone gets the full-screen card with the
    // details in a sheet. Both are real layouts, so both get tested.
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT} --hostname 127.0.0.1`,
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
