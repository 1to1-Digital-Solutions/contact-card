import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { JOB_TITLE } from "./contact";
import { dictionary } from "./dictionary";
import { LANGUAGES } from "./i18n";

/**
 * Un texto sin traducir no rompe nada: se ve en español dentro de una página
 * en inglés y ahí se queda hasta que alguien la mira. Como nadie la mira en
 * los dos idiomas cada vez, estas dos reglas lo cazan solas.
 *
 * La primera se lee del árbol de sintaxis y no con una expresión regular: los
 * comentarios de este repo están llenos de `<html>` y de frases en español, y
 * cualquier búsqueda por texto los confundiría con la interfaz.
 */

const ROOT = fileURLToPath(new URL("..", import.meta.url));

/** Los `.ts` y `.tsx` de una carpeta, sin los tests, con la ruta desde la raíz. */
function sourceFiles(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return sourceFiles(path);
    if (!/\.tsx?$/.test(entry.name) || entry.name.includes(".test.")) return [];
    return [path];
  });
}

const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

/**
 * Atributos cuyo valor lee una persona (o se lo lee un lector de pantalla) y
 * `lang`, que es el que anuncia en qué idioma está lo demás: ninguno puede ser
 * un texto escrito a mano.
 */
const TRANSLATABLE_ATTRIBUTES = new Set([
  "alt",
  "aria-description",
  "aria-label",
  "aria-placeholder",
  "aria-roledescription",
  "aria-valuetext",
  "lang",
  "placeholder",
  "title",
]);

/** Texto de la interfaz escrito en el propio componente, si queda alguno. */
function hardcodedText(path: string): string[] {
  const source = ts.createSourceFile(
    path,
    read(path),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  const found: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node) && node.text.trim() !== "") {
      found.push(node.text.trim());
    }
    if (
      ts.isJsxAttribute(node) &&
      TRANSLATABLE_ATTRIBUTES.has(node.name.getText(source)) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer) &&
      node.initializer.text.trim() !== ""
    ) {
      found.push(`${node.name.getText(source)}="${node.initializer.text}"`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  return found;
}

/** Todas las cadenas de un diccionario, sin resolver las que llevan hueco. */
function texts(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") return Object.values(value).flatMap(texts);
  return [];
}

const UI_FILES = [...sourceFiles("app"), ...sourceFiles("components")];

/** Donde viven los textos: son los únicos que pueden llevarlos escritos. */
const SOURCES_OF_TRUTH = ["lib/dictionary.ts", "lib/contact.ts"];
const OTHER_FILES = sourceFiles("lib").filter(
  (path) => !SOURCES_OF_TRUTH.includes(path),
);

describe("cobertura de la traducción", () => {
  it("encuentra los ficheros que tiene que vigilar", () => {
    expect(UI_FILES).toContain("app/layout.tsx");
    expect(UI_FILES).toContain("components/contact-card/contact-card-experience.tsx");
    expect(OTHER_FILES).toContain("lib/metadata.ts");
  });

  it.each(UI_FILES)("no deja ningún texto escrito a mano en %s", (path) => {
    expect(hardcodedText(path)).toEqual([]);
  });

  /**
   * El otro lado del mismo trato: un texto que sí está en el diccionario pero
   * además aparece copiado en un componente. Ese se traduce a medias, que es
   * peor, porque el diccionario aparenta cubrirlo.
   */
  it.each([...UI_FILES, ...OTHER_FILES])(
    "no copia en %s ningún texto del diccionario",
    (path) => {
      const code = read(path);
      const translated = [
        ...LANGUAGES.flatMap((language) => texts(dictionary(language))),
        ...Object.values(JOB_TITLE),
      ];

      const copied = translated.filter((text) =>
        [`"${text}"`, `'${text}'`, `\`${text}\``].some((quoted) =>
          code.includes(quoted),
        ),
      );
      expect(copied).toEqual([]);
    },
  );
});
