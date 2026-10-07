"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** How what the button did ended: it is what gets shown and what gets announced. */
export type Feedback = "idle" | "done" | "failed";

/** How long the notice stays before the button returns to its normal state. */
const FEEDBACK_MS = 2000;

/**
 * Passing notice of a button that confirms what it did, because a button that
 * confirms nothing leaves the presser not knowing whether it worked.
 *
 * The timer is cancelled on unmount and also on every new notice: otherwise
 * the one from the previous press would wipe the notice that just came out.
 */
export function useFeedback(): [Feedback, (result: Exclude<Feedback, "idle">) => void] {
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const announce = useCallback((result: Exclude<Feedback, "idle">) => {
    setFeedback(result);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setFeedback("idle"), FEEDBACK_MS);
  }, []);

  return [feedback, announce];
}
