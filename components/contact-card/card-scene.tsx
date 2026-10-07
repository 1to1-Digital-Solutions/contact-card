"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { NoToneMapping } from "three";
import type { ThemeName } from "@/lib/brand";
import { BRAND } from "@/lib/brand";
import type { Language } from "@/lib/i18n";
import { DraggableCard } from "./draggable-card";

type Props = {
  flipCount: number;
  resetCount: number;
  onFaceChange: (showingBack: boolean) => void;
  onGrabChange: (grabbing: boolean) => void;
  reducedMotion: boolean;
  motionEnabled: boolean;
  theme: ThemeName;
  language: Language;
};

/**
 * The card floats over a gradient, not over a floor or a wall: there is no
 * surface on which to cast a shadow that would look believable, so the
 * volume comes from the bevel, the lights and the paper grain. Separation
 * from the background comes from the halo the CSS paints behind it.
 */
export function CardScene(props: Props) {
  return (
    <Canvas
      // The background is set by the page's CSS: that way the gradient is
      // already there while the scene loads and there is no color jump when
      // it appears. Without tone mapping the card's colors come out exactly
      // as the brand defines them; in exchange, the lights have to add up to
      // about 1 on the front face so as not to burn it out.
      gl={{ antialias: true, alpha: true, toneMapping: NoToneMapping }}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5.2], fov: 32 }}
    >
      {/*
        The intensities look high because three's diffuse reflection divides
        by π; between the three lights and the environment map, the front
        face receives a little under 1. It was measured against the worst
        case, which is the white paper of the light theme: above that it
        saturates and the grain and the watermark are lost, below it goes
        gray. If they are touched, it has to be measured again (a capture of
        the scene and the percentage of pixels at 255 in a flat area of the
        card).
      */}
      <ambientLight intensity={0.82} />
      <directionalLight position={[1.6, 2.6, 7]} intensity={0.92} />
      <directionalLight position={[-4, -1, 3]} intensity={0.3} />

      <DraggableCard {...props} />

      {/*
        Procedural reflections: `Environment` with children generates the
        environment map in the browser itself, without downloading any HDRI.
        With the matte paper they are barely reflected: what they contribute
        is the color of the surroundings on the edge.
      */}
      <Environment resolution={256}>
        <Lightformer
          intensity={0.9}
          position={[0, 3, 4]}
          scale={[8, 3, 1]}
          color="#ffffff"
        />
        {/*
          Overhead white and cold fill: they are studio light, not brand
          colors, which is why they do not come from `BRAND`. The only one
          that is brand is the accent, which tints the reflection on the
          right edge.
        */}
        <Lightformer
          intensity={0.5}
          position={[-4, 1, 2]}
          scale={[4, 6, 1]}
          color="#8ea3c4"
        />
        <Lightformer
          intensity={0.45}
          position={[4, -2, 2]}
          scale={[4, 4, 1]}
          color={BRAND.accent}
        />
      </Environment>
    </Canvas>
  );
}
