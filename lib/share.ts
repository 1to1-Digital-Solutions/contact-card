/**
 * Sharing the card: what gets sent and through where.
 *
 * The good path is the system dialog (`navigator.share`), which on a phone
 * offers the apps the sharer already uses. Where it does not exist —the
 * desktop, almost always— what is left is copying the link, which is what was
 * being done by hand from the browser's address bar. The choice lives here,
 * apart from the button, so it can be tested without a browser.
 */

import { CONTACT } from "./contact";
import { dictionary } from "./dictionary";
import type { Language } from "./i18n";
import { SITE_URL } from "./site";

/** What gets shared: the card's title and its address. */
export type ShareTarget = {
  title: string;
  url: string;
};

/**
 * How the attempt ended:
 * - `shared`: the system dialog took it.
 * - `dismissed`: the dialog opened and was closed without sharing.
 * - `copied`: there was no dialog (or it could not open) and the link is copied.
 * - `failed`: copying failed too; it is the only one worth reporting.
 */
export type ShareOutcome = "shared" | "dismissed" | "copied" | "failed";

/** What the browser provides for sharing, injected so it can be tested. */
export type ShareTools = {
  /** `navigator.share`, or nothing if the browser does not have it. */
  share?: (target: ShareTarget) => Promise<void>;
  /** `navigator.clipboard.writeText`: the path the copy buttons take. */
  copy: (text: string) => Promise<void>;
  /** Where failures get reported: a swallowed error never gets fixed. */
  warn: (error: unknown) => void;
};

/**
 * What gets shared, in the language being viewed. The address is the site's
 * canonical one and not `location.href`: whoever receives the link has to
 * land on the card, not on the route with the parameters it was reached with.
 */
export function shareTarget(language: Language): ShareTarget {
  return { title: dictionary(language).meta.title(CONTACT.name), url: SITE_URL };
}

/**
 * Closing the system dialog without sharing arrives as an `AbortError`. That
 * is not a failure: it is someone who changed their mind, and showing them an
 * error notice would tell them something that works is broken.
 */
function isDismissal(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

/**
 * Shares the card through the best path available. If the system dialog does
 * not exist, or exists but blows up on opening, it falls back to copying the
 * link: the button never ends up doing nothing.
 */
export async function shareCard(
  target: ShareTarget,
  { share, copy, warn }: ShareTools,
): Promise<ShareOutcome> {
  if (share) {
    try {
      await share(target);
      return "shared";
    } catch (error) {
      if (isDismissal(error)) return "dismissed";
      warn(error);
    }
  }

  try {
    await copy(target.url);
    return "copied";
  } catch (error) {
    warn(error);
    return "failed";
  }
}

/**
 * Which notice each ending leaves, or none. Actually sharing carries no notice
 * —the system dialog itself already is one— and cancelling it does not either:
 * whoever changes their mind has broken nothing, and showing them an error
 * would tell them otherwise.
 *
 * It goes in the table and not in a couple of `if`s inside the button because
 * the type forces deciding it for every ending: a new path in `ShareOutcome`
 * cannot slip in without someone saying what the presser gets told.
 */
const FEEDBACK: Record<ShareOutcome, "done" | "failed" | null> = {
  shared: null,
  dismissed: null,
  copied: "done",
  failed: "failed",
};

/** The button's passing notice for this ending, or `null` if none applies. */
export function shareFeedback(outcome: ShareOutcome): "done" | "failed" | null {
  return FEEDBACK[outcome];
}
