import { TAB_LABELS } from "./navigation";
import { READING_ORDER } from "./pages";
import { slugify, stripInline } from "./utils";

export interface SearchResult {
  slug: string;
  /** Ancre de la section trouvée (sans « # »). */
  anchor?: string;
  pageTitle: string;
  sectionTitle: string;
  heading?: string;
  snippet: string;
  score: number;
}

interface Entry {
  slug: string;
  anchor?: string;
  pageTitle: string;
  sectionTitle: string;
  heading?: string;
  keywords: string;
  body: string;
}

/** Index : une entrée par page (intro) et par titre h2/h3. */
function buildIndex(): Entry[] {
  const entries: Entry[] = [];
  for (const { page, section } of READING_ORDER) {
    const base = {
      slug: page.slug,
      pageTitle: page.title,
      sectionTitle:
        section.tab === "developers"
          ? `${TAB_LABELS.developers} · ${section.title}`
          : section.title,
      keywords: (page.keywords ?? []).join(" ").toLowerCase(),
    };
    let current: Entry = { ...base, body: stripInline(page.description) };
    entries.push(current);
    for (const block of page.blocks) {
      if (block.type === "h2" || block.type === "h3") {
        const heading = stripInline(block.text);
        current = { ...base, anchor: slugify(block.text), heading, body: "" };
        entries.push(current);
        continue;
      }
      switch (block.type) {
        case "p":
          current.body += ` ${stripInline(block.text)}`;
          break;
        case "list":
          current.body += ` ${block.items.map(stripInline).join(" ")}`;
          break;
        case "callout":
          current.body += ` ${stripInline(block.text)}`;
          break;
        case "code":
          current.body += ` ${block.code}`;
          break;
        case "table":
          current.body += ` ${[...block.head, ...block.rows.flat()].map(stripInline).join(" ")}`;
          break;
      }
    }
  }
  return entries;
}

let index: Entry[] | null = null;

export function queryTokens(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

function snippetFor(body: string, tokens: string[]): string {
  const text = body.replace(/\s+/g, " ").trim();
  const lower = text.toLowerCase();
  let at = -1;
  for (const t of tokens) {
    const i = lower.indexOf(t);
    if (i !== -1 && (at === -1 || i < at)) at = i;
  }
  if (at === -1) return text.slice(0, 110);
  const start = Math.max(0, at - 40);
  const slice = text.slice(start, start + 120);
  return `${start > 0 ? "…" : ""}${slice}${start + 120 < text.length ? "…" : ""}`;
}

export function search(query: string, limit = 10): SearchResult[] {
  const tokens = queryTokens(query);
  if (tokens.length === 0) return [];
  index ??= buildIndex();

  const results: SearchResult[] = [];
  for (const e of index) {
    const title = e.pageTitle.toLowerCase();
    const heading = (e.heading ?? "").toLowerCase();
    const body = e.body.toLowerCase();
    let score = 0;
    let ok = true;
    for (const t of tokens) {
      let s = 0;
      if (title.includes(t)) s += e.heading ? 3 : 10;
      if (heading.includes(t)) s += 8;
      if (e.keywords.includes(t)) s += 4;
      if (body.includes(t)) s += 1;
      if (s === 0) {
        ok = false;
        break;
      }
      score += s;
    }
    if (!ok) continue;
    if (!e.heading) score += 1; // à égalité, la page l'emporte sur ses sections
    results.push({
      slug: e.slug,
      anchor: e.anchor,
      pageTitle: e.pageTitle,
      sectionTitle: e.sectionTitle,
      heading: e.heading,
      snippet: snippetFor(e.body, tokens),
      score,
    });
  }

  results.sort((a, b) => b.score - a.score);
  // Au plus 3 résultats par page pour garder une liste variée.
  const perPage = new Map<string, number>();
  return results
    .filter((r) => {
      const n = perPage.get(r.slug) ?? 0;
      perPage.set(r.slug, n + 1);
      return n < 3;
    })
    .slice(0, limit);
}
