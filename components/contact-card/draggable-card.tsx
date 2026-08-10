"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { type ThemeName, CARD } from "@/lib/brand";
import { isShowingBack, snapToHalfTurn } from "@/lib/card-orientation";
import type { Language } from "@/lib/i18n";
import { clamp, stepSpring, type SpringConfig, type SpringState } from "@/lib/motion";
import { CardMesh } from "./card-mesh";

/** Mientras se agarra, la tarjeta persigue al puntero de cerca. */
const GRAB: SpringConfig = { stiffness: 190, damping: 22 };
/** Al soltarla vuelve al centro con algo de rebote, como si colgara. */
const RELEASE: SpringConfig = { stiffness: 55, damping: 11 };
const ROTATION: SpringConfig = { stiffness: 80, damping: 15 };
const TILT: SpringConfig = { stiffness: 110, damping: 16 };

/** Radianes de giro por cada unidad de recorrido del puntero (que va de -1 a 1). */
const SPIN_GAIN = 3.4;
/**
 * Parte del ancho y del alto visibles que ocupa la tarjeta en reposo. En un
 * hueco más alto que ancho —un móvil de pie— el ancho es el recurso escaso y
 * sobra alto: ahí la tarjeta se estira casi de borde a borde para no perder
 * protagonismo.
 */
const SHARE = {
  landscape: { width: 0.62, height: 0.55 },
  portrait: { width: 0.9, height: 0.6 },
} as const;
const MIN_SCALE = 0.25;
const MAX_SCALE = 1.15;
/** Cuánto se inclina la tarjeta al arrastrarla rápido. */
const SWAY_GAIN = 0.05;
const MAX_SWAY = 0.45;
const MAX_PITCH = 1.1;

type Mode = "idle" | "move" | "rotate";

type Props = {
  /** Cada incremento provoca media vuelta. Lo controla el botón de la interfaz. */
  flipCount: number;
  /** Cada incremento devuelve la tarjeta a su posición de reposo. */
  resetCount: number;
  onFaceChange: (showingBack: boolean) => void;
  onGrabChange: (grabbing: boolean) => void;
  reducedMotion: boolean;
  theme: ThemeName;
  language: Language;
};

const spring = (value = 0): SpringState => ({ value, velocity: 0 });

