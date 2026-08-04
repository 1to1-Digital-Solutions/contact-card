"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { BRAND, CARD } from "@/lib/brand";
import { CONTACT } from "@/lib/contact";
import { createBackTexture, createFrontTexture } from "./card-textures";

/** Bisel del canto: da un brillo fino en las aristas, como una tarjeta impresa. */
const BEVEL = 0.004;
/** Separación de las caras respecto al cuerpo, para que no peleen en el z-buffer. */
const FACE_OFFSET = CARD.thickness / 2 + 0.0015;

function roundedRectShape(width: number, height: number, radius: number) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

/**
 * Cuerpo de la tarjeta: un contorno redondeado extruido (el bisel se
 * expande hacia fuera, así que el contorno se dibuja encogido para que las
 * medidas finales sean las de `CARD`) con una cara texturizada a cada lado.
 */
export function CardMesh() {
  const geometry = useMemo(() => {
    const shape = roundedRectShape(
      CARD.width - BEVEL * 2,
      CARD.height - BEVEL * 2,
      CARD.radius - BEVEL,
    );
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: CARD.thickness - BEVEL * 2,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 2,
      curveSegments: 16,
    });
    geo.center();
    return geo;
  }, []);

  const front = useMemo(() => createFrontTexture(CONTACT), []);
  const back = useMemo(() => createBackTexture(CONTACT), []);

  useEffect(() => {
    return () => {
      geometry.dispose();
      front.dispose();
      back.dispose();
    };
  }, [geometry, front, back]);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={BRAND.cardEdge}
          roughness={0.55}
          metalness={0.05}
        />
      </mesh>

      <mesh position={[0, 0, FACE_OFFSET]}>
        <planeGeometry args={[CARD.width, CARD.height]} />
        <meshStandardMaterial
          map={front}
          roughness={0.6}
          metalness={0}
          transparent
          alphaTest={0.5}
        />
      </mesh>

      <mesh position={[0, 0, -FACE_OFFSET]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[CARD.width, CARD.height]} />
        <meshStandardMaterial
          map={back}
          roughness={0.45}
          metalness={0.08}
          transparent
          alphaTest={0.5}
        />
      </mesh>
    </group>
  );
}
