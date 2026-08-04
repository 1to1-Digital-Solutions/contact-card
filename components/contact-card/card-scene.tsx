"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { NoToneMapping } from "three";
import { BRAND } from "@/lib/brand";
import { DraggableCard } from "./draggable-card";

type Props = {
  flipCount: number;
  resetCount: number;
  onFaceChange: (showingBack: boolean) => void;
  onGrabChange: (grabbing: boolean) => void;
  reducedMotion: boolean;
};

/**
 * La tarjeta flota sobre un degradado, no sobre un suelo ni una pared: no
 * hay superficie donde proyectar una sombra que resulte creíble, así que
 * el volumen lo dan el bisel, las luces y los reflejos del entorno. La
 * separación del fondo la aporta el halo que pinta el CSS detrás.
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
        frontal recibe algo menos de 1. Es el punto en el que el claro del
        anverso sale justo en su color: por encima se satura a blanco y se
        pierden el relieve y la marca de agua, por debajo se agrisa. Si se
        tocan, hay que volver a medirlo (una captura de la escena y el
        porcentaje de píxeles a 255 en una zona lisa de la tarjeta).
      */}
      <ambientLight intensity={0.95} />
      <directionalLight position={[1.6, 2.6, 7]} intensity={1.13} />
      <directionalLight position={[-4, -1, 3]} intensity={0.34} />

      <DraggableCard {...props} />

      {/*
        Reflejos procedimentales: `Environment` con hijos genera el mapa de
        entorno en el propio navegador, sin descargar ningún HDRI.
      */}
      <Environment resolution={256}>
        <Lightformer
          intensity={1.7}
          position={[0, 3, 4]}
          scale={[8, 3, 1]}
          color="#ffffff"
        />
        {/*
          Blanco cenital y relleno frío: son luz de estudio, no colores de
          marca, y por eso no salen de `BRAND` (medido: dejan el anverso en
          su color, a ±2 niveles de `cardFront`). El único que sí es de
          marca es el acento, que tiñe el reflejo del canto derecho.
        */}
        <Lightformer
          intensity={0.8}
          position={[-4, 1, 2]}
          scale={[4, 6, 1]}
          color="#8ea3c4"
        />
        <Lightformer
          intensity={0.6}
          position={[4, -2, 2]}
          scale={[4, 4, 1]}
          color={BRAND.accent}
        />
      </Environment>
    </Canvas>
  );
}
