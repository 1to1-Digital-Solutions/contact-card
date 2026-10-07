"use client";

import type { ReactNode } from "react";
import { dictionary } from "@/lib/dictionary";
import type { Language } from "@/lib/i18n";
import { shareCard, shareFeedback, shareTarget } from "@/lib/share";
import { type Feedback, useFeedback } from "@/lib/use-feedback";
import { DoneIcon, FailedIcon, SceneControl, ShareIcon } from "./scene-control";

/** The icon tells how it ended, just like on the copy buttons. */
const ICON: Record<Feedback, ReactNode> = {
  idle: <ShareIcon />,
  done: <DoneIcon />,
  failed: <FailedIcon />,
};

/**
 * Shares the card with the system dialog. Where there is none —the desktop,
 * almost always— it copies the link and confirms it just like the copy
 * buttons, so the button is not left doing nothing. A real share carries no
 * feedback: the dialog itself already is the feedback.
 */
export function ShareControl({ language }: { language: Language }) {
  const t = dictionary(language);
  const [feedback, announce] = useFeedback();

  const share = async () => {
    const outcome = await shareCard(shareTarget(language), {
      // `navigator.share` does not exist in every browser, and the one that
      // has it wants it invoked on itself: that is why it is wrapped instead
      // of passed loose.
      share: "share" in navigator ? (target) => navigator.share(target) : undefined,
      copy: (text) => navigator.clipboard.writeText(text),
      // The log is for diagnosing, not for reading: it goes untranslated.
      warn: (error) => console.warn("Could not share the card:", error),
    });

    const result = shareFeedback(outcome);
    if (result) announce(result);
  };

  return (
    <>
      <SceneControl label={t.controls.share} icon={ICON[feedback]} onClick={share} />

      <span role="status" className="sr-only">
        {feedback === "done" && t.copy.done(t.copy.link)}
        {feedback === "failed" && t.copy.failed(t.copy.link)}
      </span>
    </>
  );
}
