"use client";

import type { ReactNode } from "react";

/**
 * Sober scene button: it reads over either of the two themes. The
 * `pointer-events-auto` goes on the button and not on the row that groups
 * them: that row takes the full width as soon as the controls wrap onto two
 * lines, and from there it would swallow the gesture in the gaps between
 * buttons.
 */
const CONTROL_CLASSES =
  "pointer-events-auto inline-flex size-11 items-center justify-center gap-2 rounded-full border border-ink/15 bg-ink/5 text-sm font-medium text-ink backdrop-blur transition-colors hover:bg-ink/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-ink roomy:w-auto roomy:px-5";

/**
 * Scene control. Where there is no room to spare it is icon-only, so they
 * all fit on one line —or in one column, on a phone in landscape— and the
 * card keeps the rest; with screen to spare (`roomy`) the label appears next
 * to it. The accessible label is always there, and it is exactly the label
 * seen when widening: a control's name has to contain its visible text to be
 * activatable by voice (WCAG 2.5.3).
 */
export function SceneControl({
  label,
  icon,
  onClick,
  className = "",
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`${CONTROL_CLASSES} ${className}`}
    >
      {icon}
      <span className="hidden roomy:inline">{label}</span>
    </button>
  );
}

/** Common stroke for the icons: the same weight and caps as the header's. */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 shrink-0"
    >
      {children}
    </svg>
  );
}

/**
 * Flip: the landscape card and the arrow that turns it over. Drawing instead
 * the two halves of a sheet folding over its axis leaves a bracket-like icon
 * that, at 20 px and with no label beside it, reads as a frame and not as a
 * turn: it is reduced to a few loose corners.
 */
export function FlipIcon() {
  return (
    <Icon>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M6 8a6.5 6.5 0 0 1 12-1" />
      <path d="M18 3v4h-4" />
    </Icon>
  );
}

/**
 * Recenter: four arrows bringing the card to the center. A frame with a dot
 * in the middle says the same on paper, but it is a camera's viewfinder: put
 * on a button, it looks like it is going to take a photo.
 */
export function RecenterIcon() {
  return (
    <Icon>
      <path d="M4 4l5 5M9 5.5V9H5.5" />
      <path d="M20 4l-5 5M15 5.5V9h3.5" />
      <path d="M4 20l5-5M9 18.5V15H5.5" />
      <path d="M20 20l-5-5M15 18.5V15h3.5" />
    </Icon>
  );
}

/** The contact data: the "i" for information. */
export function DetailsIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.6v.4" />
    </Icon>
  );
}

/**
 * Share: the arrow leaving the tray. It is the drawing with which both phone
 * and desktop open the system dialog, so it announces what is going to
 * happen on pressing it better than any other.
 */
export function ShareIcon() {
  return (
    <Icon>
      <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
      <path d="m8 7 4-4 4 4" />
      <path d="M12 3v12" />
    </Icon>
  );
}

/**
 * Move the phone: the device tilted between two waves. It serves for both
 * things the permission unlocks —shaking it to flip the card and tilting it
 * to lean it— without having to choose one of the two.
 */
export function MotionIcon() {
  return (
    <Icon>
      <rect
        x="8.5"
        y="3"
        width="7"
        height="18"
        rx="2"
        transform="rotate(-12 12 12)"
      />
      <path d="M3.6 9.5a7 7 0 0 0 0 5" />
      <path d="M20.4 9.5a7 7 0 0 1 0 5" />
    </Icon>
  );
}

/** Done and not done, with the same stroke: the feedback of the copy buttons. */
export function DoneIcon() {
  return (
    <Icon>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </Icon>
  );
}

export function FailedIcon() {
  return (
    <Icon>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}
