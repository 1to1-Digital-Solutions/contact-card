import { expect, test } from "@playwright/test";
import { CONTACT, LANGUAGE_COOKIE } from "./helpers";

test.describe("the header toggles", () => {
  test("the language toggle switches the page and remembers the choice", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.getByRole("button", { name: "Cambiar a español" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page).toHaveTitle(`${CONTACT.name} — Tarjeta de contacto`);

    const cookie = (await context.cookies()).find((c) => c.name === LANGUAGE_COOKIE);
    expect(cookie?.value).toBe("es");

    // The server reads the cookie before writing the HTML: a reload comes
    // back in Spanish without any client-side correction.
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.getByRole("button", { name: "Switch to English" })).toBeVisible();
  });

  test("the theme toggle flips the theme and remembers it across reloads", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);

    await page.getByRole("button", { name: "Switch to the light theme" }).click();
    await expect(html).toHaveClass(/light/);
    await expect(html).not.toHaveClass(/dark/);

    // The inline script applies the remembered theme before first paint.
    await page.reload();
    await expect(html).toHaveClass(/light/);
    await expect(page.getByRole("button", { name: "Switch to the dark theme" })).toBeVisible();
  });
});
