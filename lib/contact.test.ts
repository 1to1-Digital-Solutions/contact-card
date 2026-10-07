import { describe, expect, it } from "vitest";
import { CONTACT, PROFILES } from "./contact";

/**
 * `lib/contact.ts` stores each detail twice (the readable phone and its
 * E.164, the domain and its URL, the full name and its parts) because each
 * version is consumed somewhere different (the card, the vCard, the links).
 * When editing it is easy to change one and forget the other: the `tel:`
 * would dial an old number without anyone noticing. These checks close that
 * gap.
 */
describe("CONTACT", () => {
  it("keeps the same phone in both forms", () => {
    expect(CONTACT.phoneE164).toBe(CONTACT.phone.replace(/[\s.()-]/g, ""));
  });

  it("stores the phone in valid E.164, which is what the vCard requires", () => {
    expect(CONTACT.phoneE164).toMatch(/^\+[1-9]\d{7,14}$/);
  });

  it("points the website URL at the domain that is displayed", () => {
    const url = new URL(CONTACT.websiteUrl);
    expect(url.protocol).toBe("https:");
    expect(url.host).toBe(CONTACT.website);
  });

  it("composes the visible name from the vCard's given and family names", () => {
    expect(CONTACT.name).toBe(`${CONTACT.givenName} ${CONTACT.familyName}`);
  });

  it("has a reasonable-looking email", () => {
    expect(CONTACT.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});

/**
 * Each profile is also stored twice (the address that is read and the URL it
 * leads to) and the same old slip would make the link go somewhere other
 * than it announces. Besides, the LinkedIn path carries the accents
 * percent-encoded: writing them literally leaves a URL that is not the
 * profile's canonical one.
 */
describe("PROFILES", () => {
  it("links the profiles that are shown, and only those", () => {
    expect(PROFILES.map((profile) => profile.name)).toEqual(["LinkedIn", "GitHub"]);
  });

  it.each(PROFILES)("leads to $name over https", ({ url }) => {
    expect(new URL(url).protocol).toBe("https:");
  });

  it.each(PROFILES)("stores the $name URL already encoded", ({ url }) => {
    // `href` normalises: if the URL were written with literal accents, the
    // canonical form would not match what is written here.
    expect(url).toBe(new URL(url).href);
  });

  it.each(PROFILES)("shows for $name the address it leads to", ({ address, url }) => {
    const { host, pathname } = new URL(url);
    const shown = decodeURI(`${host}${pathname}`)
      .replace(/^www\./, "")
      .replace(/\/$/, "");
    expect(shown).toBe(address);
  });
});
