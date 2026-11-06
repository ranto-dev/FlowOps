# Design Guide — Takt (style « Linear-like » dark, violet, verre + 3D)

Guide pour reproduire à l'identique le design de la landing, des pages d'auth et de l'app.
Stack : **Next.js (App Router) + Tailwind CSS v4 + `motion` (Framer Motion) + lucide-react**.

```bash
pnpm add motion lucide-react clsx tailwind-merge
```

---

## 1. Principes

- **Dark only** (`<html class="dark">`, `color-scheme: dark`).
- Fond quasi noir (zinc), accent **violet → indigo**, texte blanc dégradé vers gris.
- Surfaces « **verre** » : bordure blanche à 7 %, fond dégradé blanc 4 % → 1 %, `backdrop-blur`.
- Lumières : **aurora** (gros halos violets flous animés) + **grille** masquée en haut.
- Profondeur : perspective 3D, `translateZ`, ombres longues, glow violet sur les CTA.
- Mouvement discret : reveal au scroll, flottement lent, spring suivant la souris.
- Tout respecte `prefers-reduced-motion`.

---

## 2. Couleurs

### Tokens (`globals.css`, Tailwind v4 `@theme`)

| Token | Valeur | Usage |
|---|---|---|
| `background` | `#09090b` | fond de page |
| `foreground` | `#fafafa` | texte principal |
| `card` | `#0f0f12` | cartes |
| `popover` | `#121215` | menus/popovers |
| `primary` | `#8b5cf6` | accent (violet-500) |
| `secondary` / `muted` | `#18181b` | fonds secondaires |
| `secondary-foreground` | `#a1a1aa` | texte secondaire |
| `muted-foreground` | `#71717a` | texte atténué |
| `accent` | `#1c1c21` | hover/surface |
| `destructive` | `#ef4444` | erreurs |
| `border` / `input` | `#27272a` | bordures |
| `ring` | `#8b5cf6` | focus |
| `sidebar` | `#0c0c0f` | sidebar app |
| `sidebar-border` | `#1e1e22` | |

### Palette d'usage (classes Tailwind)

- Violet : `violet-300 #c4b5fd` · `violet-400` (labels/icônes) · `violet-500 #8b5cf6` · `violet-600` (halos)
- Indigo : `indigo-500 #6366f1` / `indigo-600` (fin de dégradé)
- Texte : `white` (titres) · `zinc-200/300` (corps fort) · `zinc-400` (paragraphes) · `zinc-500` (méta) · `zinc-600` (compteurs)
- Bordures verre : `border-white/[0.06]` (séparateurs), `white/[0.07]` (cartes), `white/10` (éléments)
- Fonds verre : `bg-white/[0.02]` → `[0.03]` → `[0.04]`, hover `[0.07]`/`[0.08]`
- Statuts : backlog `zinc-500` · todo `zinc-400` · in_progress `yellow-500` · in_review `purple-500` · done `emerald-500` · canceled `red-500/60`
- Priorités : urgent `red-500` · high `orange-400` · medium `yellow-400` · low `blue-400` · none `zinc-500`
- Succès / realtime : `#22c55e` / `emerald-500`

### Dégradés de marque

```
Texte titre :   linear-gradient(180deg, #fff 30%, #a1a1aa 100%)
Texte violet :  linear-gradient(90deg, #c4b5fd, #8b5cf6 50%, #6366f1)
Logo :          bg-gradient-to-br from-violet-500 to-indigo-600
Halo hero :     radial-gradient(closest-side, rgb(139 92 246 / .38), transparent)
Halo indigo :   radial-gradient(closest-side, rgb(99 102 241 / .25), transparent)
Backdrop app :  radial-gradient(ellipse 60% 30% at 50% 0%, rgb(139 92 246 / .08), transparent 70%)
```

---

## 3. Typographie

- Sans : **Inter** (fallback system-ui) avec `font-feature-settings: "cv02","cv03","cv04","cv11"`, `antialiased`.
- Mono : **JetBrains Mono** (IDs, kbd, labels de section, code).

