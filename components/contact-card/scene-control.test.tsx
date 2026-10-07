import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  DetailsIcon,
  DoneIcon,
  FailedIcon,
  FlipIcon,
  MotionIcon,
  RecenterIcon,
  SceneControl,
  ShareIcon,
} from "./scene-control";

/**
 * On a phone the control shows only the icon, so the label is no longer in
 * view and the button is left without a name if nobody provides one
 * separately. That does not show by looking at the screen —the button is
 * still there, with its drawing— and is only noticed with a screen reader or
 * when activating it by voice.
 */

const ICONS = [
  ["flip", <FlipIcon key="flip" />],
  ["recenter", <RecenterIcon key="recenter" />],
  ["show the data", <DetailsIcon key="details" />],
  ["share", <ShareIcon key="share" />],
  // The sensors permission one, which only shows on a phone: that is where
  // the label is never seen and the accessible name is all there is.
  ["use motion", <MotionIcon key="motion" />],
  // The two feedback states of the share control: the label does not change
  // with them, so the button still has a name while the outcome is shown.
  ["share, done", <DoneIcon key="done" />],
  ["share, failed", <FailedIcon key="failed" />],
] as const;

const render = (label: string, icon: ReactNode) =>
  renderToStaticMarkup(<SceneControl label={label} icon={icon} onClick={() => {}} />);

describe("scene control", () => {
  it.each(ICONS)("announces the label of the %s control", (label, icon) => {
    expect(render(label, icon)).toContain(`aria-label="${label}"`);
  });

  it("keeps the label written out for when the screen shows it", () => {
    // The accessible name has to contain the visible text so the button can
    // be activated by voice (WCAG 2.5.3): here they are the same string.
    const markup = render("Recenter", <RecenterIcon />);
    expect(markup).toContain(">Recenter</span>");
    expect(markup).toContain('aria-label="Recenter"');
  });

  it.each(ICONS)("gives the %s icon no voice", (label, icon) => {
    const markup = render(label, icon);
    // The icon repeats what the label already says: announcing it is redundant.
    expect(markup).toContain('<svg aria-hidden="true"');
    expect(markup.match(/aria-hidden="true"/g)).toHaveLength(1);
  });
});
