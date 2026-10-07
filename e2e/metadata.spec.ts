import { expect, test } from "@playwright/test";
import { CONTACT } from "./helpers";

test.describe("what crawlers and link previews get", () => {
  test("the page sends the security headers", async ({ request }) => {
    const response = await request.get("/");
    expect(response.status()).toBe(200);
    const headers = response.headers();
    expect(headers["content-security-policy"]).toMatch(/script-src 'self' 'nonce-/);
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("describes the person with JSON-LD", async ({ page }) => {
    await page.goto("/");
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    const data = JSON.parse(jsonLd ?? "{}");
    expect(data["@type"]).toBe("Person");
    expect(data.name).toBe(CONTACT.name);
    expect(data.email).toContain(CONTACT.email);
  });

  test("serves robots.txt, the sitemap and the share image", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBe(true);
    expect(await robots.text()).toContain("Sitemap:");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).toContain("<loc>");

    const image = await request.get("/opengraph-image");
    expect(image.ok()).toBe(true);
    expect(image.headers()["content-type"]).toMatch(/^image\/png/);
  });
});
