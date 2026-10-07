"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallback: ReactNode };
type State = { failed: boolean };

/**
 * If the 3D scene blows up while mounting (driver, WebGL context lost while
 * creating the textures…), the page shows the flat card instead of staying
 * blank.
 */
export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Could not mount the 3D card:", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