| Élément | Classes |
|---|---|
| H1 hero | `mk-text-gradient text-5xl md:text-7xl font-semibold tracking-[-0.04em] text-balance` |
| H2 section | `mk-text-gradient text-4xl md:text-5xl font-semibold tracking-tight` |
| H2 CTA final | `text-4xl md:text-6xl font-semibold tracking-tight` |
| Sous-titre hero | `text-lg text-zinc-400 max-w-xl text-balance` |
| Paragraphe section | `mt-4 text-zinc-400` |
| Eyebrow (label de section) | `font-mono text-xs tracking-widest uppercase text-violet-400` |
| Titre de carte | `text-lg font-medium` |
| Texte de carte | `text-sm text-zinc-400` |
| Titre de page app | `.page-title` : 1.25rem / 600 / -0.02em + dégradé blanc→gris |
| Navbar | `text-[13px]` |
| Micro-UI (cartes kanban) | `text-[12px]`, id `font-mono text-[10px]`, tag `text-[9px]` |
| Markdown | 13.5px / line-height 1.65 |

Le mot clé du H1 (« **code** ») passe en `mk-text-violet`.

---

## 4. Textes (copy)

**Meta** : *Takt — Plan at the speed of code* · « Agile project management that moves at code velocity. »

**Hero**
- H1 : « Plan at the speed of **code** »
- Sous-titre : « Takt is the project tracker that moves with your pull requests. Open a PR, request a review, merge — your tickets update themselves. »
- CTA 1 : « Sign in with GitHub → » · CTA 2 : « Explore features »

**Navbar** : Features · GitHub sync · Shortcuts · Roadmap · Log in · *Get started*

**Features** — eyebrow « Features », H2 « Built for teams that ship », « Every detail is designed to keep you in flow — fast, keyboard-first and always in sync. »
1. *Kanban that feels instant* — « Drag cards between columns with optimistic updates. No spinners, no waiting. »
2. *Command menu* — « ⌘K to search and act. »
3. *Realtime* — « See teammates' changes land live, with a subtle flash. »
4. *Markdown issues* — « Rich descriptions, checklists and comments with live preview. »
5. *Teams & roles* — « Unique team keys, invite links, Admin and Member roles. »

**GitHub sync** — « Your board follows your code » · « Mention `ENG-42` in a branch or PR and Takt does the rest. »
Étapes : Branch pushed (`eng-42-pr-linking`, Todo) → PR opened (Ticket detected from the key, In Progress) → Review requested (Reviewer assigned, In Review) → PR merged (Shipped to main, Done)

**Shortcuts** — eyebrow « Keyboard-first », H2 « Hands on the keys », « Every common action is one keystroke away. »
⌘K Command menu · C Create issue · S Change status · P Set priority · A Assign · G B Go to board

**Roadmap** : Now — Kanban, GitHub sync, command menu · Next — Labels, cycles, notifications, saved views · Later — AI triage, public API, real-time docs

**CTA final** — « Ship faster, together » · « Free to start. Sign in with GitHub in seconds. » · « Get started with GitHub »

**Footer** : © année Takt · Features · GitHub sync · Log in

---

## 5. Layout

- Conteneur : `mx-auto max-w-6xl px-6` (contenu étroit `max-w-3xl`/`max-w-2xl` centré pour les titres).
- Sections : `py-28` (hero `pt-32 md:pt-40 pb-24`, CTA `py-32`, roadmap `py-20`). Ancres : `scroll-mt-20`.
- Wrapper de page : `relative min-h-svh overflow-x-clip bg-background text-foreground`.
- Navbar : `fixed inset-x-0 top-0 z-50`, hauteur `h-14`. Au scroll > 12px : `border-b border-white/[0.06] bg-background/70 backdrop-blur-xl` (sinon bordure transparente), `transition-all duration-300`.
- **Bento** : `grid gap-4 md:grid-cols-6` ; cartes `md:col-span-4` + `md:col-span-2`, puis 3 × `md:col-span-2`.
- **GitHub flow** : `grid gap-4 md:grid-cols-4 max-w-4xl`, rail horizontal à `top-[26px] left-[12%] right-[12%]`.
- **Keycaps** : `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6`.
- **Roadmap** : `grid gap-4 md:grid-cols-3`.
- **Auth** : carte centrée `max-w-sm`, `min-h-svh`, logo au-dessus (`mb-8`), lien retour `absolute top-5 left-5`.
- Footer : `border-t border-white/[0.06] px-6 py-10`, flex colonne → ligne `sm:`.
- Rayons : cartes `rounded-2xl`, sous-blocs `rounded-xl`/`rounded-lg`, boutons `rounded-full`, logo `rounded-lg`.

