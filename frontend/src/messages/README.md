# Traductions

- `en.json` et `fr.json` : un seul endroit pour tous les textes de l'interface.
- **Clé** = texte anglais d'origine tel qu'écrit dans `t("…")` ; **valeur** = texte affiché dans la langue.
  Pour retoucher un texte, on change la valeur : le code source n'est pas touché.
- Les deux fichiers ont toujours les mêmes clés. Ajouter une clé = l'ajouter dans les deux.
- Ton : court, direct, orienté produit (startup / IT). Pas de jargon inutile, pas de phrases à rallonge.
- Vérification : `pnpm i18n:check` (clés manquantes ou divergentes, clés inutilisées).
- Le chargement se fait dans `src/lib/preferences.tsx` (`import en/fr from "../messages/*.json"`).
