"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { NoToneMapping } from "three";
import type { ThemeName } from "@/lib/brand";
import { BRAND } from "@/lib/brand";
import { DraggableCard } from "./draggable-card";

type Props = {
  flipCount: number;
  resetCount: number;
  onFaceChange: (showingBack: boolean) => void;
  onGrabChange: (grabbing: boolean) => void;
  reducedMotion: boolean;
  theme: ThemeName;
};

/**
 * La tarjeta flota sobre un degradado, no sobre un suelo ni una pared: no
 * hay superficie donde proyectar una sombra que resulte creíble, así que
 * el volumen lo dan el bisel, las luces y el grano del papel. La separación
 * del fondo la aporta el halo que pinta el CSS detrás.
 */
export function CardScene(props: Props) {
  return (
    <Canvas
      // El fondo lo pone el CSS de la página: así el degradado sigue ahí
      // mientras la escena carga y no hay salto de color al aparecer.
      // Sin tone mapping los colores de la tarjeta salen tal cual se
      // definen en la marca; a cambio, las luces tienen que sumar cerca de
      // 1 en la cara frontal para no quemarla.
      gl={{ antialias: true, alpha: true, toneMapping: NoToneMapping }}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5.2], fov: 32 }}
    >
      {/*
        Las intensidades parecen altas porque la reflexión difusa de three
        divide por π; entre las tres luces y el mapa de entorno, la cara
        frontal recibe algo menos de 1. Está medido con el peor caso, que es
        el papel blanco del tema claro: por encima se satura y se pierden el
        grano y la marca de agua, por debajo se agrisa. Si se tocan, hay que
        volver a medirlo (una captura de la escena y el porcentaje de píxeles
        a 255 en una zona lisa de la tarjeta).
      */}
      <ambientLight intensity={0.82} />
      <directionalLight position={[1.6, 2.6, 7]} intensity={0.92} />
      <directionalLight position={[-4, -1, 3]} intensity={0.3} />

      <DraggableCard {...props} />

      {/*
        Reflejos procedimentales: `Environment` con hijos genera el mapa de
        entorno en el propio navegador, sin descargar ningún HDRI. Con el
        papel mate casi no se reflejan: lo que aportan es el color del
        ambiente sobre el canto.
      */}
      <Environment resolution={256}>
        <Lightformer
          intensity={0.9}
          position={[0, 3, 4]}
          scale={[8, 3, 1]}
          color="#ffffff"
        />
        {/*
          Blanco cenital y relleno frío: son luz de estudio, no colores de
          marca, y por eso no salen de `BRAND`. El único que sí es de marca es
          el acento, que tiñe el reflejo del canto derecho.
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