---

## 6. CSS global à copier (`globals.css`)

```css
@import "tailwindcss";

@theme {
  --color-background: #09090b;  --color-foreground: #fafafa;
  --color-card: #0f0f12;        --color-popover: #121215;
  --color-primary: #8b5cf6;     --color-primary-foreground: #fff;
  --color-secondary: #18181b;   --color-secondary-foreground: #a1a1aa;
  --color-muted: #18181b;       --color-muted-foreground: #71717a;
  --color-accent: #1c1c21;      --color-destructive: #ef4444;
  --color-border: #27272a;      --color-input: #27272a;  --color-ring: #8b5cf6;
  --color-sidebar: #0c0c0f;     --color-sidebar-border: #1e1e22;
  --radius-sm: .25rem; --radius-md: .375rem; --radius-lg: .5rem; --radius-xl: .75rem;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
}

@layer base {
  * { border-color: var(--color-border); }
  html { color-scheme: dark; }
  body {
    background: var(--color-background); color: var(--color-foreground);
    font-family: var(--font-sans);
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
    -webkit-font-smoothing: antialiased;
  }
  ::selection { background: color-mix(in oklab, var(--color-primary) 30%, transparent); }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #52525b; }
}

/* ---------- Animations landing ---------- */
@keyframes mk-marquee { to { transform: translateX(-50%); } }
@keyframes mk-float   { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes mk-aurora  { 0%,100% { transform: translate3d(0,0,0) scale(1); }
                        50%     { transform: translate3d(4%,6%,0) scale(1.15); } }
@keyframes mk-caret   { 50% { opacity: 0; } }
@keyframes realtime-flash {
  0%   { box-shadow: 0 0 0 0 color-mix(in oklab, #22c55e 55%, transparent); }
  100% { box-shadow: 0 0 0 10px transparent; }
}
@keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: .4; } }

.mk-marquee { animation: mk-marquee 40s linear infinite; }
.mk-float   { animation: mk-float 6s ease-in-out infinite; }
.mk-aurora  { animation: mk-aurora 14s ease-in-out infinite; }
.mk-caret   { animation: mk-caret 1s step-end infinite; }
.animate-realtime-flash { animation: realtime-flash .7s ease-out; }
.animate-pulse-dot { animation: pulse-dot 2s cubic-bezier(.4,0,.6,1) infinite; }

/* Grille masquée radialement (haut de page) */
.mk-grid {
  background-image:
    linear-gradient(to right,  rgb(255 255 255 / .045) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(255 255 255 / .045) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 0%, #000 30%, transparent 100%);
}
.mk-text-gradient {
  background: linear-gradient(180deg, #fff 30%, #a1a1aa 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.mk-text-violet {
  background: linear-gradient(90deg, #c4b5fd, #8b5cf6 50%, #6366f1);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}

@media (prefers-reduced-motion: reduce) {
  .mk-marquee, .mk-float, .mk-aurora, .mk-caret { animation: none; }
}

/* ---------- Surfaces ---------- */
.surface-card {
  border: 1px solid rgb(255 255 255 / .07);
  background: linear-gradient(to bottom, rgb(255 255 255 / .045), rgb(255 255 255 / .015));
  box-shadow: 0 1px 0 rgb(255 255 255 / .04) inset;
}
.page-title {
  font-size: 1.25rem; font-weight: 600; letter-spacing: -.02em;
  background: linear-gradient(180deg, #fff 30%, #a1a1aa 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.app-backdrop {
  background-image: radial-gradient(ellipse 60% 30% at 50% 0%, rgb(139 92 246 / .08), transparent 70%);
}
```

