"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { NoToneMapping } from "three";
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
        divide por π: la cara frontal recibe (1,05 + 1,3·0,92 + 0,4·0,59)/π,
        y el mapa de entorno suma el resto hasta rozar 1. Justo lo que hace
        falta para que el crema de la tarjeta salga en su color y no quemado.
      */}
      <ambientLight intensity={1.05} />
      <directionalLight position={[1.6, 2.6, 7]} intensity={1.3} />
      <directionalLight position={[-4, -1, 3]} intensity={0.4} />

      <DraggableCard {...props} />

      {/*
        Reflejos procedimentales: `Environment` con hijos genera el mapa de
        entorno en el propio navegador, sin descargar ningún HDRI.
      */}
      <Environment resolution={256}>
        <Lightformer
          intensity={2}
          position={[0, 3, 4]}
          scale={[8, 3, 1]}
          color="#ffffff"
        />
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
          color="#d9a441"
        />
      </Environment>
    </Canvas>
  );
}
