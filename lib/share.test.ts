import { describe, expect, it, vi } from "vitest";
import { CONTACT } from "./contact";
import { dictionary } from "./dictionary";
import { LANGUAGES } from "./i18n";
import {
  shareCard,
  shareFeedback,
  type ShareTarget,
  type ShareTools,
  shareTarget,
} from "./share";
import { SITE_URL } from "./site";

/**
 * Three paths and none of them can be tested in a real browser: the system
 * dialog does not open without a human gesture and cannot be cancelled from a
 * test. That is why `shareCard` receives what it uses instead of going to
 * fetch it.
 */

const TARGET: ShareTarget = { title: "Card", url: "https://example.test" };

/** The browser tools, all spied on and with the dialog present. */
function toolsWith(overrides: Partial<ShareTools> = {}) {
  return {
    share: vi.fn(async () => {}),
    copy: vi.fn(async () => {}),
    warn: vi.fn(),
    ...overrides,
  } satisfies ShareTools;
}

/** Cancelling the dialog arrives like this from the browser. */
const dismissal = () => new DOMException("Share canceled", "AbortError");

describe("shareCard", () => {
  it("uses the system dialog when the browser has it", async () => {
    const tools = toolsWith();

    await expect(shareCard(TARGET, tools)).resolves.toBe("shared");
    expect(tools.share).toHaveBeenCalledWith(TARGET);
    expect(tools.copy).not.toHaveBeenCalled();
    expect(tools.warn).not.toHaveBeenCalled();
  });

  it("copies the link when there is no system dialog", async () => {
    const tools = toolsWith({ share: undefined });

    await expect(shareCard(TARGET, tools)).resolves.toBe("copied");
    expect(tools.copy).toHaveBeenCalledWith(TARGET.url);
    expect(tools.warn).not.toHaveBeenCalled();
  });

  it("does not count closing the dialog without sharing as a failure", async () => {
    const tools = toolsWith({ share: vi.fn(async () => Promise.reject(dismissal())) });

    await expect(shareCard(TARGET, tools)).resolves.toBe("dismissed");
    // Neither an error notice nor a copy behind their back: whoever cancels
    // wants to stay as they were, not end up with the link on the clipboard.
    expect(tools.warn).not.toHaveBeenCalled();
    expect(tools.copy).not.toHaveBeenCalled();
  });

  it("falls back to copying the link if the system dialog blows up", async () => {
    const broken = new TypeError("share not available here");
    const tools = toolsWith({ share: vi.fn(async () => Promise.reject(broken)) });

    await expect(shareCard(TARGET, tools)).resolves.toBe("copied");
    expect(tools.copy).toHaveBeenCalledWith(TARGET.url);
    expect(tools.warn).toHaveBeenCalledWith(broken);
  });

  it("warns when copying fails too", async () => {
    const denied = new Error("clipboard blocked");
    const tools = toolsWith({ share: undefined, copy: vi.fn(async () => Promise.reject(denied)) });

    await expect(shareCard(TARGET, tools)).resolves.toBe("failed");
    expect(tools.warn).toHaveBeenCalledWith(denied);
  });
});

describe("shareFeedback", () => {
  it("confirms the copy like any other copied field", () => {
    expect(shareFeedback("copied")).toBe("done");
  });

  it("only shows the failure when there was nothing left to try", () => {
    expect(shareFeedback("failed")).toBe("failed");
  });

  it("stays quiet when the system dialog took it", () => {
    // The dialog already is the confirmation: a notice on top is redundant.
    expect(shareFeedback("shared")).toBeNull();
  });

  it("stays quiet too when the dialog was closed without sharing", () => {
    expect(shareFeedback("dismissed")).toBeNull();
  });

  /** What the button really does: the two pieces, one after the other. */
  it("shows no notice to whoever cancels the system dialog", async () => {
    const tools = toolsWith({ share: vi.fn(async () => Promise.reject(dismissal())) });

    expect(shareFeedback(await shareCard(TARGET, tools))).toBeNull();
  });
});

describe("shareTarget", () => {
  it.each(LANGUAGES)("sends the site's canonical address in %s", (language) => {
    // Not `location.href`: the address bar link carries the campaign
    // parameters and the `#` it was reached with, and none of that belongs.
    expect(shareTarget(language).url).toBe(SITE_URL);
  });

  it.each(LANGUAGES)("titles the card with the text in %s", (language) => {
    expect(shareTarget(language).title).toBe(
      dictionary(language).meta.title(CONTACT.name),
    );
  });

  it("says the title in the language being viewed", () => {
    const titles = LANGUAGES.map((language) => shareTarget(language).title);
    expect(new Set(titles).size).toBe(LANGUAGES.length);
    for (const title of titles) expect(title).toContain(CONTACT.name);
  });
});
