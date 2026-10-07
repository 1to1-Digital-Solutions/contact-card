import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { TRANSLATED } from "./contact";
import { dictionary } from "./dictionary";
import { LANGUAGES } from "./i18n";

/**
 * An untranslated text breaks nothing: it shows up in Spanish inside an
 * English page and stays there until someone looks at it. Since nobody looks
 * at the page in both languages every time, these two rules catch it on their
 * own.
 *
 * The first one is read from the syntax tree and not with a regular
 * expression: the comments in this repo are full of `<html>` and of Spanish
 * sentences, and any text search would mistake them for the interface.
 */

const ROOT = fileURLToPath(new URL("..", import.meta.url));

/** The `.ts` and `.tsx` files of a folder, without the tests, with the path from the root. */
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
 * Attributes whose value a person reads (or a screen reader reads out to
 * them) and `lang`, which is the one that announces which language the rest
 * is in: none of them can be a hand-written text.
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

/** Interface text written in the component itself, if any is left. */
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

/** Every string of a dictionary, without resolving the ones that take a placeholder. */
function texts(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") return Object.values(value).flatMap(texts);
  return [];
}

const UI_FILES = [...sourceFiles("app"), ...sourceFiles("components")];

/** Where the texts live: the only files allowed to have them written down. */
const SOURCES_OF_TRUTH = ["lib/dictionary.ts", "lib/contact.ts"];
const OTHER_FILES = sourceFiles("lib").filter(
  (path) => !SOURCES_OF_TRUTH.includes(path),
);

describe("translation coverage", () => {
  it("finds the files it has to watch", () => {
    expect(UI_FILES).toContain("app/layout.tsx");
    expect(UI_FILES).toContain("components/contact-card/contact-card-experience.tsx");
    expect(OTHER_FILES).toContain("lib/metadata.ts");
  });

  it.each(UI_FILES)("leaves no hand-written text in %s", (path) => {
    expect(hardcodedText(path)).toEqual([]);
  });

  /**
   * The other side of the same deal: a text that is in the dictionary but
   * also shows up copied into a component. That one gets translated halfway,
   * which is worse, because the dictionary appears to cover it.
   */
  it.each([...UI_FILES, ...OTHER_FILES])(
    "copies no dictionary text into %s",
    (path) => {
      const code = read(path);
      const translated = [
        ...LANGUAGES.flatMap((language) => texts(dictionary(language))),
        ...texts(TRANSLATED),
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