/**
 * Punto del plano z = 0 que hay bajo el puntero. Se calcula a mano en vez
 * de con un raycast porque durante el arrastre el puntero puede estar
 * fuera de cualquier objeto (e incluso fuera del canvas, gracias a la
 * captura de puntero) y aun así la tarjeta debe seguirlo.
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

export function DraggableCard({
  flipCount,
  resetCount,
  onFaceChange,
  onGrabChange,
  reducedMotion,
  theme,
  language,
}: Props) {
  // La tarjeta se escala al hueco visible en lugar de mover la cámara: así
  // cabe con aire tanto en un móvil vertical como en una pantalla ancha, y
  // el arrastre sigue trabajando en coordenadas de mundo sin corrección.
  const viewport = useThree((state) => state.viewport);
  const share =
    viewport.height > viewport.width ? SHARE.portrait : SHARE.landscape;
  const scale = clamp(
    Math.min(
      (viewport.width * share.width) / CARD.width,
      (viewport.height * share.height) / CARD.height,
    ),
    MIN_SCALE,
    MAX_SCALE,
  );

  const group = useRef<THREE.Group>(null);
  const position = useRef({ x: spring(), y: spring() });
  const rotation = useRef({ x: spring(), y: spring(), z: spring() });
  /** Giro acumulado por el usuario, aparte del vaivén en reposo. */
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
  const showingBack = useRef(false);
  const scratch = useRef(new THREE.Vector3());
  const previousFlips = useRef(flipCount);
  const previousResets = useRef(resetCount);

  useEffect(() => {
    spin.current.turn += (flipCount - previousFlips.current) * Math.PI;
    previousFlips.current = flipCount;
  }, [flipCount]);

  useEffect(() => {
    if (resetCount === previousResets.current) return;
    previousResets.current = resetCount;
    spin.current = { pitch: 0, turn: 0 };
  }, [resetCount]);

  const startMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    (event.target as Element).setPointerCapture(event.pointerId);
    const current = group.current;
    drag.current.mode = "move";
    drag.current.grabX = event.point.x - (current?.position.x ?? 0);
    drag.current.grabY = event.point.y - (current?.position.y ?? 0);
    // El objetivo arranca donde está la tarjeta: si no, al reagarrarla en
    // pleno vuelo el primer frame mide un salto que no ha existido y la
    // inclina de golpe.
    drag.current.targetX = current?.position.x ?? 0;
    drag.current.targetY = current?.position.y ?? 0;
    onGrabChange(true);
  };

  const startRotate = (event: ThreeEvent<PointerEvent>) => {
    (event.target as Element).setPointerCapture(event.pointerId);
    drag.current.mode = "rotate";
    drag.current.lastPointerX = event.pointer.x;
    drag.current.lastPointerY = event.pointer.y;
    onGrabChange(true);
  };

  /**
   * Fin del gesto, venga de donde venga. Es idempotente a propósito: además
   * del `pointerup` normal lo invocan la cancelación del gesto y la pérdida
   * de la captura del puntero.
   */
  const endDrag = useCallback(() => {
    if (drag.current.mode === "idle") return;
    if (drag.current.mode === "rotate") {
      // Al soltar, la tarjeta encaja mostrando una cara entera.
      spin.current.turn = snapToHalfTurn(spin.current.turn);
      spin.current.pitch = 0;
    }
    drag.current.mode = "idle";
    onGrabChange(false);
  }, [onGrabChange]);

  const release = (event: ThreeEvent<PointerEvent>) => {
    (event.target as Element).releasePointerCapture(event.pointerId);
    endDrag();
  };

  /**
   * Red de seguridad del gesto. React Three Fiber no reparte `pointercancel`
   * entre los objetos de la escena (solo lo usa para deshacer el hover), así
   * que un gesto interrumpido —una llamada entrante, un gesto del sistema,
   * el puntero que se va con la captura— nunca llegaría a los manejadores de
   * la tarjeta y esta se quedaría pegada al puntero hasta recargar la página.
   * Estos dos eventos sí llegan siempre al canvas.
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

    if (mode === "move") {
      const world = pointerToWorld(state.pointer, state.camera, scratch.current);
      drag.current.targetX = world.x - drag.current.grabX;
      drag.current.targetY = world.y - drag.current.grabY;
    } else {
      drag.current.targetX = 0;
      drag.current.targetY = 0;
    }

    if (mode === "rotate") {
      const dx = state.pointer.x - drag.current.lastPointerX;
      const dy = state.pointer.y - drag.current.lastPointerY;
      drag.current.lastPointerX = state.pointer.x;
      drag.current.lastPointerY = state.pointer.y;
      spin.current.turn += dx * SPIN_GAIN;
      spin.current.pitch = clamp(
        spin.current.pitch - dy * SPIN_GAIN * 0.6,
        -MAX_PITCH,
        MAX_PITCH,
      );
    }

    // Vaivén de reposo: solo cuando nadie toca la tarjeta y si el sistema
    // no ha pedido reducir el movimiento.
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

    const targets = {
      x: drag.current.targetX,
      y: drag.current.targetY + (idle ? Math.sin(t * 0.5) * 0.03 : 0),
      pitch: spin.current.pitch + (idle ? Math.sin(t * 0.6) * 0.05 : 0),
      turn: spin.current.turn + (idle ? Math.sin(t * 0.45) * 0.07 : 0),
      roll: swayFromDrag,
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
  });

  return (
    <>
      {/*
        Superficie de fondo: recoge los arrastres que no empiezan sobre la
        tarjeta y los convierte en giro. Vive aquí, junto al resto de la
        interacción, y no en la escena, para no repartir el gesto en dos sitios.
      */}
      <mesh position={[0, 0, -4]} onPointerDown={startRotate} onPointerUp={release}>
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group
        ref={group}
        onPointerDown={startMove}
        onPointerUp={release}
        onDoubleClick={(event) => {
          event.stopPropagation();
          spin.current.turn += Math.PI;
        }}
      >
        <group scale={scale}>
          <CardMesh theme={theme} language={language} />
        </group>
      </group>
    </>
  );
}
