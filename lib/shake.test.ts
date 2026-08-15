import { describe, expect, it } from "vitest";
import { STILL, stepShake, type ShakeSample, type ShakeState } from "./shake";

/**
 * Las sacudidas se dan de comer al detector como las daría el sensor: una
 * lectura cada 16 ms (60 por segundo, que es lo que entrega un móvil) y con la
 * gravedad dentro, que es el caso malo. Lo que se comprueba es el trato:
 * agitar da la vuelta a la tarjeta, y llevar el móvil encima, no.
 */

const G = 9.81;
const STEP = 16;

/** Reproduce una tanda de lecturas y devuelve cuándo se dio cada sacudida. */
function play(
  seconds: number,
  acceleration: (t: number) => { x: number; y: number; z: number },
  from: ShakeState = STILL,
): { state: ShakeState; shakes: number[] } {
  let state = from;
  const shakes: number[] = [];
  for (let time = 0; time <= seconds * 1000; time += STEP) {
    const { x, y, z } = acceleration(time / 1000);
    const sample: ShakeSample = { x, y, z, time };
    const step = stepShake(state, sample);
    state = step.state;
    if (step.shaken) shakes.push(time);
  }
  return { state, shakes };
}

/** El móvil en la mano, con la gravedad tirando hacia abajo de la pantalla. */
const held = () => ({ x: 0, y: -G, z: 0 });

/** Agitarlo de lado a lado: unas cuatro idas y venidas por segundo. */
const shaking = (amplitude: number) => (t: number) => ({
  x: amplitude * Math.sin(2 * Math.PI * 4 * t),
  y: -G,
  z: 0,
});

describe("stepShake", () => {
  it("no da la vuelta a la tarjeta con el móvil quieto", () => {
    expect(play(5, held).shakes).toEqual([]);
  });

  it("no la da al girar el móvil despacio", () => {
    // De la vertical a la horizontal en dos segundos: la gravedad cambia de
    // eje entera, y sin el filtro de paso alto eso se leería como un tirón.
    const { shakes } = play(3, (t) => {
      const angle = (Math.min(t, 2) / 2) * (Math.PI / 2);
      return { x: G * Math.sin(angle), y: -G * Math.cos(angle), z: 0 };
    });
    expect(shakes).toEqual([]);
  });

  it("no la da con el traqueteo de andar deprisa", () => {
    // El móvil en la mano bajando unas escaleras o en un coche por adoquines:
    // el traqueteo va a la misma frecuencia que una sacudida y solo se
    // distingue de ella por la fuerza. Es el caso que fija el umbral: con uno
    // más bajo, la tarjeta daría vueltas de camino a ninguna parte.
    const { shakes } = play(6, (t) => ({
      x: 6 * Math.sin(2 * Math.PI * 4 * t),
      y: -G + 2.5 * Math.sin(2 * Math.PI * 4 * t + 1),
      z: 1.5 * Math.sin(2 * Math.PI * 4 * t),
    }));
    expect(shakes).toEqual([]);
  });

  it("no la da con un golpe suelto", () => {
    // Dejar el móvil de golpe sobre la mesa: un solo tirón, y bien fuerte.
    const { shakes } = play(3, (t) => ({
      x: 0,
      y: -G + (t > 1 && t < 1.08 ? 25 : 0),
      z: 0,
    }));
    expect(shakes).toEqual([]);
  });

  it("la da al agitarlo", () => {
    const { shakes } = play(2, shaking(18));
    expect(shakes.length).toBeGreaterThan(0);
    // Antes de un segundo: si hay que agitar más rato, el gesto parece que no
    // funciona y se abandona.
    expect(shakes[0]).toBeLessThan(1000);
  });

  it("no encadena vueltas mientras dura la sacudida", () => {
    // Agitar de verdad son varios segundos seguidos. La tarjeta tiene que dar
    // una vuelta por sacudida, no una por cada tirón.
    const { shakes } = play(5, shaking(18));
    expect(shakes.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < shakes.length; i++) {
      expect(shakes[i] - shakes[i - 1]).toBeGreaterThanOrEqual(1000);
    }
  });

  it("vuelve a responder a la siguiente sacudida", () => {
    // Agitar, parar y volver a agitar da dos vueltas: el reposo no deja la
    // sacudida sorda para siempre.
    const { shakes } = play(6, (t) =>
      t < 1.5 || t > 3.5 ? shaking(18)(t) : held(),
    );
    expect(shakes.length).toBeGreaterThanOrEqual(2);
    expect(shakes.at(-1)).toBeGreaterThan(3500);
  });

  it("no cuenta un tirón que llegue de una pestaña dormida", () => {
    // Al volver en primer plano, la primera lectura llega minutos después de
    // la anterior: la gravedad guardada ya no vale para medir nada.
    const quieta = play(1, held).state;
    const { shaken } = stepShake(quieta, { x: 30, y: 30, z: 30, time: 90_000 });
    expect(shaken).toBe(false);
  });

  it("no se inventa una sacudida con la primera lectura", () => {
    // La gravedad empieza valiendo cero: sin arrancarla con la primera
    // lectura, esos 9,81 se leerían como un tirón.
    expect(stepShake(STILL, { x: 0, y: -G, z: 0, time: 0 }).shaken).toBe(false);
  });
});
