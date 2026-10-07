"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { type ThemeName, CARD } from "@/lib/brand";
import { hasLeftView, readTap, type PointerMark } from "@/lib/card-gestures";
import { entryOffsetY, INTRO_SWAY_END, introSway } from "@/lib/card-intro";
import { cardScale } from "@/lib/card-layout";
import { isShowingBack, pointerTilt, snapToHalfTurn } from "@/lib/card-orientation";
import type { Language } from "@/lib/i18n";
import {
  clamp,
  smoothTowards,
  stepSpring,
  type SmoothConfig,
  type SpringConfig,
  type SpringState,
} from "@/lib/motion";
import { useDeviceTilt } from "@/lib/use-device-tilt";
import { FINE_POINTER, PHONE_LANDSCAPE, useMediaQuery } from "@/lib/use-media-query";
import { useShake } from "@/lib/use-shake";
import { CardMesh } from "./card-mesh";

/** While grabbed, the card follows the pointer closely. */
const GRAB: SpringConfig = { stiffness: 190, damping: 22 };
/** When released it returns to the center with some bounce, as if hanging. */
const RELEASE: SpringConfig = { stiffness: 55, damping: 11 };
const ROTATION: SpringConfig = { stiffness: 80, damping: 15 };
const TILT: SpringConfig = { stiffness: 110, damping: 16 };

/** Radians of turn per unit of pointer travel (which goes from -1 to 1). */
const SPIN_GAIN = 3.4;
/** How much the card tilts when dragged fast. */
const SWAY_GAIN = 0.05;
const MAX_SWAY = 0.45;
const MAX_PITCH = 1.1;
/**
 * Reach of the welcome sway, in card widths. It is measured against the
 * card and not against the screen because the card already scales to the
 * available space: that way the gesture looks just as big on a phone as on
 * a desktop.
 */
const SWAY_REACH = 0.12;

/**
 * Smoothing of the pointer before the card chases it. The mouse is precise
 * and fast, and between one frame and the next it jumps in a way the drag
 * spring repeats as is: the motion looks jerky and the sway, which is
 * computed from the gesture's velocity, twitches. Filtering the pointer
 * fixes both at once, and the gesture still arrives whole where it was going.
 *
 * The half-life is a compromise: below it goes unnoticed and above it the
 * card starts to detach from the cursor. The rest threshold is in pointer
 * coordinates (from -1 to 1, half a screen per unit), so it is under a pixel.
 */
const POINTER_SMOOTHING: SmoothConfig = { halfLife: 0.04, rest: 0.0005 };
/**
 * The unfiltered pointer, which is what the finger and whoever asked for
 * less motion want: with the finger the card is touched, and any lag reads
 * as it detaching from it; touch sampling, besides, already arrives smooth.
 */
const POINTER_DIRECT: SmoothConfig = { halfLife: 0, rest: 0 };

type Mode = "idle" | "move" | "rotate";

type Props = {
  /** Each increment triggers half a turn. It is driven by the UI button. */
  flipCount: number;
  /** Each increment returns the card to its resting position. */
  resetCount: number;
  onFaceChange: (showingBack: boolean) => void;
  onGrabChange: (grabbing: boolean) => void;
  reducedMotion: boolean;
  /** The phone's sensors can be read: the gyroscope and the shakes. */
  motionEnabled: boolean;
  theme: ThemeName;
  language: Language;
};

const spring = (value = 0): SpringState => ({ value, velocity: 0 });

/**
 * Point of the z = 0 plane under the pointer. It is computed by hand instead
 * of with a raycast because during the drag the pointer may be off any
 * object (and even off the canvas, thanks to pointer capture) and the card
 * must still follow it.
 */
function pointerToWorld(
  pointer: THREE.Vector2,
  camera: THREE.Camera,
  out: THREE.Vector3,
): THREE.Vector3 {
  out.set(pointer.x, pointer.y, 0.5).unproject(camera).sub(camera.position);
  if (Math.abs(out.z) < 1e-6) return out.copy(camera.position);
  return out.multiplyScalar(-camera.position.z / out.z).add(camera.position);
}

/**
 * Which finger, where and when the pointer went down. React Three Fiber
 * copies the native event's properties onto the scene event, so these four
 * come straight from it and are measured in screen pixels and milliseconds.
 */
const markOf = (event: ThreeEvent<PointerEvent>): PointerMark => ({
  pointerId: event.pointerId,
  x: event.clientX,
  y: event.clientY,
  time: event.timeStamp,
});

