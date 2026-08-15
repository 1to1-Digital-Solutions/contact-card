import { describe, expect, it } from "vitest";
import { TILT_REACH } from "./card-orientation";
import { screenAngles, stepDeviceTilt, type DeviceAngles, type TiltState } from "./device-tilt";

/** Reproduce una tanda de lecturas del sensor, una cada 16 ms. */
function play(
  seconds: number,
  angles: (t: number) => DeviceAngles,
  from: TiltState = null,
  start = 0,
) {
  let state = from;
  let tilt = { turn: 0, pitch: 0 };
  for (let time = start; time <= start + seconds * 1000; time += 16) {
    const step = stepDeviceTilt(state, { angles: angles((time - start) / 1000), time });
    state = step.state;
    tilt = step.tilt;
  }
  return { state, tilt };
}

/** El móvil sostenido en la mano, mirando a quien lo lleva. */
const HELD: DeviceAngles = { beta: 42, gamma: 0 };

describe("screenAngles", () => {
  it("con el móvil de pie deja los ángulos como vienen", () => {
    expect(screenAngles({ beta: 30, gamma: -12 }, 0)).toEqual({ beta: 30, gamma: -12 });
  });

  it("con el móvil apaisado cambia los ejes de sitio", () => {
    // A 90° el borde derecho del aparato mira hacia arriba de la pantalla: lo
    // que era cabeceo pasa a ser alabeo y al revés, con el signo del giro.
    const izquierda = screenAngles({ beta: 30, gamma: -12 }, 90);
    expect(izquierda.beta).toBeCloseTo(12, 10);
    expect(izquierda.gamma).toBeCloseTo(30, 10);

    const derecha = screenAngles({ beta: 30, gamma: -12 }, 270);
    expect(derecha.beta).toBeCloseTo(-12, 10);
    expect(derecha.gamma).toBeCloseTo(-30, 10);
  });

  it("con el móvil del revés invierte los dos", () => {
    const angles = screenAngles({ beta: 30, gamma: -12 }, 180);
    expect(angles.beta).toBeCloseTo(-30, 10);
    expect(angles.gamma).toBeCloseTo(12, 10);
  });
});

describe("stepDeviceTilt", () => {
  it("no mueve nada con la primera lectura", () => {
    // La postura de partida es como se sostenga el móvil al abrir la página:
    // en el sofá, en la cama o sobre la mesa, la tarjeta sale de frente.
    const { tilt } = stepDeviceTilt(null, { angles: HELD, time: 0 });
    expect(tilt).toEqual({ turn: 0, pitch: 0 });
  });

  it("gira la tarjeta al revés que el móvil", () => {
    // Inclinar el móvil hacia la derecha deja ver la tarjeta por su lado
    // izquierdo, como si estuviera quieta detrás del cristal.
    const inicio = stepDeviceTilt(null, { angles: HELD, time: 0 }).state;
    const { tilt } = stepDeviceTilt(inicio, {
      angles: { beta: HELD.beta, gamma: 10 },
      time: 100,
    });
    expect(tilt.turn).toBeLessThan(0);
  });

  it("cabecea al revés que el móvil", () => {
    // Levantar el borde de arriba aleja ese mismo borde de la tarjeta.
    const inicio = stepDeviceTilt(null, { angles: HELD, time: 0 }).state;
    const { tilt } = stepDeviceTilt(inicio, {
      angles: { beta: HELD.beta + 10, gamma: 0 },
      time: 100,
    });
    expect(tilt.pitch).toBeLessThan(0);
  });

  it("se queda en un asomo por mucho que se incline el móvil", () => {
    // Se suma al giro que pide quien mira, así que no puede acabar
    // enseñándole el canto de la tarjeta.
    const inicio = stepDeviceTilt(null, { angles: { beta: 0, gamma: 0 }, time: 0 }).state;
    const { tilt } = stepDeviceTilt(inicio, {
      angles: { beta: -80, gamma: 85 },
      time: 100,
    });
    expect(Math.abs(tilt.turn)).toBeCloseTo(TILT_REACH.turn, 10);
    expect(Math.abs(tilt.pitch)).toBeCloseTo(TILT_REACH.pitch, 10);
  });

  it("olvida la postura que se sostiene", () => {
    // Mirar el móvil recostado no puede dejar la tarjeta torcida el resto de
    // la visita: el asomo se apaga solo si nadie mueve nada.
    const { tilt } = play(8, (t) => ({ beta: t < 0.5 ? 0 : 25, gamma: 0 }));
    expect(Math.abs(tilt.pitch)).toBeLessThan(TILT_REACH.pitch / 10);
  });

  it("sigue respondiendo después de olvidarla", () => {
    const quieta = play(8, () => ({ beta: 25, gamma: 0 })).state;
    const { tilt } = stepDeviceTilt(quieta, {
      angles: { beta: 25, gamma: -15 },
      time: 8_016,
    });
    expect(tilt.turn).toBeGreaterThan(0);
  });

  it("no vuelca la tarjeta al pasar el móvil por la vertical", () => {
    // El cabeceo salta de 180 a -180 ahí: restando sin más, ese salto se
    // leería como media vuelta de golpe.
    const inicio = stepDeviceTilt(null, { angles: { beta: 179, gamma: 0 }, time: 0 }).state;
    const { tilt } = stepDeviceTilt(inicio, { angles: { beta: -179, gamma: 0 }, time: 100 });
    expect(Math.abs(tilt.pitch)).toBeLessThan(TILT_REACH.pitch / 5);
  });

  it("vuelve a empezar tras una pestaña dormida", () => {
    // Al volver, el móvil está donde esté: medirlo contra la postura de hace
    // unos minutos daría un asomo al tope sin que nadie haya movido nada.
    const inicio = stepDeviceTilt(null, { angles: HELD, time: 0 }).state;
    const { tilt } = stepDeviceTilt(inicio, {
      angles: { beta: 0, gamma: 60 },
      time: 120_000,
    });
    expect(tilt).toEqual({ turn: 0, pitch: 0 });
  });
});
