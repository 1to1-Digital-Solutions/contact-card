import { useSyncExternalStore } from "react";

/**
 * `pending` while the server HTML has not hydrated yet; afterwards, whether
 * the browser can paint in 3D or not.
 */
export type WebGLStatus = "pending" | "ready" | "unsupported";

let cached: WebGLStatus | null = null;

/**
 * If the browser cannot handle WebGL —disabled, blocked driver, old browser—
 * it is not an error to report: the page shows the flat version of the card,
 * with exactly the same data.
 */
function detect(): WebGLStatus {
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    return context ? "ready" : "unsupported";
  } catch {
    return "unsupported";
  }
}

function getSnapshot(): WebGLStatus {
  cached ??= detect();
  return cached;
}

function getServerSnapshot(): WebGLStatus {
  return "pending";
}

/** The capability does not change during the page's lifetime: there is nothing to subscribe to. */
const subscribe = () => () => {};

export function useWebGLStatus(): WebGLStatus {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