Markdown (`.markdown-body`) : 13.5px, liens `#8b5cf6` avec soulignement `color-mix 40%`, `code`/`pre` sur `--color-secondary` + bordure, blockquote bordure gauche 2.5px violette + fond violet 6 %, tables bordées.

---

## 7. Composants

### Logo (`Brand`)
```tsx
<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-[0_0_20px_-2px_rgb(139_92_246/0.7)]">
  <span className="font-mono text-sm font-bold text-white">T</span>
</span>
<span className="text-[15px] font-semibold tracking-tight">Takt</span>   {/* gap-2.5 */}
```

### Boutons (toujours `rounded-full`)
- **Primaire (blanc + glow violet)** :
  `inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-zinc-900 shadow-[0_0_40px_-6px_rgb(139_92_246/0.8)] transition-transform hover:scale-[1.03] active:scale-95`
  (CTA final : `px-7 py-3.5`, glow `-6px … /0.9`, `0_0_50px`, hover `scale-[1.04]`). Flèche : `group-hover:translate-x-0.5`.
- **Secondaire (verre)** :
  `rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm text-zinc-200 backdrop-blur transition-colors hover:bg-white/[0.07]`
- **Navbar CTA** : `rounded-full bg-white px-4 py-1.5 text-[13px] font-medium text-zinc-900 hover:scale-[1.03] active:scale-95`
- Lien nav : `rounded-md px-3 py-1.5 text-[13px] text-zinc-400 hover:text-white`

### Hero background
```tsx
<div aria-hidden className="mk-grid absolute inset-0" />
<div aria-hidden className="mk-aurora absolute left-1/2 top-[-12rem] h-[34rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(139_92_246/0.38),transparent)] blur-3xl" />
<div aria-hidden className="mk-aurora absolute right-[-10rem] top-24 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(closest-side,rgb(99_102_241/0.25),transparent)] blur-3xl [animation-delay:-6s]" />
```
Le 2ᵉ halo est décalé de `-6s` pour désynchroniser.

### Carte « spotlight » (bento)
Carte verre + halo qui suit le curseur (variables CSS `--mx/--my` mises à jour sur `pointermove`).

```tsx
"use client";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export function SpotlightCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onPointerMove={(e) => {
        const el = ref.current; if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      className={cn("group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6", className)}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(360px circle at var(--mx,50%) var(--my,50%), rgb(139 92 246 / 0.16), transparent 60%)" }} />
      <div className="relative">{children}</div>
    </div>
  );
}
```
Contenu type : icône lucide `h-5 w-5 text-violet-400` → `h3 mt-3 text-lg font-medium` → `p mt-1.5 text-sm text-zinc-400` → mini-démo (blocs `bg-white/[0.03]`, `border-white/[0.06]`, `bg-zinc-900`, code `bg-zinc-950/70 font-mono text-[11px]`).

### Carte auth (verre)
`surface-card rounded-2xl p-8 text-center backdrop-blur-xl` · pastille d'icône `h-12 w-12 rounded-2xl bg-primary/15 text-primary shadow-[0_0_30px_-4px_rgb(139_92_246/0.6)]`.

### Carte roadmap
`rounded-2xl border border-white/[0.07] p-6` · label `font-mono text-xs text-violet-400` · texte `mt-2 text-sm text-zinc-300`.

### Badges / pills
- Statut : `inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-zinc-300` + point `h-1.5 w-1.5 rounded-full bg-{status}`.
- Tag : `rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-zinc-400`.
- `kbd` : `rounded border border-white/10 px-1 font-mono text-xs`.

---

## 8. Animations & effets 3D

