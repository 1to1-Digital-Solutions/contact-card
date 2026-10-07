import { expect, test } from "@playwright/test";
import { CONTACT, disableWebgl } from "./helpers";

test.describe("the card page", () => {
  test("renders in English for an English browser, with the 3D scene", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    await expect(page).toHaveTitle(`${CONTACT.name} — Contact card`);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    // The scene is a WebGL canvas inside the labelled region.
    const scene = page.getByRole("region", { name: "Interactive contact card" });
    await expect(scene.locator("canvas")).toBeVisible();
  });

  test("renders in Spanish when the browser asks for it", async ({ browser }) => {
    const context = await browser.newContext({ locale: "es-ES" });
    const page = await context.newPage();
    await page.goto("/");

    await expect(page).toHaveTitle(`${CONTACT.name} — Tarjeta de contacto`);
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await context.close();
  });

  test("keeps the contact details in plain HTML, with a vCard to save", async ({ page }) => {
    await page.goto("/");

    // On a phone the details live in a sheet; open it first.
    const openSheet = page.getByRole("button", { name: "See the details" });
    if (await openSheet.isVisible()) await openSheet.click();

    const details = page.getByRole("dialog").or(page.getByRole("complementary"));
    await expect(details.getByRole("link", { name: CONTACT.email })).toHaveAttribute(
      "href",
      `mailto:${CONTACT.email}`,
    );
    await expect(details.getByRole("link", { name: CONTACT.website, exact: true })).toHaveAttribute(
      "href",
      /^https:\/\/1to1digital\.solutions\/?$/,
    );

    const downloadPromise = page.waitForEvent("download");
    await details.getByRole("button", { name: "Save contact (.vcf)" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.vcf$/);
    const body = await streamToString(await download.createReadStream());
    expect(body).toContain("BEGIN:VCARD");
    expect(body).toContain(`EMAIL;TYPE=INTERNET,WORK:${CONTACT.email}`);
  });

  test("shows the flat card when WebGL is unavailable", async ({ page }) => {
    await disableWebgl(page);
    await page.goto("/");

    await expect(page.getByText("Your browser cannot show 3D graphics")).toBeVisible();
    const flip = page.getByRole("button", { name: "See the back of the card" });
    await expect(flip).toBeVisible();
    await flip.click();
    await expect(page.getByRole("button", { name: "See the front of the card" })).toBeVisible();
  });

  test("does not log errors in the console", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/", { waitUntil: "networkidle" });
    // Give the scene a moment to mount: a CSP violation or a shader failure
    // would show up here and nowhere else.
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });
});

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk as Buffer));
  return Buffer.concat(chunks).toString("utf8");
}
