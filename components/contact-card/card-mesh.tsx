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

/** Edge bevel: gives a fine highlight along the edges, like a printed card. */
const BEVEL = 0.004;
/** Offset of the faces from the body, so they do not fight in the z-buffer. */
const FACE_OFFSET = CARD.thickness / 2 + 0.0015;
/**
 * Matte paper, not plastic: almost all the light scatters and the grain's
 * relief breaks what little reflection remains. The relief is kept very low
 * on purpose —it is the paper's roughness, not an embossing—.
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
 * Card body: a rounded outline, extruded (the bevel expands outwards, so the
 * outline is drawn shrunk so that the final dimensions are those of `CARD`),
 * with a textured face on each side.
 *
 * The body takes the theme's edge color, one step away from the faces': it
 * is what shows through at the rounded corners, where the texture is already
 * transparent. With a color foreign to the face —as the light edge was back
 * when the front and the back did not match— the corners of the back looked
 * lit up.
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
  // The front carries the job title and the data labels: it is rebuilt when
  // the language changes. The back only carries the logo and the website,
  // which are not translated.
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
  // The faces are rebuilt when the theme or the language changes: the
  // previous ones have to be released.
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
