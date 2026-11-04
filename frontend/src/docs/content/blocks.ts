import type { Block, CalloutTone } from "../types";

/** Constructeurs de blocs : gardent les fichiers de contenu lisibles. */
export const h2 = (text: string): Block => ({ type: "h2", text });
export const h3 = (text: string): Block => ({ type: "h3", text });
export const p = (text: string): Block => ({ type: "p", text });
export const ul = (...items: string[]): Block => ({ type: "list", items });
export const ol = (...items: string[]): Block => ({
  type: "list",
  items,
  ordered: true,
});
export const code = (lang: string, source: string, title?: string): Block => ({
  type: "code",
  lang,
  code: source,
  title,
});
const callout =
  (tone: CalloutTone) =>
  (text: string, title?: string): Block => ({ type: "callout", tone, text, title });
export const note = callout("note");
export const tip = callout("tip");
export const warning = callout("warning");
export const table = (head: string[], ...rows: string[][]): Block => ({
  type: "table",
  head,
  rows,
});