### 8.1 Reveal au scroll (fade + slide-up)
```tsx
"use client";
import { motion, useReducedMotion } from "motion/react";

export function Reveal({ children, delay = 0, y = 24, className }:
  { children: React.ReactNode; delay?: number; y?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >{children}</motion.div>
  );
}
```
Easing signature : `cubic-bezier(0.21, 0.47, 0.32, 0.98)`. Cascade : hero `0.08 / 0.16 / 0.24`, bento `0 / 0.04 / 0.08 / 0.1 / 0.16`, listes `i * 0.05–0.08`.

### 8.2 Maquette 3D du board (hero) — l'effet signature
- Wrapper : `relative mx-auto w-full max-w-5xl [perspective:1600px]`.
- Panneau : `[transform-style:preserve-3d]`, `rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 shadow-[0_40px_120px_-20px_rgb(0_0_0/0.8),0_0_0_1px_rgb(255_255_255/0.04)_inset]`.
- **Tilt souris** : `mx/my` (−0.5…0.5) → `useSpring({stiffness: 80, damping: 18})` → `rotateY = [-0.5,0.5]→[-10°,10°]`, `rotateX = [-0.5,0.5]→[22°,10°]`. `onPointerLeave` remet à 0. Reduced motion : `rotateX: 14`, `rotateY: 0`.
- **Entrée** : `initial {opacity 0, y 60, rotateX 34}` → `animate {opacity 1, y 0}`, 1.1s, ease signature, delay 0.3.
- **Profondeur (translateZ)** : colonnes paires `20px`, impaires `45px` ; carte qui bouge `70px` ; toast `110px`.
- **Halo sous la maquette** : `absolute -inset-x-10 -bottom-10 top-1/3 rounded-[50%] bg-violet-600/25 blur-[90px]`.
- **Barre de fenêtre** : 3 points `h-2.5 w-2.5 rounded-full bg-zinc-700`, titre `font-mono text-[11px] text-zinc-500` (« ENG · Board »), badge `⌘K` à droite.
- **Grille de colonnes** : `grid grid-cols-2 md:grid-cols-4 gap-3 p-4`, colonne `rounded-xl bg-white/[0.02] p-2`.
- **Carte ticket** : `rounded-lg border border-white/[0.08] bg-zinc-900/90 p-3 shadow-lg shadow-black/40` (id mono 10px + icône priorité, titre 12px `text-zinc-200`, tag).
- **Flottement** des cartes : `.mk-float` avec `animation-delay: (ci+i) * -1.3s`.
- **Carte « merge »** : toutes les 3.2 s bascule `In Review ↔ Done` via `motion layoutId="moving-card"`, `spring {stiffness:160, damping:20}`, style spécial `border-violet-500/50 shadow-[0_0_30px_-4px_rgb(139_92_246/0.6)]`.
- **Toast** flottant : `absolute -bottom-5 right-6 rounded-xl border border-emerald-500/30 bg-zinc-900/95 px-3.5 py-2.5 text-[12px] shadow-2xl shadow-emerald-900/30` — apparaît (opacity/y 12→0, 0.4s) quand mergé : « PR #128 merged → **ENG-42** Done » (id en `font-mono text-emerald-400`).

### 8.3 Palette de commandes qui « tape » en boucle
Texte « move ENG-42 to done » tapé toutes les 110 ms (`setInterval`, boucle avec pause de ~14 ticks), curseur `mk-caret` (`h-3.5 w-px bg-violet-400`, clignote `step-end 1s`). Conteneur `rounded-xl border border-white/10 bg-zinc-950/80 p-3 shadow-xl`, première ligne sélectionnée `bg-violet-500/15 text-violet-200`, autres `text-zinc-500`.

### 8.4 Pile isométrique SVG
`viewBox="0 0 220 150"`, 3 losanges superposés (`translate(0 -26*i)`), dégradé `#a78bfa → #6366f1`, `fill-opacity 0.25 + i*0.25`, faces latérales `#6366f1 @0.35` et `#8b5cf6 @0.5`, le niveau central en `.mk-float`.

