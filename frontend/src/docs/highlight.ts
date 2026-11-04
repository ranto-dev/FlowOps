/** Coloration syntaxique minimale, sans dépendance. */

export type TokenKind =
  | "comment"
  | "string"
  | "keyword"
  | "number"
  | "key"
  | "flag"
  | "variable"
  | "literal"
  | "command";

export interface Token {
  text: string;
  kind?: TokenKind;
}

type Rule = [TokenKind, string];

const STR = String.raw`"(?:[^"\\]|\\.)*"`;
const STR_ANY = String.raw`"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|` + "`[^`]*`";
const NUM = String.raw`\b\d+(?:\.\d+)?\b`;

const RULES: Record<string, Rule[]> = {
  json: [
    ["key", STR + String.raw`(?=\s*:)`],
    ["string", STR],
    ["literal", String.raw`\b(?:true|false|null)\b`],
    ["number", String.raw`-?` + NUM],
  ],
  yaml: [
    ["comment", String.raw`#.*$`],
    ["string", STR_ANY],
    ["key", String.raw`\b[\w.-]+(?=:(?:\s|$))`],
    ["literal", String.raw`\b(?:true|false|null)\b`],
    ["number", NUM],
  ],
  bash: [
    ["comment", String.raw`(?:^|\s)#.*$`],
    ["string", STR_ANY],
    ["variable", String.raw`\$\{?\w+\}?`],
    ["flag", String.raw`\B--?[a-zA-Z][\w-]*`],
    [
      "command",
      String.raw`\b(?:curl|docker|pip|python|pnpm|cd|export|source|git|echo|ss|mongosh)\b`,
    ],
  ],
  ts: [
    ["comment", String.raw`//.*$|/\*[\s\S]*?\*/`],
    ["string", STR_ANY],
    [
      "keyword",
      String.raw`\b(?:import|export|from|const|let|var|function|return|if|else|async|await|interface|type|new|default|class)\b`,
    ],
    ["literal", String.raw`\b(?:true|false|null|undefined)\b`],
    ["number", NUM],
  ],
  python: [
    ["comment", String.raw`#.*$`],
    ["string", STR_ANY],
    [
      "keyword",
      String.raw`\b(?:import|from|def|class|return|if|else|elif|async|await|with|as|for|in|try|except|raise)\b`,
    ],
    ["literal", String.raw`\b(?:True|False|None)\b`],
    ["number", NUM],
  ],
};

const ALIASES: Record<string, string> = {
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  js: "ts",
  javascript: "ts",
  typescript: "ts",
  tsx: "ts",
  py: "python",
};

export const LANGUAGE_LABELS: Record<string, string> = {
  bash: "Bash",
  json: "JSON",
  yaml: "YAML",
  ts: "TypeScript",
  python: "Python",
  text: "Text",
};

export function normalizeLang(lang: string): string {
  const key = lang.toLowerCase();
  return ALIASES[key] ?? key;
}

const compiled = new Map<string, RegExp>();

function scanner(lang: string): RegExp | null {
  const rules = RULES[lang];
  if (!rules) return null;
  let re = compiled.get(lang);
  if (!re) {
    re = new RegExp(rules.map(([, src]) => `(${src})`).join("|"), "gm");
    compiled.set(lang, re);
  }
  return re;
}

export function tokenize(code: string, rawLang: string): Token[] {
  const lang = normalizeLang(rawLang);
  const re = scanner(lang);
  if (!re) return [{ text: code }];

  const rules = RULES[lang];
  const tokens: Token[] = [];
  let last = 0;
  for (const m of code.matchAll(re)) {
    const index = m.index ?? 0;
    if (m[0] === "") continue;
    if (index > last) tokens.push({ text: code.slice(last, index) });
    const group = m.findIndex((g, i) => i > 0 && g !== undefined) - 1;
    tokens.push({ text: m[0], kind: rules[group][0] });
    last = index + m[0].length;
  }
  if (last < code.length) tokens.push({ text: code.slice(last) });
  return tokens;
}
