import { describe, expect, it, vi } from "vitest";
import { CONTACT } from "./contact";
import { dictionary } from "./dictionary";
import { LANGUAGES } from "./i18n";
import { shareCard, type ShareTarget, type ShareTools, shareTarget } from "./share";
import { SITE_URL } from "./site";

/**
 * Tres caminos y ninguno se puede probar en un navegador de verdad: el diálogo
 * del sistema no se abre sin un gesto humano y no se puede cancelar desde un
 * test. Por eso `shareCard` recibe lo que usa en vez de ir a buscarlo.
 */

const TARGET: ShareTarget = { title: "Tarjeta", url: "https://ejemplo.test" };

/** Las herramientas del navegador, todas espiadas y con el diálogo puesto. */
function toolsWith(overrides: Partial<ShareTools> = {}) {
  return {
    share: vi.fn(async () => {}),
    copy: vi.fn(async () => {}),
    warn: vi.fn(),
    ...overrides,
  } satisfies ShareTools;
}

/** Cancelar el diálogo llega así desde el navegador. */
const dismissal = () => new DOMException("Share canceled", "AbortError");

describe("shareCard", () => {
  it("usa el diálogo del sistema cuando el navegador lo trae", async () => {
    const tools = toolsWith();

    await expect(shareCard(TARGET, tools)).resolves.toBe("shared");
    expect(tools.share).toHaveBeenCalledWith(TARGET);
    expect(tools.copy).not.toHaveBeenCalled();
    expect(tools.warn).not.toHaveBeenCalled();
  });

  it("copia el enlace cuando no hay diálogo del sistema", async () => {
    const tools = toolsWith({ share: undefined });

    await expect(shareCard(TARGET, tools)).resolves.toBe("copied");
    expect(tools.copy).toHaveBeenCalledWith(TARGET.url);
    expect(tools.warn).not.toHaveBeenCalled();
  });

  it("no cuenta como fallo cerrar el diálogo sin compartir", async () => {
    const tools = toolsWith({ share: vi.fn(async () => Promise.reject(dismissal())) });

    await expect(shareCard(TARGET, tools)).resolves.toBe("dismissed");
    // Ni aviso de error ni copia a la espalda: quien cancela quiere quedarse
    // como estaba, no acabar con el enlace en el portapapeles.
    expect(tools.warn).not.toHaveBeenCalled();
    expect(tools.copy).not.toHaveBeenCalled();
  });

  it("cae en copiar el enlace si el diálogo del sistema revienta", async () => {
    const broken = new TypeError("share no disponible aquí");
    const tools = toolsWith({ share: vi.fn(async () => Promise.reject(broken)) });

    await expect(shareCard(TARGET, tools)).resolves.toBe("copied");
    expect(tools.copy).toHaveBeenCalledWith(TARGET.url);
    expect(tools.warn).toHaveBeenCalledWith(broken);
  });

  it("avisa cuando tampoco se puede copiar", async () => {
    const denied = new Error("portapapeles bloqueado");
    const tools = toolsWith({ share: undefined, copy: vi.fn(async () => Promise.reject(denied)) });

    await expect(shareCard(TARGET, tools)).resolves.toBe("failed");
    expect(tools.warn).toHaveBeenCalledWith(denied);
  });
});

describe("shareTarget", () => {
  it.each(LANGUAGES)("manda la dirección canónica del sitio en %s", (language) => {
    // No `location.href`: al enlace de la barra le sobran los parámetros de
    // campaña y el `#` con los que se haya llegado hasta aquí.
    expect(shareTarget(language).url).toBe(SITE_URL);
  });

  it.each(LANGUAGES)("titula la tarjeta con el texto de %s", (language) => {
    expect(shareTarget(language).title).toBe(
      dictionary(language).meta.title(CONTACT.name),
    );
  });

  it("dice el título en el idioma que se está viendo", () => {
    const titles = LANGUAGES.map((language) => shareTarget(language).title);
    expect(new Set(titles).size).toBe(LANGUAGES.length);
    for (const title of titles) expect(title).toContain(CONTACT.name);
  });
});
