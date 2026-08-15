import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  DetailsIcon,
  DoneIcon,
  FailedIcon,
  FlipIcon,
  MotionIcon,
  RecenterIcon,
  SceneControl,
  ShareIcon,
} from "./scene-control";

/**
 * En un móvil el mando enseña solo el icono, así que el rótulo deja de estar a
 * la vista y el botón se queda sin nombre si nadie lo pone aparte. Eso no se
 * ve mirando la pantalla —el botón sigue ahí, con su dibujo— y solo se nota
 * con un lector de pantalla o al pulsarlo por voz.
 */

const ICONS = [
  ["voltear", <FlipIcon key="flip" />],
  ["recolocar", <RecenterIcon key="recenter" />],
  ["ver los datos", <DetailsIcon key="details" />],
  ["compartir", <ShareIcon key="share" />],
  // El del permiso de los sensores, que solo sale en un móvil: ahí es donde
  // el rótulo no se ve nunca y el nombre accesible es todo lo que hay.
  ["usar el movimiento", <MotionIcon key="motion" />],
  // Los dos avisos del mando de compartir: el rótulo no cambia con ellos, así
  // que el botón sigue teniendo nombre mientras se enseña el resultado.
  ["compartir, hecho", <DoneIcon key="done" />],
  ["compartir, fallido", <FailedIcon key="failed" />],
] as const;

const render = (label: string, icon: ReactNode) =>
  renderToStaticMarkup(<SceneControl label={label} icon={icon} onClick={() => {}} />);

describe("mando de la escena", () => {
  it.each(ICONS)("anuncia el rótulo del mando de %s", (label, icon) => {
    expect(render(label, icon)).toContain(`aria-label="${label}"`);
  });

  it("deja el rótulo escrito para cuando la pantalla lo enseñe", () => {
    // El nombre accesible tiene que contener el texto visible para poder
    // pulsar el botón por voz (WCAG 2.5.3): aquí son la misma cadena.
    const markup = render("Recolocar", <RecenterIcon />);
    expect(markup).toContain(">Recolocar</span>");
    expect(markup).toContain('aria-label="Recolocar"');
  });

  it.each(ICONS)("no le da voz al icono de %s", (label, icon) => {
    const markup = render(label, icon);
    // El icono repite lo que ya dice la etiqueta: anunciarlo sobra.
    expect(markup).toContain('<svg aria-hidden="true"');
    expect(markup.match(/aria-hidden="true"/g)).toHaveLength(1);
  });
});
