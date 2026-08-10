"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { type ThemeName, CARD, THEMES } from "@/lib/brand";
import { CONTACT, contactIn } from "@/lib/contact";
import { dictionary } from "@/lib/dictionary";
import type { Language } from "@/lib/i18n";
import {
  createBackTexture,
  createFrontTexture,
  createGrainTexture,
} from "./card-textures";

/** Bisel del canto: da un brillo fino en las aristas, como una tarjeta impresa. */
const BEVEL = 0.004;
/** Separación de las caras respecto al cuerpo, para que no peleen en el z-buffer. */
const FACE_OFFSET = CARD.thickness / 2 + 0.0015;
/**
 * Papel mate, no plástico: casi toda la luz se dispersa y el relieve del
 * grano rompe lo poco que queda de reflejo. El relieve va muy bajo a
 * propósito —es la rugosidad del papel, no un repujado—.
 */
const PAPER = { roughness: 0.94, metalness: 0, bumpScale: 0.018 } as const;

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
 *
 * El cuerpo va del color del canto del tema, un escalón del de las caras: es
 * lo que asoma por las esquinas redondeadas, donde la textura ya es
 * transparente. Con un color ajeno a la cara —como era el canto claro de
 * cuando el anverso y el reverso no coincidían— las esquinas del reverso se
 * veían encendidas.
 */
export function CardMesh({
  theme,
  language,
}: {
  theme: ThemeName;
  language: Language;
}) {
  const palette = THEMES[theme];

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

  const grain = useMemo(() => createGrainTexture(), []);
  // El anverso lleva el cargo y los rótulos de los datos: se rehace al cambiar
  // de idioma. El reverso solo lleva el logotipo y la web, que no se traducen.
  const front = useMemo(
    () =>
      createFrontTexture(
        contactIn(language),
        palette,
        theme,
        dictionary(language).fields,
      ),
    [palette, theme, language],
  );
  const back = useMemo(() => createBackTexture(CONTACT, palette), [palette]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => grain.dispose(), [grain]);
  // Las caras se rehacen al cambiar de tema o de idioma: hay que soltar las
  // anteriores.
  useEffect(() => () => front.dispose(), [front]);
  useEffect(() => () => back.dispose(), [back]);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial color={palette.cardEdge} bumpMap={grain} {...PAPER} />
      </mesh>

      <mesh position={[0, 0, FACE_OFFSET]}>
        <planeGeometry args={[CARD.width, CARD.height]} />
        <meshStandardMaterial
          map={front}
          bumpMap={grain}
          transparent
          alphaTest={0.5}
          {...PAPER}
        />
      </mesh>

      <mesh position={[0, 0, -FACE_OFFSET]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[CARD.width, CARD.height]} />
        <meshStandardMaterial
          map={back}
          bumpMap={grain}
          transparent
          alphaTest={0.5}
          {...PAPER}
        />
      </mesh>
    </group>
  );
}
