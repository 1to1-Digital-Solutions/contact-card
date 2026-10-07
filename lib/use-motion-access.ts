"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

/**
 * Whether the phone's motion sensors can be used.
 *
 * - `unavailable`: there are no sensors, or permission was refused.
 * - `prompt`: there are, but the browser asks for permission and only grants
 *   it from a gesture: a button that asks for it is needed (the iOS case).
 * - `granted`: they can be listened to.
 */
export type MotionAccess = "unavailable" | "prompt" | "granted";

/** The permission iOS asks for, which is not in the DOM types. */
type Gated = { requestPermission?: () => Promise<"granted" | "denied" | "default"> };

const gates = (): Gated[] =>
  [
    typeof DeviceMotionEvent === "undefined" ? null : (DeviceMotionEvent as Gated),
    typeof DeviceOrientationEvent === "undefined"
      ? null
      : (DeviceOrientationEvent as Gated),
  ].filter((gate) => gate !== null);

const needsPermission = (): boolean =>
  gates().some((gate) => typeof gate.requestPermission === "function");

/** What this browser offers. It does not change while the page is open. */
function environment(): MotionAccess {
  if (gates().length === 0) return "unavailable";
  return needsPermission() ? "prompt" : "granted";
}

/** There is nothing to subscribe to: what there is, is what there was on opening the page. */
const subscribe = () => () => {};

/** On the server there are no sensors: that way the first render matches its own. */
const onServer = (): MotionAccess => "unavailable";

/**
 * Permission state and the way to request it. The request has to come from a
 * button's `onClick`: iOS discards one arriving without a gesture behind it,
 * and on top of that it keeps the "no" until the page is reloaded.
 */
export function useMotionAccess(): { access: MotionAccess; request: () => void } {
  const available = useSyncExternalStore(subscribe, environment, onServer);
  // The answer to the system dialog; while there is none, the environment rules.
  const [answer, setAnswer] = useState<MotionAccess | null>(null);

  const request = useCallback(() => {
    void (async () => {
      const answers = await Promise.all(
        gates().map(async (gate) => {
          if (typeof gate.requestPermission !== "function") return "granted";
          try {
            return await gate.requestPermission();
          } catch (error) {
            // The log is for diagnosing, not for the visitor to read: it
            // stays out of the dictionary.
            console.warn("Could not request motion permission:", error);
            return "denied";
          }
        }),
      );
      // A "no" to either of the two leaves the button with nothing to offer:
      // asking again does not open another dialog, so it is withdrawn.
      setAnswer(answers.every((given) => given === "granted") ? "granted" : "unavailable");
    })();
  }, []);

  return { access: answer ?? available, request };
}