export function DraggableCard({
  flipCount,
  resetCount,
  onFaceChange,
  onGrabChange,
  reducedMotion,
  motionEnabled,
  theme,
  language,
}: Props) {
  // The card scales to the visible space instead of moving the camera: that
  // way it fits with air both on a portrait phone and on a wide screen, and
  // the drag keeps working in world coordinates with no correction.
  const viewport = useThree((state) => state.viewport);
  const phoneLandscape = useMediaQuery(PHONE_LANDSCAPE);
  const scale = cardScale(viewport, CARD, phoneLandscape);
  const half = { width: (CARD.width * scale) / 2, height: (CARD.height * scale) / 2 };
  const finePointer = useMediaQuery(FINE_POINTER);

  const group = useRef<THREE.Group>(null);
  // The card arrives from off-screen: it starts above the edge and the
  // resting spring leaves it at the center. Whoever asks for less motion is
  // shown it already in place.
  const position = useRef({
    x: spring(),
    y: spring(reducedMotion ? 0 : entryOffsetY(viewport.height / 2, half.height)),
  });
  const rotation = useRef({ x: spring(), y: spring(), z: spring() });
  /** Turn accumulated by the user, apart from the resting sway. */
  const spin = useRef({ pitch: 0, turn: 0 });
  const drag = useRef({
    mode: "idle" as Mode,
    grabX: 0,
    grabY: 0,
    lastPointerX: 0,
    lastPointerY: 0,
    targetX: 0,
    targetY: 0,
  });
  /**
   * The smoothed pointer: this one, and not the browser's, is what moves,
   * turns and tilts the card. It keeps being filtered at rest so a gesture
   * starts already up to date instead of dragging along the lag of whatever
   * moved before.
   */
  const pointer = useRef(new THREE.Vector2());
  /**
   * The unfiltered pointer, just as the browser leaves it. The scene always
   * keeps the same vector and rewrites it on every event, so it can be read
   * outside the render loop: on release one needs to know where the gesture
   * really ended, not where the filter was heading.
   */
  const rawPointer = useThree((state) => state.pointer);
  const showingBack = useRef(false);
  /** Tap in progress on the card and last completed tap, for the double tap. */
  const pressed = useRef<PointerMark | null>(null);
  const lastTap = useRef<PointerMark | null>(null);
  const scratch = useRef(new THREE.Vector3());
  const previousFlips = useRef(flipCount);
  const previousResets = useRef(resetCount);
  /**
   * The welcome sway: when the card appeared —set on the first frame, which
   * is when it is seen— and whether it is still due to be shown.
   */
  const intro = useRef({ start: -1, live: true });

  /** Whoever has already touched the card needs no teaching on how to move it. */
  const cancelIntro = useCallback(() => {
    intro.current.live = false;
  }, []);

  /**
   * What the mouse does on a desktop, the gyroscope does on a phone: the card
   * leans towards wherever the device tilts. With a mouse it is not listened
   * to —the card already follows the pointer and the two leans would add
   * up—, and with `prefers-reduced-motion` neither, same as the pointer lean.
   */
  const deviceTilt = useDeviceTilt(motionEnabled && !finePointer && !reducedMotion);

  /**
   * Shaking the phone gives the card half a turn, like the flip button or the
   * double tap. It still works with `prefers-reduced-motion`: it is an action
   * that is asked for, not an animation that starts by itself.
   */
  useShake(motionEnabled, () => {
    spin.current.turn += Math.PI;
    cancelIntro();
  });

  useEffect(() => {
    if (flipCount === previousFlips.current) return;
    spin.current.turn += (flipCount - previousFlips.current) * Math.PI;
    previousFlips.current = flipCount;
    cancelIntro();
  }, [flipCount, cancelIntro]);

  useEffect(() => {
    if (resetCount === previousResets.current) return;
    previousResets.current = resetCount;
    spin.current = { pitch: 0, turn: 0 };
    cancelIntro();
  }, [resetCount, cancelIntro]);

  /**
   * A gesture starts right where the pointer is: the filter is planted on it
   * instead of dragging along whatever lag it had accumulated. Otherwise,
   * moving the mouse fast and pressing would move or turn the card a little
   * on its own, finishing the trip the filter had half-way done.
   */
  const startGesture = (event: ThreeEvent<PointerEvent>) => {
    cancelIntro();
    pointer.current.copy(event.pointer);
    (event.target as Element).setPointerCapture(event.pointerId);
    onGrabChange(true);
  };

  const startMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    startGesture(event);
    pressed.current = markOf(event);
    const current = group.current;
    drag.current.mode = "move";
    drag.current.grabX = event.point.x - (current?.position.x ?? 0);
    drag.current.grabY = event.point.y - (current?.position.y ?? 0);
    // The target starts where the card is: otherwise, grabbing it again in
    // mid-flight makes the first frame measure a jump that never happened
    // and tilts it all at once.
    drag.current.targetX = current?.position.x ?? 0;
    drag.current.targetY = current?.position.y ?? 0;
  };

  const startRotate = (event: ThreeEvent<PointerEvent>) => {
    startGesture(event);
    drag.current.mode = "rotate";
    drag.current.lastPointerX = pointer.current.x;
    drag.current.lastPointerY = pointer.current.y;
  };

  /**
   * End of the gesture, wherever it comes from. It is idempotent on purpose:
   * besides the normal `pointerup`, it is invoked by the gesture's
   * cancellation and by the loss of pointer capture.
   */
  const endDrag = useCallback(() => {
    pressed.current = null;
    if (drag.current.mode === "idle") return;
    if (drag.current.mode === "rotate") {
      // The turn adds up the travel of the smoothed pointer, which lags
      // behind the real one: on release there is always a piece of the
      // gesture left to hand out. It is charged here, before snapping, so the
      // card turns as much as the mouse moved and not less. Without this, a
      // fast turn falls short —at the speed of a flick of the wrist, more
      // than 30°— and snaps to the face it came from: the gesture would seem
      // to have been for nothing.
      spin.current.turn += (rawPointer.x - drag.current.lastPointerX) * SPIN_GAIN;
      // On release, the card snaps to showing a whole face.
      spin.current.turn = snapToHalfTurn(spin.current.turn);
      spin.current.pitch = 0;
    }
    drag.current.mode = "idle";
    onGrabChange(false);
  }, [onGrabChange, rawPointer]);

  const release = (event: ThreeEvent<PointerEvent>) => {
    (event.target as Element).releasePointerCapture(event.pointerId);
    endDrag();
  };

  /**
   * Releasing the card. Besides ending the gesture, it checks whether what
   * just happened is the second of two quick taps: in that case the card
   * flips over. The double tap is recognized here, with the pointer events,
   * and not with `dblclick`, because that event belongs to the mouse: on a
   * phone it does not arrive (and where it does, the browser keeps it for
   * zooming).
   *
   * A single `pointerup` enters here several times, once per mesh of the
   * card the ray goes through, so the tap is consumed on reading: only the
   * first delivery arrives with a mark and counts.
   */
  const releaseCard = (event: ThreeEvent<PointerEvent>) => {
    const down = pressed.current;
    pressed.current = null;
    const reading = readTap(down, markOf(event), lastTap.current);
    lastTap.current = reading.lastTap;
    if (reading.flip) spin.current.turn += Math.PI;
    release(event);
  };

  /**
   * Safety net for the gesture. React Three Fiber does not dispatch
   * `pointercancel` to the objects of the scene (it only uses it to undo the
   * hover), so an interrupted gesture —an incoming call, a system gesture,
   * the pointer leaving along with the capture— would never reach the card's
   * handlers and it would stay stuck to the pointer until the page is
   * reloaded. These two events do always reach the canvas.
   */
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener("pointercancel", endDrag);
    canvas.addEventListener("lostpointercapture", endDrag);
    return () => {
      canvas.removeEventListener("pointercancel", endDrag);
      canvas.removeEventListener("lostpointercapture", endDrag);
    };
  }, [gl, endDrag]);

  useFrame((state, delta) => {
    const current = group.current;
    if (!current) return;

    const dt = Math.min(delta, 0.1);
    const { mode } = drag.current;
    const previousTargetX = drag.current.targetX;

    // The pointer in charge is the smoothed one. From it come the three
    // things that follow the mouse —where the card goes, how much it turns
    // and where it leans—, so smoothing it here smooths them all.
    const smoothing =
      finePointer && !reducedMotion ? POINTER_SMOOTHING : POINTER_DIRECT;
    pointer.current.set(
      smoothTowards(pointer.current.x, state.pointer.x, smoothing, dt),
      smoothTowards(pointer.current.y, state.pointer.y, smoothing, dt),
    );

    if (mode === "move") {
      const world = pointerToWorld(pointer.current, state.camera, scratch.current);
      drag.current.targetX = world.x - drag.current.grabX;
      drag.current.targetY = world.y - drag.current.grabY;
    } else {
      drag.current.targetX = 0;
      drag.current.targetY = 0;
    }

    if (mode === "rotate") {
      const dx = pointer.current.x - drag.current.lastPointerX;
      const dy = pointer.current.y - drag.current.lastPointerY;
      drag.current.lastPointerX = pointer.current.x;
      drag.current.lastPointerY = pointer.current.y;
      spin.current.turn += dx * SPIN_GAIN;
      spin.current.pitch = clamp(
        spin.current.pitch - dy * SPIN_GAIN * 0.6,
        -MAX_PITCH,
        MAX_PITCH,
      );
    }

    // Resting sway: only when nobody is touching the card and if the system
    // has not asked for reduced motion.
    const idle = mode === "idle" && !reducedMotion;
    const t = state.clock.elapsedTime;
    const swayFromDrag =
      mode === "move"
        ? clamp(
            -((drag.current.targetX - previousTargetX) / dt) * SWAY_GAIN,
            -MAX_SWAY,
            MAX_SWAY,
          )
        : 0;

    // Welcome: the card rocks by itself once to show that it moves. It
    // switches off when done and also on the first gesture.
    if (intro.current.start < 0) intro.current.start = t;
    const introElapsed = t - intro.current.start;
    if (introElapsed > INTRO_SWAY_END) intro.current.live = false;
    const welcome = idle && intro.current.live ? introSway(introElapsed) : null;

    // The card leans without leaving its spot, so its volume can be seen:
    // towards wherever the pointer is with a mouse, and towards wherever the
    // device tilts with the gyroscope.
    const tilt = !idle
      ? null
      : finePointer
        ? pointerTilt(pointer.current.x, pointer.current.y)
        : deviceTilt.current;

    const targets = {
      x: drag.current.targetX + (welcome ? welcome.x * CARD.width * scale * SWAY_REACH : 0),
      y: drag.current.targetY + (idle ? Math.sin(t * 0.5) * 0.03 : 0),
      pitch:
        spin.current.pitch + (idle ? Math.sin(t * 0.6) * 0.05 : 0) + (tilt?.pitch ?? 0),
      turn: spin.current.turn + (idle ? Math.sin(t * 0.45) * 0.07 : 0) + (tilt?.turn ?? 0),
      roll: swayFromDrag + (welcome?.roll ?? 0),
    };

    const move = mode === "move" ? GRAB : RELEASE;
    position.current.x = stepSpring(position.current.x, targets.x, move, dt);
    position.current.y = stepSpring(position.current.y, targets.y, move, dt);
    rotation.current.x = stepSpring(rotation.current.x, targets.pitch, ROTATION, dt);
    rotation.current.y = stepSpring(rotation.current.y, targets.turn, ROTATION, dt);
    rotation.current.z = stepSpring(rotation.current.z, targets.roll, TILT, dt);

    current.position.set(position.current.x.value, position.current.y.value, 0);
    current.rotation.set(
      rotation.current.x.value,
      rotation.current.y.value,
      rotation.current.z.value,
    );

    const back = isShowingBack(rotation.current.y.value);
    if (back !== showingBack.current) {
      showingBack.current = back;
      onFaceChange(back);
    }

    // Taking it off the screen is the other way to see its back: when the
    // card leaves the view it is released by itself, and the return spring
    // brings it to the center already turned and untilted, as if just set
    // down.
    if (
      mode === "move" &&
      hasLeftView(
        {
          x: position.current.x.value,
          y: position.current.y.value,
          halfWidth: half.width,
          halfHeight: half.height,
        },
        { halfWidth: viewport.width / 2, halfHeight: viewport.height / 2 },
      )
    ) {
      spin.current.turn = snapToHalfTurn(spin.current.turn) + Math.PI;
      spin.current.pitch = 0;
      endDrag();
    }
  });

  return (
    <>
      {/*
        Background surface: it catches the drags that do not start on the
        card and turns them into rotation. It lives here, next to the rest of
        the interaction, and not in the scene, so as not to split the gesture
        across two places.
      */}
      <mesh position={[0, 0, -4]} onPointerDown={startRotate} onPointerUp={release}>
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group ref={group} onPointerDown={startMove} onPointerUp={releaseCard}>
        <group scale={scale}>
          <CardMesh theme={theme} language={language} />
        </group>
      </group>
    </>
  );
}
