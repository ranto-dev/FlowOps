# Guide de design FlowOps — « startup produit » en verre

Ce guide est la référence visuelle de l'interface. Les valeurs viennent de `frontend/src/main.css` (source de vérité) ; une page vivante `/styleguide` (mode dev uniquement) montre chaque élément dans les deux thèmes.

## 1. Principes

1. **Confiance, énergie mesurée, clarté.** Un produit moderne et assuré, qui reste un outil de travail : l'expressivité est concentrée sur la vitrine (landing, authentification), l'application reste calme.
2. **Le verre structure, il ne décore pas.** Il sert à distinguer les couches (navigation, cartes, fenêtres flottantes), jamais à remplir.
3. **Zones denses = opaques.** Champs, YAML, logs, tableaux et blocs de code ne sont jamais translucides : la lisibilité prime.
4. **Un seul accent : le violet FlowOps.** Les autres couleurs n'expriment que des états.
5. **Les tokens, rien d'autre.** Aucune couleur, aucun rayon, aucune ombre écrits « à la main » dans un composant.

## 2. Couleurs

Thème sombre par défaut ; le thème clair redéfinit les mêmes tokens (`data-theme="light"`). Les contrastes sont mesurés **sur le pire fond** (verre composé avec le pic de halo).

| Token (utilitaire) | Rôle | Sombre | Clair |
|---|---|---|---|
| `canvas` | fond de page | `#0b1020` | `#f8fafc` |
| `surface` | surfaces opaques | `#111827` | `#ffffff` |
| `surface-2` | champs, survols | `#1a2236` | `#f1f5f9` |
| `code` | code, logs, YAML | `#070b17` | `#f1f5f9` |
| `line` / `line-strong` | bordures / bordures de champs | `#243047` / `#334155` | `#e2e8f0` / `#cbd5e1` |
| `ink` | texte principal | `#e2e8f0` | `#0f172a` |
| `ink-muted` | texte secondaire | `#94a3b8` | `#475569` |
| `ink-subtle` | aides, placeholders | `#8393ad` | `#5b6b82` |
| `accent` | remplissage (boutons) | `#7c3aed` | `#7c3aed` |
| `accent-hover` | survol du remplissage | `#6d28d9` | `#6d28d9` |
| `accent-ink` | liens, états actifs | `#a78bfa` | `#6d28d9` |
| `success` `warning` `danger` `info` | **états uniquement** | `#34d399` `#fbbf24` `#f87171` `#38bdf8` | `#047857` `#92400e` `#b91c1c` `#0369a1` |

**Contrastes (WCAG AA ≥ 4,5:1)** — sur verre, pire cas : `ink` ≥ 12,8 · `ink-muted` ≥ 6,2 · `ink-subtle` ≥ 4,6 · `accent-ink` ≥ 5,8 · couleurs d'état ≥ 4,7. Texte blanc sur `accent` : 5,7 ; sur le dégradé de marque : ≥ 5,7.

Règles : fonds d'état en `bg-success/10` + bordure `border-success/30` + texte `text-success` ; jamais de palette Tailwind brute (`slate-*`, `purple-*`, `bg-white`…), jamais de `dark:`, jamais d'hexadécimal dans une classe.

## 3. Verre et élévation

| Niveau | Utilitaire | Usage | Flou | Opacité sombre / clair |
|---|---|---|---|---|
| 0 — Plat | `bg-canvas`, `bg-surface` | fond, zones denses, champs | — | opaque |
| 1 — Verre | `glass` | headers, sidebars, cartes, panneaux | 16 px | 0,55 / 0,65 |
| 2 — Verre renforcé | `glass-strong` | modales, menus, toasts, recherche, panneau de formulaire | 24 px | 0,78 / 0,88 |

- `glass` / `glass-strong` fixent fond, flou (+ saturation 140 %), **couleur** de bordure, ombre et reflet intérieur. **Ajoutez `border` (ou `border-b`, `border-r`…)** sur l'élément ; ne mettez pas `border-line` en plus.
- **Fond ambiant** : `.app-root::before` — 3 halos radiaux fixes (violet haut-gauche, bleu bas-droite, violet atténué au centre). C'est ce qui donne quelque chose à flouter.
- **Quand ne pas flouter** : champs, YAML, logs, tableaux, boutons, longues listes défilantes, tout élément déjà dans un élément en verre (jamais de flou imbriqué). Budget : ≈ 6 couches floutées visibles en même temps.
- **Dégradations automatiques** : navigateur sans `backdrop-filter` ou préférence « réduire la transparence » → le verre devient opaque (`surface`) et les halos disparaissent.

## 4. Identité « startup » (vitrine)