### 8.5 Section scroll-driven (GitHub flow)
- `useScroll({ target, offset: ["start 0.8", "end 0.6"] })`.
- Rail : `h-px bg-white/10`, remplissage `useTransform(progress, [0,1], ["0%","100%"])` : `bg-gradient-to-r from-violet-500 to-indigo-400 shadow-[0_0_12px_rgb(139_92_246)]`.
- Étapes : `opacity` 0.35 → 1 et `scale` 0.94 → 1 quand `progress >= index - 0.4`.
- Icône d'étape : `h-[52px] w-[52px] rounded-2xl border border-white/10 bg-zinc-900 shadow-lg`.
- Halo de fond : `inset-x-0 top-1/4 h-96 max-w-3xl rounded-full bg-violet-600/10 blur-[110px]`.

### 8.6 Keycaps 3D (touches de clavier)
```tsx
<motion.div whileHover={{ y: 4 }} whileTap={{ y: 6 }}>
  <div className="flex h-20 w-full min-w-[5rem] items-center justify-center rounded-2xl border border-white/10
    bg-gradient-to-b from-zinc-700 to-zinc-800 font-mono text-xl text-zinc-100
    shadow-[0_6px_0_0_#18181b,0_14px_24px_-6px_rgb(0_0_0/0.7),inset_0_1px_0_rgb(255_255_255/0.15)]
    transition-shadow
    hover:shadow-[0_2px_0_0_#18181b,0_8px_16px_-6px_rgb(0_0_0/0.7),inset_0_1px_0_rgb(255_255_255/0.15)]">⌘K</div>
  <span className="text-xs text-zinc-500">Command menu</span>
</motion.div>
```
L'effet « touche enfoncée » = l'ombre pleine du bas (`0 6px 0`) rétrécit (`0 2px 0`) pendant que l'élément descend de 4–6 px.

### 8.7 Autres micro-effets
- Hover boutons : `scale 1.03` / `active:scale-95`.
- Navbar : transparente → `backdrop-blur-xl` + bordure au scroll.
- Flash realtime d'une carte : `animate-realtime-flash` (anneau vert `0 → 10px`, 0.7s).
- Point de statut live : `animate-pulse-dot`.
- Marquee (logos/texte) : `mk-marquee` (contenu dupliqué, `translateX(-50%)`, 40s linear).
- Sélection de texte : violet 30 %.

---

## 9. Pages d'auth (login / invite / 404)

`AuthShell` : `relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-6 py-16`, avec la même grille + aurora que le hero (halo `h-[30rem] w-[48rem]`, `rgb(139 92 246 / .32)`), logo centré, puis carte verre `max-w-sm`. Bouton primaire : `w-full rounded-full bg-white py-2.5 text-sm font-medium text-zinc-900 shadow-[0_0_40px_-8px_rgb(139_92_246/0.8)] hover:scale-[1.02] active:scale-95` ; secondaire : `border border-white/10 bg-white/[0.04] hover:bg-white/[0.08]`.

---

## 10. Checklist de reproduction

1. Installer `motion`, `lucide-react`, `clsx`, `tailwind-merge` ; charger Inter + JetBrains Mono (`next/font`).
2. Coller le CSS de la section 6 ; `<html class="dark">`, `<body class="min-h-svh antialiased">`.
3. Créer `Reveal`, `SpotlightCard`, `Brand`, `Navbar`.
4. Hero : grille + 2 auroras + H1 dégradé + 2 CTA + `Board3D`.
5. Bento 6 colonnes → GitHub flow (scroll) → Keycaps → Roadmap → CTA final (aurora centrée) → Footer.
6. Vérifier : `prefers-reduced-motion`, mobile (colonnes 2 → 4, grille bento empilée), contraste texte `zinc-400` sur `#09090b`.

Règle d'or : **peu de couleurs (zinc + un seul accent violet), beaucoup de transparence blanche, glow uniquement sur les éléments d'action, profondeur par perspective + ombres, animations lentes et subtiles.**
