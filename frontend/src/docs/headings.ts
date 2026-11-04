import type { DocPage } from "./types";
import { slugify, stripInline } from "./utils";

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

export function getHeadings(page: DocPage): Heading[] {
  const headings: Heading[] = [];
  for (const block of page.blocks) {
    if (block.type === "h2" || block.type === "h3") {
      headings.push({
        id: slugify(block.text),
        text: stripInline(block.text),
        level: block.type === "h2" ? 2 : 3,
      });
    }
  }
  return headings;
}
