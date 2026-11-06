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
import { advancedFr } from "./content-fr/advanced";
import { apiFr } from "./content-fr/api";
import { conceptsFr } from "./content-fr/concepts";
import { gettingStartedFr } from "./content-fr/getting-started";
import { guidesConceptsFr } from "./content-fr/guides-concepts";
import { guidesHelpFr } from "./content-fr/guides-help";
import { guidesStartFr } from "./content-fr/guides-start";
import { guidesUseFr } from "./content-fr/guides-use";
import { mlopsFr } from "./content-fr/mlops";
import { referenceFr } from "./content-fr/reference";
import { workflowsFr } from "./content-fr/workflows";
import { workflows } from "./content/workflows";
import { NAVIGATION } from "./navigation";
import type { DocPage, NavItem, NavSection } from "./types";

/** Langues de la documentation (mêmes codes que les préférences de l'UI). */
export type DocLang = "en" | "fr";

const PAGES_EN: DocPage[] = [
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

const PAGES_FR: DocPage[] = [
  ...guidesStartFr,
  ...guidesUseFr,
  ...guidesConceptsFr,
  ...guidesHelpFr,
  ...gettingStartedFr,
  ...conceptsFr,
  ...workflowsFr,
  ...mlopsFr,
  ...apiFr,
  ...advancedFr,
  ...referenceFr,
];

export interface PageEntry {
  page: DocPage;
  section: NavSection;
  /** Pages parentes (du plus haut au plus proche), pour le fil d'Ariane. */
  ancestors: DocPage[];
}

interface DocSet {
  pageMap: Map<string, DocPage>;
  /** Pages dans l'ordre de lecture (parent puis enfants), avec leur contexte. */
  readingOrder: PageEntry[];
}

function buildSet(pages: DocPage[], fallback: DocPage[] = []): DocSet {
  const pageMap = new Map<string, DocPage>();
  // La version anglaise sert de repli si une page n'est pas (encore) traduite.
  for (const page of fallback) pageMap.set(page.slug, page);
  const seen = new Set<string>();
  for (const page of pages) {
    if (seen.has(page.slug)) throw new Error(`Doc slug en double : ${page.slug}`);
    seen.add(page.slug);
    pageMap.set(page.slug, page);
  }

  const readingOrder: PageEntry[] = [];
  const walk = (items: NavItem[], section: NavSection, ancestors: DocPage[]) => {
    for (const item of items) {
      const page = pageMap.get(item.slug);
      if (!page) throw new Error(`Navigation : page inconnue « ${item.slug} »`);
      readingOrder.push({ page, section, ancestors });
      if (item.children) walk(item.children, section, [...ancestors, page]);
    }
  };
  for (const section of NAVIGATION) walk(section.items, section, []);
  return { pageMap, readingOrder };
}

const SETS: Record<DocLang, DocSet> = {
  en: buildSet(PAGES_EN),
  fr: buildSet(PAGES_FR, PAGES_EN),
};

export function getReadingOrder(lang: DocLang): PageEntry[] {
  return SETS[lang].readingOrder;
}

export function getEntry(slug: string, lang: DocLang): PageEntry | undefined {
  return SETS[lang].readingOrder.find((e) => e.page.slug === slug);
}

export function getNeighbours(
  slug: string,
  lang: DocLang,
): { prev?: DocPage; next?: DocPage } {
  const order = SETS[lang].readingOrder;
  const i = order.findIndex((e) => e.page.slug === slug);
  if (i === -1) return {};
  return { prev: order[i - 1]?.page, next: order[i + 1]?.page };
}

export function getPage(slug: string, lang: DocLang): DocPage | undefined {
  return SETS[lang].pageMap.get(slug);
}
