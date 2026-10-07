import type { Language } from "./i18n";

/**
 * Every interface text, in one place and per language. The contact details
 * do not live here: they come from `lib/contact.ts`, which is their source of
 * truth and only translates the job title.
 *
 * Strings with a slot are functions instead of templates with placeholders:
 * that way the compiler forces the caller to pass what is missing and there
 * is no need to invent a substitution helper. The `console` messages are not
 * here on purpose: they are for diagnosing, not for reading.
 */
export type Dictionary = {
  meta: {
    title: (name: string) => string;
    description: (name: string, company: string) => string;
  };
  language: {
    /** What the switch shows: the language it leads to, abbreviated. */
    code: string;
    /**
     * Accessible label of the switch, written in the target language so that
     * someone who cannot read the page's language understands it. It must
     * contain `code`: a control's accessible name must include its visible
     * text so it can be activated by voice (WCAG 2.5.3), and
     * `dictionary.test.ts` checks it.
     */
    switchTo: string;
  };
  theme: {
    toLight: string;
    toDark: string;
  };
  scene: {
    label: string;
    loading: string;
    hint: string;
    /**
     * The same hint for a narrow screen, where the long text eats two or
     * three lines the card needs. `dictionary.test.ts` pins its length limit:
     * if it grows, it no longer fits on one line.
     */
    hintShort: string;
    /**
     * The short hint when the phone moves the card: with sensors, shaking it
     * is the fastest way to flip it, and nobody discovers that on their own.
     * Same length limit as `hintShort`.
     */
    hintMotion: string;
    /** The browser cannot do 3D: the flat card is shown. */
    noWebgl: string;
    /** The 3D scene blew up while mounting: the same flat card. */
    failed: string;
    showingFront: string;
    showingBack: string;
  };
  controls: {
    showFront: string;
    showBack: string;
    reset: string;
    showData: string;
    share: string;
    /**
     * Grants the page permission to read the phone's sensors. It only appears
     * where the browser demands it, and only grants it when pressed.
     */
    useMotion: string;
    /** Labels of the flat card, which is flipped by pressing it. */
    flipToFront: string;
    flipToBack: string;
  };
  /** Labels of the details: they serve both the panel and the card face. */
  fields: {
    jobTitle: string;
    /** Heads the line about what the business does, which only appears in the panel. */
    services: string;
    email: string;
    phone: string;
    website: string;
  };
  panel: {
    title: string;
    close: string;
    save: string;
    /**
     * Accessible name of the link to a profile: the network's name is not
     * translated, but saying what the link is for is. It also carries the
     * visible address because a link's accessible name must contain its
     * visible text (WCAG 2.5.3), and `dictionary.test.ts` checks it.
     */
    profile: (network: string, address: string) => string;
  };
  copy: {
    action: (field: string) => string;
    done: (field: string) => string;
    failed: (field: string) => string;
    /**
     * What the card's link is called in those notices. Sharing without the
     * system dialog ends up copying it, and then it is confirmed like any
     * other detail: with `done` and with this label.
     */
    link: string;
  };
};

const es: Dictionary = {
  meta: {
    title: (name) => `${name} — Tarjeta de contacto`,
    description: (name, company) =>
      `Tarjeta de contacto interactiva de ${name}, de ${company}: arrástrala, gírala y guarda los datos en tu agenda.`,
  },
  language: {
    code: "ES",
    switchTo: "Cambiar a español",
  },
  theme: {
    toLight: "Cambiar al tema claro",
    toDark: "Cambiar al tema oscuro",
  },
  scene: {
    label: "Tarjeta de contacto interactiva",
    loading: "Cargando la tarjeta…",
    hint:
      "Arrastra la tarjeta para moverla y el fondo para girarla. Dale dos toques, o sácala de la pantalla, y se da la vuelta.",
    hintShort: "Arrástrala. Dos toques le dan la vuelta.",
    hintMotion: "Arrástrala. Agítalo y se da la vuelta.",
    noWebgl:
      "Tu navegador no puede mostrar gráficos 3D, así que esta es la versión plana. Pulsa la tarjeta para darle la vuelta.",
    failed:
      "No hemos podido cargar la tarjeta en 3D. Aquí tienes la versión plana: pulsa para darle la vuelta.",
    showingFront: "La tarjeta muestra el anverso.",
    showingBack: "La tarjeta muestra el reverso.",
  },
  controls: {
    showFront: "Ver el anverso",
    showBack: "Ver el reverso",
    reset: "Recolocar",
    showData: "Ver los datos",
    share: "Compartir",
    useMotion: "Usar el movimiento",
    flipToFront: "Ver el anverso de la tarjeta",
    flipToBack: "Ver el reverso de la tarjeta",
  },
  fields: {
    jobTitle: "Cargo",
    services: "Servicios",
    email: "Email",
    phone: "Teléfono",
    website: "Web",
  },
  panel: {
    title: "Datos de contacto",
    close: "Cerrar los datos de contacto",
    save: "Guardar contacto (.vcf)",
    profile: (network, address) => `Perfil de ${network}: ${address}`,
  },
  copy: {
    action: (field) => `Copiar ${field.toLowerCase()}`,
    // The label goes after the participle, not before it: Spanish field
    // names come in masculine («Cargo», «Teléfono») and feminine («Web»), so
    // tacking «copiado» onto them agrees badly half of the time. With a colon
    // it works for all of them.
    done: (field) => `Copiado al portapapeles: ${field}`,
    failed: (field) => `No se ha podido copiar: ${field}`,
    link: "Enlace de la tarjeta",
  },
};

const en: Dictionary = {
  meta: {
    title: (name) => `${name} — Contact card`,
    description: (name, company) =>
      `Interactive contact card for ${name}, of ${company}: drag it, spin it and save the details to your address book.`,
  },
  language: {
    code: "EN",
    switchTo: "Switch to English",
  },
  theme: {
    toLight: "Switch to the light theme",
    toDark: "Switch to the dark theme",
  },
  scene: {
    label: "Interactive contact card",
    loading: "Loading the card…",
    hint:
      "Drag the card to move it and the background to spin it. Double-tap it, or drag it off screen, to flip it over.",
    hintShort: "Drag it. A double tap flips it over.",
    hintMotion: "Drag it. Shake the phone to flip it.",
    noWebgl:
      "Your browser cannot show 3D graphics, so this is the flat version. Tap the card to turn it over.",
    failed:
      "We could not load the card in 3D. Here is the flat version: tap it to turn it over.",
    showingFront: "The card is showing its front.",
    showingBack: "The card is showing its back.",
  },
  controls: {
    showFront: "See the front",
    showBack: "See the back",
    reset: "Recenter",
    showData: "See the details",
    share: "Share",
    useMotion: "Use motion",
    flipToFront: "See the front of the card",
    flipToBack: "See the back of the card",
  },
  fields: {
    jobTitle: "Role",
    services: "Services",
    email: "Email",
    phone: "Phone",
    website: "Website",
  },
  panel: {
    title: "Contact details",
    close: "Close the contact details",
    save: "Save contact (.vcf)",
    profile: (network, address) => `${network} profile: ${address}`,
  },
  copy: {
    action: (field) => `Copy ${field.toLowerCase()}`,
    done: (field) => `${field} copied to the clipboard`,
    failed: (field) => `Could not copy ${field.toLowerCase()}`,
    link: "Card link",
  },
};

export const DICTIONARIES: Record<Language, Dictionary> = { es, en };

/** The interface texts in one language. */
export function dictionary(language: Language): Dictionary {
  return DICTIONARIES[language];
}
