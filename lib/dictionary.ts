import type { Language } from "./i18n";

/**
 * Todos los textos de la interfaz, en un sitio y por idioma. Los datos de
 * contacto no viven aquí: salen de `lib/contact.ts`, que es su fuente de
 * verdad y solo traduce el cargo.
 *
 * Las cadenas con hueco son funciones en lugar de plantillas con marcadores:
 * así el compilador obliga a pasar lo que falta y no hay que inventarse un
 * sustituidor. Los mensajes de `console` no están aquí a propósito: son para
 * diagnosticar, no para leer.
 */
export type Dictionary = {
  meta: {
    title: (name: string) => string;
    description: (name: string, company: string) => string;
  };
  language: {
    /** Lo que enseña el conmutador: el idioma al que lleva, abreviado. */
    code: string;
    /**
     * Etiqueta accesible del conmutador, escrita en el idioma de destino para
     * que la entienda quien no lee el de la página. Tiene que contener `code`:
     * el nombre accesible de un control debe incluir su texto visible para
     * poder pulsarlo por voz (WCAG 2.5.3), y `dictionary.test.ts` lo comprueba.
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
     * La misma pista para una pantalla estrecha, donde el texto largo se come
     * dos o tres líneas que le hacen falta a la tarjeta. `dictionary.test.ts`
     * fija su tope de longitud: si crece, deja de caber en una línea.
     */
    hintShort: string;
    /** El navegador no puede con 3D: se enseña la tarjeta plana. */
    noWebgl: string;
    /** La escena 3D reventó al montarse: la misma tarjeta plana. */
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
    /** Etiquetas de la tarjeta plana, que se voltea pulsándola. */
    flipToFront: string;
    flipToBack: string;
  };
  /** Rótulos de los datos: valen para el panel y para la cara de la tarjeta. */
  fields: {
    jobTitle: string;
    email: string;
    phone: string;
    website: string;
  };
  panel: {
    title: string;
    close: string;
    save: string;
    /**
     * Nombre accesible del enlace a un perfil: el nombre de la red no se
     * traduce, pero decir de qué es el enlace, sí. Lleva también la dirección
     * que se ve porque el nombre accesible de un enlace debe contener su texto
     * visible (WCAG 2.5.3), y `dictionary.test.ts` lo comprueba.
     */
    profile: (network: string, address: string) => string;
  };
  copy: {
    action: (field: string) => string;
    done: (field: string) => string;
    failed: (field: string) => string;
    /**
     * Cómo se llama el enlace de la tarjeta en esos avisos. Compartir sin
     * diálogo del sistema acaba copiándolo, y entonces se confirma igual que
     * cualquier otro dato: con `done` y con este rótulo.
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
    flipToFront: "Ver el anverso de la tarjeta",
    flipToBack: "Ver el reverso de la tarjeta",
  },
  fields: {
    jobTitle: "Cargo",
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
    // El rótulo va detrás y no delante del participio: los hay masculinos
    // («Cargo», «Teléfono») y femeninos («Web»), así que pegarle «copiado»
    // concuerda mal en la mitad de los casos. Con dos puntos vale para todos.
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
    flipToFront: "See the front of the card",
    flipToBack: "See the back of the card",
  },
  fields: {
    jobTitle: "Role",
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

/** Los textos de la interfaz en un idioma. */
export function dictionary(language: Language): Dictionary {
  return DICTIONARIES[language];
}