- `bg-brand` : dégradé de marque `#7c3aed → #4f46e5`, **réservé aux CTA de la vitrine** (variante `Button variant="brand"`).
- `text-brand` : dégradé violet → ciel sur **un mot clé** du titre hero.
- `halo-vivid` : halos radiaux plus intenses derrière le hero et la carte d'authentification (conteneur `relative`).
- Ce sont les **seuls** `linear-gradient` autorisés. Dans l'application (workspace, formulaire, logs, docs) : bouton primaire **plein**, sans dégradé.

## 5. Typographie

- Familles : **Inter** (texte et titres) et **JetBrains Mono** (code, logs, YAML), auto-hébergées.
- Application : échelle 12 / 14 / 16 / 20 / 24 / 32 px (`text-xs … text-3xl`), graisses 400 / 500 / 600. Titres `font-semibold`, `letter-spacing: -0.01em`.
- Vitrine : titres d'affichage 40 / 48 / 60 px en `font-bold` (700), interlignage serré (1,1 – 1,15).
- Interlignage du texte courant 1,6. `tabular-nums` pour durées, compteurs, statuts. Casse normale partout (pas de majuscules espacées).

## 6. Espacement, rayons, bordures, ombres

- Grille de 4 px (8 px pour les blocs). Respiration généreuse dans la vitrine, dense dans les écrans de travail.
- **2 rayons** : `rounded-md` = 12 px (contrôles) ; `rounded-lg` = 16 px (cartes, panneaux, modales). `rounded-full` pour avatars et pastilles. Pas de `rounded-xl+`.
- Bordures 1 px. Ombres uniquement via `glass*` ; pas d'`shadow-*` isolé.

## 7. Mouvement

- 150 – 200 ms, `ease-out`. Survol de carte interactive : relèvement de 2 px. Apparition douce à l'entrée (≤ 12 px).
- Aucun mouvement continu ou décoratif. `prefers-reduced-motion` respecté.

## 8. Composants (`frontend/src/components/ui/*`)

| Composant | Variantes / règles |
|---|---|
| `Button` | `primary` (plein + reflet), `brand` (vitrine), `secondary`, `ghost`, `danger` ; tailles `sm` 32 / `md` 36 / `lg` 44 px ; jamais de flou |
| `Card` | `variant="glass"` (défaut) ou `"solid"` (zones denses) ; `interactive` pour les cartes cliquables |
| `Badge`, `StatusBadge` | teintes `neutral / purple / green / red / amber / sky` ; statut d'un run avec point |
| `Input`, `Select`, `Textarea`, `Field` | **opaques** (`surface-2`), focus violet, erreur en `danger`, label et aide via `Field` |
| `Modal`, `ConfirmDialog` | `glass-strong`, voile `black/60` sans flou |
| `Toast` | `glass-strong`, barre d'état colorée |
| `CodeSurface` | fond `code` opaque, mono 13 px |
| `LoadingState`, `EmptyState`, `ErrorState` | états de liste standard |
| `ThemeToggle`, `PreferenceControls` | bascule clair/sombre et langue |

États obligatoires : repos, survol, focus visible (anneau violet), actif, désactivé (opacité 50 %), erreur/chargement quand pertinent.

## 9. Patterns de page

- **Shell applicatif** : header `glass` collant (logo, onglets, thème/langue, profil), contenu sur le fond ambiant.
- **Liste + détail (runs, logs)** : liste en `glass`, détail en `glass`, **visionneuse de logs opaque**.
- **Formulaire** : panneau `glass-strong` contenant des **champs opaques**, sections titrées, un seul bouton primaire par zone.
- **Authentification** : carte `glass-strong` centrée sur `halo-vivid`, CTA `brand`.
- **Documentation** : header et sidebar `glass`, contenu à plat, code opaque, callouts translucides.

## 10. Accessibilité

- Contraste ≥ 4,5:1 vérifié sur le pire fond ; focus visible partout ; cibles ≥ 32 px ; transparence réduite respectée.
- Le sens ne repose jamais sur la couleur seule (icône ou libellé avec les états).

## 11. Checklist de revue

1. Aucune couleur, rayon ou ombre « à la main » (tokens et primitives uniquement).
2. Verre uniquement sur surfaces structurantes ; zones denses opaques.
3. Pas de flou imbriqué, ≈ 6 couches floutées maximum.
4. `border` présent sur tout élément `glass*` ; pas de `border-line` en doublon.
5. `linear-gradient` seulement via `bg-brand` / `text-brand` (vitrine).
6. Un seul bouton primaire par zone ; casse normale.
7. Contrastes OK dans **les deux thèmes**.
8. Focus clavier visible, cibles ≥ 32 px.
9. Rendu correct sans flou (`prefers-reduced-transparency`) et à 375 / 768 / 1280 px.
10. Textes traduits via `t()` et page ajoutée à `/styleguide` si nouveau composant.
