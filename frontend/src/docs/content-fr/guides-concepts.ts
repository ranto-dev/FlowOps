import type { DocPage } from "../types";
import { code, h2, note, ol, p, table, ul } from "../content/blocks";

/** Onglet « Guides » — section « Fonctionnement » (comprendre sans lire le code). */
export const guidesConceptsFr: DocPage[] = [
  {
    slug: "how-it-works",
    title: "Comment FlowOps fonctionne avec GitHub",
    navTitle: "Fonctionnement avec GitHub",
    description: "Ce que FlowOps fait en coulisses, et comment il s'intègre à votre workflow Git habituel.",
    keywords: ["approach", "workflow file", "commit", "repository_dispatch", "git", "main", ".github/workflows", "trigger", "approche", "fichier de workflow", "déclencheur", "fonctionnement"],
    blocks: [
      h2("L'idée en une phrase"),
      p(
        "FlowOps **prépare** un fichier de workflow GitHub Actions standard, le **publie** dans votre dépôt et le **lance**. C'est GitHub qui fait le travail.",
      ),
      h2("Ce qui se passe quand vous cliquez sur Exécuter"),
      ol(
        "**Compiler** — votre formulaire devient un fichier YAML GitHub Actions.",
        "**Publier** — le fichier est commité dans `.github/workflows/` sur votre branche `main`.",
        "**Lancer** — FlowOps envoie à GitHub un événement qui démarre le workflow.",
        "**Observer** — FlowOps lit les exécutions et les logs depuis GitHub et vous les affiche.",
      ),
      code(
        "text",
        `Your form  ──▶  FlowOps  ──▶  .github/workflows/ci.yaml  ──▶  GitHub Actions
                  (generates)     (committed on main)               (runs the jobs)
                      ▲                                                  │
                      └──────────  runs and logs read back  ◀────────────┘`,
      ),
      h2("Pourquoi un déclencheur caché ?"),
      p(
        "En plus des déclencheurs que vous choisissez (comme `push`), chaque workflow généré par FlowOps écoute aussi un événement personnalisé nommé `flowops_trigger`. C'est ce qu'envoie le bouton **Exécuter**. Il vous permet de lancer une exécution à la demande, même sans nouveau commit.",
      ),
      h2("Comment il s'intègre à votre workflow Git"),
      ul(
        "Le fichier de workflow est **versionné comme n'importe quel autre fichier** : vous le retrouvez dans votre historique, vous pouvez le relire et l'annuler.",
        "FlowOps **commite directement sur `main`**. Si votre équipe protège `main` contre les commits directs, consultez [Limites](/docs/limits).",
        "Votre pipeline s'exécute ensuite tout seul sur les déclencheurs choisis (un push, une pull request…), exactement comme un workflow écrit à la main.",
        "Vous pouvez arrêter d'utiliser FlowOps quand vous voulez : le fichier reste dans votre dépôt et continue de fonctionner.",
      ),
      note("Si vous modifiez le fichier à la main puis cliquez à nouveau sur **Exécuter** dans FlowOps, FlowOps écrase vos modifications avec le contenu du formulaire."),
    ],
  },
  {
    slug: "security-privacy",
    title: "Sécurité et confidentialité",
    description: "Les accès dont dispose FlowOps, ce qu'il stocke, et ce qu'il ne stocke pas.",
    keywords: ["security", "privacy", "token", "data", "storage", "permissions", "stored", "revoke", "sécurité", "confidentialité", "jeton", "données", "stockage", "permissions", "révoquer"],
    blocks: [
      h2("Accès à votre compte GitHub"),
      ul(
        "Vous vous connectez via GitHub ; FlowOps ne voit jamais votre mot de passe GitHub.",
        "FlowOps reçoit un jeton d'accès limité aux trois permissions que vous approuvez (`user`, `repo`, `workflow`).",
        "Le jeton est conservé **dans votre navigateur** et envoyé avec vos requêtes pour que FlowOps agisse en votre nom. Se déconnecter le supprime de votre session.",
        "Vous pouvez révoquer l'accès à tout moment depuis les paramètres de GitHub.",
      ),
      h2("Ce que FlowOps stocke"),
      table(
        ["Donnée", "Détails"],
        ["Votre profil", "Identifiant GitHub, nom d'utilisateur, avatar et date de dernière connexion"],
        ["Vos projets", "Nom, description, dépôt lié, état du workflow"],
        ["Vos workflows", "La configuration saisie et le YAML généré"],
        ["Demandes de prédiction", "Nom du workflow, dépôt et valeurs estimées, pour suivre la précision"],
      ),
      h2("Ce que FlowOps ne stocke pas"),
      ul(
        "Votre mot de passe GitHub.",
        "Le code source de votre dépôt.",
        "Vos logs d'exécution : ils sont lus depuis GitHub à chaque ouverture.",
      ),
      h2("Qui peut voir vos projets"),
      p("Vous seul. Les projets sont liés à votre compte GitHub, et un autre utilisateur qui demande l'un de vos projets reçoit une réponse *introuvable*."),
      h2("Secrets dans vos pipelines"),
      p(
        "N'écrivez jamais de mots de passe ou de jetons dans le formulaire : le fichier de workflow est stocké dans votre dépôt. Utilisez les **secrets de dépôt GitHub** (Settings → Secrets and variables → Actions) et référencez-les dans une commande shell avec `${{ secrets.NAME }}`.",
      ),
    ],
  },
  {
    slug: "limits",
    title: "Limites",
    description: "Ce que FlowOps ne fait pas aujourd'hui, pour vous aider à anticiper.",
    keywords: ["limitations", "constraints", "main branch", "protected branch", "support", "not supported", "limites", "contraintes", "branche protégée", "non pris en charge"],
    blocks: [
      table(
        ["Limite", "Ce que cela implique pour vous", "Solution de contournement"],
        [
          "**GitHub uniquement**",
          "Les autres plateformes, comme GitLab ou Bitbucket, ne sont pas prises en charge",
          "—",
        ],
        [
          "**Branche `main`**",
          "Le fichier de workflow est toujours publié sur `main`. Les dépôts dont la branche par défaut porte un autre nom ne sont pas pris en charge, et une branche `main` protégée peut refuser le commit",
          "Autorisez le commit, ou copiez vous-même le YAML généré dans votre dépôt",
        ],
        [
          "**Un workflow par projet**",
          "Un projet contient une seule configuration de workflow",
          "Créez plusieurs projets sur le même dépôt",
        ],
        [
          "**Six types d'étapes**",
          "Checkout, Node.js, npm, Docker, téléversement d'artefact et commandes shell",
          "Utilisez une étape **Commande personnalisée**, ou modifiez le fichier généré à la main",
        ],
        [
          "**Pas de fonctionnalités avancées**",
          "Les workflows réutilisables, les conteneurs de service et les conditions (`if`) sur les jobs ou les étapes ne sont pas proposés dans le formulaire",
          "Modifiez le fichier généré à la main",
        ],
        [
          "**Estimations indicatives**",
          "Les prédictions sont entraînées sur des données d'exemple tant qu'elles ne sont pas réentraînées sur de vraies exécutions",
          "Considérez-les comme un repère",
        ],
      ),
    ],
  },
];
