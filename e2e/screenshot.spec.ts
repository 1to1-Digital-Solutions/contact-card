import { test } from "@playwright/test";

/**
 * Not a test: it refreshes the README screenshot. Run it on purpose with
 * `SCREENSHOT=1 npx playwright test screenshot --project=desktop`; otherwise
 * it is skipped so the suite does not rewrite a tracked file on every run.
 */
test("refreshes docs/screenshot.jpg", async ({ page }) => {
  test.skip(!process.env.SCREENSHOT, "set SCREENSHOT=1 to refresh the README image");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  // Let the card drop in and settle before the shot.
  await page.waitForTimeout(3500);
  await page.screenshot({ path: "docs/screenshot.jpg", type: "jpeg", quality: 88 });
});
