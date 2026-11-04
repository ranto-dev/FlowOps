/** Modèle de données de la documentation : contenu et navigation sont des données. */

export type CalloutTone = "note" | "tip" | "warning";

export type Block =
  | { type: "h2" | "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "code"; lang: string; code: string; title?: string }
  | { type: "callout"; tone: CalloutTone; text: string; title?: string }
  | { type: "table"; head: string[]; rows: string[][] };

export interface DocPage {
  /** Identifiant d'URL : /docs/<slug>. Unique. */
  slug: string;
  title: string;
  /** Libellé court dans la sidebar (par défaut : title). */
  navTitle?: string;
  description: string;
  /** Mots-clés supplémentaires pour la recherche. */
  keywords?: string[];
  blocks: Block[];
}

export interface NavItem {
  slug: string;
  children?: NavItem[];
}

export type DocTab = "guides" | "developers";

export interface NavSection {
  id: string;
  /** Onglet de la doc auquel appartient la section. */
  tab: DocTab;
  title: string;
  items: NavItem[];
}
