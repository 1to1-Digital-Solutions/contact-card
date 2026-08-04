"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallback: ReactNode };
type State = { failed: boolean };

/**
 * Si la escena 3D revienta al montarse (driver, contexto WebGL perdido al
 * crear las texturas…), la página enseña la tarjeta plana en lugar de
 * quedarse en blanco.
 */
export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("No se pudo montar la tarjeta en 3D:", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
