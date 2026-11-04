import { advanced } from "./content/advanced";
import { api } from "./content/api";
import { concepts } from "./content/concepts";
import { gettingStarted } from "./content/getting-started";
import { guidesConcepts } from "./content/guides-concepts";
import { guidesHelp } from "./content/guides-help";
import { guidesStart } from "./content/guides-start";
import { guidesUse } from "./content/guides-use";
import { mlops } from "./content/mlops";
import { reference } from "./content/reference";
import { workflows } from "./content/workflows";
import { NAVIGATION } from "./navigation";
import type { DocPage, NavItem, NavSection } from "./types";

const PAGES: DocPage[] = [
  ...guidesStart,
  ...guidesUse,
  ...guidesConcepts,
  ...guidesHelp,
  ...gettingStarted,
  ...concepts,
  ...workflows,
  ...mlops,
  ...api,
  ...advanced,
  ...reference,
];

const PAGE_MAP = new Map<string, DocPage>();
for (const page of PAGES) {
  if (PAGE_MAP.has(page.slug)) throw new Error(`Doc slug en double : ${page.slug}`);
  PAGE_MAP.set(page.slug, page);
}

export interface PageEntry {
  page: DocPage;
  section: NavSection;
  /** Pages parentes (du plus haut au plus proche), pour le fil d'Ariane. */
  ancestors: DocPage[];
}

/** Pages dans l'ordre de lecture (parent puis enfants), avec leur contexte. */
export const READING_ORDER: PageEntry[] = [];

function walk(items: NavItem[], section: NavSection, ancestors: DocPage[]) {
  for (const item of items) {
    const page = PAGE_MAP.get(item.slug);
    if (!page) throw new Error(`Navigation : page inconnue « ${item.slug} »`);
    READING_ORDER.push({ page, section, ancestors });
    if (item.children) walk(item.children, section, [...ancestors, page]);
  }
}
for (const section of NAVIGATION) walk(section.items, section, []);

export function getEntry(slug: string): PageEntry | undefined {
  return READING_ORDER.find((e) => e.page.slug === slug);
}

export function getNeighbours(slug: string): {
  prev?: DocPage;
  next?: DocPage;
} {
  const i = READING_ORDER.findIndex((e) => e.page.slug === slug);
  if (i === -1) return {};
  return {
    prev: READING_ORDER[i - 1]?.page,
    next: READING_ORDER[i + 1]?.page,
  };
}

export function getPage(slug: string): DocPage | undefined {
  return PAGE_MAP.get(slug);
}
