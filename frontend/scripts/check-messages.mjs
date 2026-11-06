// Vérifie la cohérence des traductions : node scripts/check-messages.mjs
// - en.json et fr.json ont exactement les mêmes clés ;
// - chaque t("…") littéral du code existe dans les fichiers ;
// - signale (sans échouer) les clés qui ne semblent plus utilisées.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../src/", import.meta.url));
const en = JSON.parse(readFileSync(join(root, "messages/en.json"), "utf8"));
const fr = JSON.parse(readFileSync(join(root, "messages/fr.json"), "utf8"));

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.(tsx?|jsx?)$/.test(name) ? [path] : [];
  });
}

const files = walk(root).filter((f) => !f.includes("/docs/content/"));
const sources = files.map((f) => readFileSync(f, "utf8"));
const all = sources.join("\n");

let errors = 0;
for (const k of Object.keys(en)) if (!(k in fr)) { console.error(`✗ absent de fr.json : ${k}`); errors++; }
for (const k of Object.keys(fr)) if (!(k in en)) { console.error(`✗ absent de en.json : ${k}`); errors++; }

const re = /\bt\(\s*(["'`])((?:\\.|(?!\1).)*?)\1\s*[,)]/gs;
for (const [i, src] of sources.entries()) {
  for (const m of src.matchAll(re)) {
    const key = m[2].replace(/\\(["'`])/g, "$1");
    if (!key.includes("${") && !(key in en)) {
      console.error(`✗ clé inconnue dans ${files[i].replace(root, "src/")} : ${key}`);
      errors++;
    }
  }
}

const unused = Object.keys(en).filter(
  (k) => !['"', "'", "`"].some((q) => all.includes(q + k + q)),
);
if (unused.length) console.warn(`⚠ ${unused.length} clé(s) apparemment inutilisée(s) :\n  - ${unused.join("\n  - ")}`);

console.log(errors ? `\n${errors} erreur(s)` : `✓ ${Object.keys(en).length} clés en/fr cohérentes`);
process.exit(errors ? 1 : 0);
