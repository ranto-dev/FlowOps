import type { DocPage } from "../types";
import { code, h2, note, ol, p, table, tip, ul } from "../content/blocks";

/** Onglet « Guides » — section « Start here ». Ton « vous », sans jargon. */
export const guidesStartFr: DocPage[] = [
  {
    slug: "what-is-flowops",
    title: "Qu'est-ce que FlowOps ?",
    navTitle: "Qu'est-ce que FlowOps ?",
    description:
      "FlowOps vous permet de créer et d'exécuter des pipelines CI/CD sur GitHub Actions en remplissant un formulaire, au lieu d'écrire du YAML à la main.",
    keywords: ["overview", "introduction", "ci/cd", "low-code", "github actions", "présentation", "aperçu"],
    blocks: [
      h2("Le problème résolu"),
      p(
        "Un pipeline CI/CD automatise ce qui se passe après un push : installer les dépendances, lancer les tests, construire le projet, publier une image. Sur GitHub, ces pipelines sont des **workflows GitHub Actions**, écrits dans des fichiers YAML. La syntaxe est stricte et sans pitié : une mauvaise indentation ou une clé mal orthographiée, et rien ne s'exécute.",
      ),
      h2("Ce que fait FlowOps"),
      ol(
        "Vous vous connectez avec votre compte GitHub et choisissez l'un de vos dépôts.",
        "Vous décrivez votre pipeline dans un formulaire : quand il s'exécute, quels jobs, quelles étapes.",
        "FlowOps écrit le YAML GitHub Actions à votre place et vous laisse le relire.",
        "Un clic le publie dans votre dépôt et lance une exécution.",
        "Vous suivez les exécutions et lisez leurs logs sans quitter FlowOps.",
      ),
      h2("Ce que FlowOps n'est pas"),
      ul(
        "**Pas un remplaçant de GitHub Actions.** Vos pipelines s'exécutent toujours sur GitHub. FlowOps les prépare et vous donne une vue claire de ce qui se passe.",
        "**Pas un verrou propriétaire.** Le résultat est un fichier de workflow classique dans votre dépôt. Il continue de fonctionner si vous arrêtez FlowOps, et vous pouvez le modifier à la main.",
      ),
      h2("À qui s'adresse-t-il ?"),
      ul(
        "Aux développeurs qui veulent un pipeline fonctionnel rapidement, sans apprendre la syntaxe YAML.",
        "Aux équipes qui veulent que chaque projet suive le même pipeline, de façon cohérente.",
        "Aux débutants en CI/CD qui veulent voir comment un pipeline est construit et ce qu'il produit.",
      ),
      tip(
        "Prêt à essayer ? Consultez [ce dont vous avez besoin](/docs/requirements), puis suivez le [démarrage rapide en 5 minutes](/docs/quick-start).",
      ),
    ],
  },
  {
    slug: "why-flowops",
    title: "Pourquoi utiliser FlowOps ?",
    navTitle: "Pourquoi utiliser FlowOps ?",
    description:
      "Les bénéfices, une comparaison honnête avec l'écriture du YAML soi-même, et les cas où FlowOps n'est pas le bon outil.",
    keywords: ["benefits", "advantages", "comparison", "yaml", "when to use", "bénéfices", "avantages", "comparaison", "quand l'utiliser"],
    blocks: [
      h2("Ce que vous y gagnez"),
      ul(
        "**Rapidité** — un premier pipeline fonctionnel en quelques minutes, pas en heures de tâtonnements.",
        "**Moins d'erreurs** — le formulaire ne propose que des options valides, et le YAML est généré par le même code à chaque fois.",
        "**Cohérence** — chaque projet reçoit la même structure, ce qui rend les pipelines plus faciles à lire et à relire.",
        "**Clarté** — exécutions, étapes et logs sont réunis au même endroit, avec des statuts lisibles.",
        "**Anticipation** — avant d'exécuter, FlowOps estime la durée du pipeline et son risque d'échec (voir [Comprendre les prédictions](/docs/understand-predictions)).",
        "**Liberté** — le résultat est du YAML standard dans votre propre dépôt.",
      ),
      h2("FlowOps comparé au YAML écrit à la main"),
      table(
        ["", "YAML écrit à la main", "FlowOps"],
        ["Courbe d'apprentissage", "Il faut apprendre la syntaxe et les actions disponibles", "Vous remplissez des champs étiquetés"],
        ["Fautes de frappe et indentation", "Fréquentes ; détectées seulement quand l'exécution échoue", "Impossibles : le YAML est généré"],
        ["Aperçu avant publication", "Non intégré", "Toujours, avant l'enregistrement"],
        ["Suivi des exécutions et des logs", "Sur le site de GitHub", "Dans FlowOps, ou sur GitHub"],
        ["Fonctionnalités avancées", "Tout ce qu'offre GitHub Actions", "Uniquement les [types d'étapes pris en charge](/docs/choose-steps)"],
      ),
      h2("Quand FlowOps n'est pas le bon outil"),
      p("FlowOps couvre les besoins courants d'un pipeline de build, de test et de publication. Ce n'est pas le meilleur choix si vous avez besoin de :"),
      ul(
        "workflows réutilisables, conteneurs de service ou autres fonctionnalités avancées de GitHub Actions ;",
        "un workflow qui doit vivre sur une autre branche que `main` ;",
        "une plateforme CI autre que GitHub.",
      ),
      note(
        "Vous pouvez tout de même démarrer dans FlowOps et affiner ensuite le fichier généré à la main. Voir [Limites](/docs/limits).",
      ),
    ],
  },
  {
    slug: "requirements",
    title: "Ce dont vous avez besoin",
    description: "Faut-il un compte GitHub ? Quelles permissions sont demandées ? Combien ça coûte ?",
    keywords: ["github account", "prerequisites", "permissions", "scopes", "repository", "free", "cost", "private", "compte github", "prérequis", "dépôt", "gratuit", "coût", "privé"],
    blocks: [
      h2("Un compte GitHub — oui"),
      p(
        "FlowOps fonctionne uniquement avec GitHub. Vous vous connectez avec votre compte GitHub : il n'y a ni mot de passe FlowOps distinct, ni autre méthode de connexion. Un compte GitHub gratuit suffit.",
      ),
      h2("Un dépôt en écriture"),
      p(
        "Votre pipeline est publié sous forme de fichier dans l'un de vos dépôts : vous avez donc besoin d'un **accès en écriture** à celui-ci. Vos propres dépôts, ainsi que ceux d'une organisation où vous avez un accès en écriture, apparaîtront dans le formulaire de projet. Les dépôts privés fonctionnent aussi.",
      ),
      h2("Les permissions demandées par FlowOps"),
      p("À la connexion, GitHub vous montre ce que vous autorisez. FlowOps demande trois permissions :"),
      table(
        ["Permission", "Pourquoi FlowOps en a besoin"],
        ["`user`", "Lire votre nom et votre avatar pour afficher qui est connecté"],
        ["`repo`", "Lister vos dépôts et publier le fichier de workflow dans celui que vous choisissez"],
        ["`workflow`", "Créer ou mettre à jour des fichiers dans `.github/workflows/` et lancer une exécution"],
      ),
      p("Vous pouvez consulter ou révoquer cet accès à tout moment dans vos paramètres GitHub, sous **Applications**."),
      h2("Est-ce payant ?"),
      p(
        "FlowOps n'exécute pas vos pipelines : c'est GitHub qui le fait. L'usage de GitHub Actions dépend donc de votre offre GitHub et de ses minutes incluses. Consultez la page de tarification de GitHub pour connaître les limites applicables à votre compte.",
      ),
      h2("Rien à installer"),
      p("FlowOps s'exécute dans votre navigateur. Vous n'avez besoin ni de Node.js, ni de Docker, ni d'aucun outil sur votre ordinateur pour l'utiliser."),
      tip("Poursuivez avec la [visite de l'application](/docs/app-tour) ou passez directement au [démarrage rapide](/docs/quick-start)."),
    ],
  },
  {
    slug: "app-tour",
    title: "Visite de l'application",
    description: "Les cinq écrans de FlowOps et leur utilité.",
    keywords: ["interface", "screens", "workspace", "navigation", "tabs", "history", "help", "écrans", "espace de travail", "onglets", "historique", "aide"],
    blocks: [
      h2("1. La page d'accueil"),
      p("Elle présente FlowOps et mène à l'écran de connexion. Une fois connecté, vous accédez directement à votre espace de travail."),
      h2("2. Connexion"),
      p(
        "FlowOps affiche un court code. Vous le saisissez sur GitHub pour autoriser l'application. Voir [Se connecter avec GitHub](/docs/sign-in).",
      ),
      h2("3. L'espace de travail"),
      p("Votre point de départ une fois connecté. Il comporte trois onglets :"),
      table(
        ["Onglet", "À quoi il sert"],
        ["**Projects**", "Créer des projets, ouvrir leur configuration, lancer un workflow"],
        ["**History**", "Suivre les exécutions d'un projet et lire les logs de n'importe quel job"],
        ["**Help**", "De brèves indications et un lien vers cette documentation"],
      ),
      p("Le menu de l'en-tête permet de **vous déconnecter**."),
      h2("4. La configuration du workflow"),
      p(
        "Ouverte depuis un projet avec **Create workflow** ou **Edit workflow**. C'est ici que vous décrivez votre pipeline dans un formulaire, puis générez et relisez le YAML. Voir [Construire un workflow](/docs/build-workflow).",
      ),
      h2("5. Exécutions et logs"),
      p(
        "Dans l'onglet **History**, vous choisissez un projet, une exécution, puis un job, et vous lisez ses logs. Voir [Suivre les exécutions et lire les logs](/docs/monitor-runs).",
      ),
    ],
  },
  {
    slug: "quick-start",
    title: "Démarrage rapide",
    description: "Passez de zéro à un pipeline en cours d'exécution en cinq minutes.",
    keywords: ["getting started", "first workflow", "tutorial", "5 minutes", "first pipeline", "démarrage", "premier workflow", "tutoriel", "premier pipeline"],
    blocks: [
      p("Ce pas-à-pas crée un pipeline Node.js simple qui installe les dépendances et lance vos tests."),
      h2("Avant de commencer"),
      ul(
        "Un compte GitHub et un dépôt contenant un projet Node.js (`package.json` avec un script `test`). Voir [Ce dont vous avez besoin](/docs/requirements).",
      ),
      h2("1. Connectez-vous"),
      p("Ouvrez FlowOps et choisissez de vous connecter. Saisissez le code affiché sur GitHub et autorisez l'application."),
      h2("2. Créez un projet"),
      ol(
        "Dans l'onglet **Projects**, choisissez **New project**.",
        "Saisissez un **Project name**.",
        "Choisissez votre dépôt dans **GitHub repository**.",
        "Choisissez **Initialize**.",
      ),
      h2("3. Configurez le workflow"),
      ol(
        "Sur la carte de votre projet, choisissez **Create workflow**.",
        "Dans **Pipeline configuration**, gardez le nom de fichier par défaut ou choisissez-en un comme `ci.yaml`.",
        "Pour **Trigger events**, sélectionnez `push`, et réglez le **Branch filter** sur `main`.",
        "Sous **Workflow steps**, ajoutez : **Checkout**, puis **Set up Node.js** (version 20), puis une étape **Run npm** avec `npm ci`, puis une autre avec `npm test`.",
        "Choisissez **Generate workflow YAML**.",
      ),
      h2("4. Relisez et enregistrez"),
      p("Lisez l'aperçu du YAML, puis choisissez **Save workflow**. La carte de votre projet indique désormais qu'un pipeline est actif."),
      h2("5. Lancez-le"),
      p(
        "Choisissez **Run** sur la carte du projet. FlowOps publie le fichier dans votre dépôt et lance le workflow. Vous arrivez sur l'onglet **History**.",
      ),
      h2("6. Lisez le résultat"),
      p(
        "Ouvrez la nouvelle exécution, sélectionnez un job et lisez ses logs. Un statut vert **Succeeded** signifie que toutes les étapes ont réussi. S'il indique **Failed**, les logs vous disent quelle étape a échoué.",
      ),
      code(
        "yaml",
        `name: CI
on:
  push:
    branches:
      - main
  repository_dispatch:
    types:
      - flowops_trigger
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test`,
        "Ce que FlowOps publie (simplifié)",
      ),
      tip("Ensuite : découvrez toutes les options du formulaire dans [Construire un workflow](/docs/build-workflow), ou copiez une configuration prête à l'emploi depuis les [recettes](/docs/recipes)."),
    ],
  },
];
