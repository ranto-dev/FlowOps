import type { DocPage } from "../types";
import { code, h2, note, ol, p, table, tip, ul, warning } from "../content/blocks";

/** Onglet « Guides » — section « Guides » (pas à pas d'utilisation), version française. */
export const guidesUseFr: DocPage[] = [
  {
    slug: "sign-in",
    title: "Se connecter avec GitHub",
    description: "Comment fonctionne la connexion, ce que vous voyez, et comment vous déconnecter ou révoquer l'accès.",
    keywords: ["login", "device code", "authorize", "sign out", "session", "token", "connexion", "code d'activation", "autoriser", "déconnexion", "jeton"],
    blocks: [
      h2("Comment ça marche"),
      p(
        "FlowOps utilise la **connexion par appareil** de GitHub : au lieu de saisir un mot de passe dans FlowOps, vous confirmez la connexion sur GitHub même.",
      ),
      ol(
        "Ouvrez FlowOps et choisissez de vous connecter. Un court **code** s'affiche.",
        "Ouvrez le lien de vérification GitHub indiqué sur la page.",
        "Saisissez le code et vérifiez les autorisations demandées (voir [Ce qu'il vous faut](/docs/requirements)).",
        "Autorisez. FlowOps le détecte automatiquement et ouvre votre espace de travail.",
      ),
      note("FlowOps ne voit jamais votre mot de passe GitHub."),
      h2("Si le code expire"),
      p("Le code n'est valable que peu de temps. S'il expire avant que vous n'autorisiez, relancez la connexion pour en obtenir un nouveau."),
      h2("Votre session"),
      p(
        "Votre session est conservée dans votre navigateur. Si GitHub ne l'accepte plus (par exemple parce que vous avez révoqué l'accès), FlowOps vous déconnecte et vous demande de vous reconnecter.",
      ),
      h2("Se déconnecter"),
      p("Ouvrez le menu dans l'en-tête de l'espace de travail et choisissez **Se déconnecter**. Vous devrez vous authentifier à nouveau avec GitHub pour revenir."),
      h2("Révoquer l'accès"),
      p("Dans GitHub, ouvrez **Settings → Applications → Authorized OAuth Apps**, trouvez FlowOps et révoquez-le."),
    ],
  },
  {
    slug: "projects",
    title: "Créer et gérer des projets",
    description: "Un projet relie un dépôt GitHub à un workflow. Créez, ouvrez et supprimez vos projets.",
    keywords: ["project", "repository", "new project", "delete", "workspace", "projet", "dépôt", "nouveau projet", "supprimer", "espace de travail"],
    blocks: [
      h2("Qu'est-ce qu'un projet ?"),
      p(
        "Un projet relie **un dépôt GitHub** à **une configuration de workflow**. Il se trouve dans l'onglet **Projets** de votre espace de travail, et vous seul voyez vos projets.",
      ),
      h2("Créer un projet"),
      ol(
        "Choisissez **Nouveau projet**.",
        "Saisissez un **Nom du projet**, par exemple `Production API`.",
        "Sélectionnez un dépôt dans **Dépôt GitHub**. La liste affiche les dépôts accessibles depuis votre compte.",
        "Ajoutez éventuellement une **Description**.",
        "Choisissez **Initialiser**.",
      ),
      note(
        "Si la liste est vide ou affiche une erreur, votre compte GitHub n'a peut-être aucun dépôt accessible, ou votre session doit être renouvelée. Voir [Dépannage](/docs/troubleshooting).",
      ),
      h2("Ce qu'affiche une carte de projet"),
      ul(
        "Le nom du projet, sa description et le dépôt lié.",
        "**Pas encore de pipeline** : rien n'est configuré. Choisissez **Créer un workflow**.",
        "**Pipeline actif** : un workflow est enregistré. Choisissez **Modifier le workflow** pour le changer, ou **Run** pour le lancer.",
      ),
      p("Utilisez **Rechercher des projets** pour filtrer la liste par nom ou par dépôt."),
      h2("Supprimer un projet"),
      p("Choisissez **Supprimer** sur la carte et confirmez. Le projet et sa configuration de workflow enregistrée sont retirés de FlowOps. Cette action est irréversible."),
      warning(
        "Supprimer un projet ne retire **pas** un fichier de workflow déjà publié dans votre dépôt. Supprimez `.github/workflows/<file>` dans GitHub si vous voulez l'effacer.",
        "Votre dépôt n'est pas modifié",
      ),
    ],
  },
  {
    slug: "build-workflow",
    title: "Construire un workflow",
    description: "Visite guidée du formulaire de configuration, des déclencheurs aux jobs et aux étapes.",
    keywords: ["form", "configuration", "trigger", "branch", "environment variables", "job", "runner", "needs", "matrix", "generate", "formulaire", "déclencheur", "branche", "variables d'environnement", "dépendances", "matrice", "générer"],
    blocks: [
      p(
        "Ouvrez un projet et choisissez **Créer un workflow** (ou **Modifier le workflow**). Le formulaire comporte deux parties : **Configuration du pipeline** et **Jobs et orchestration**.",
      ),
      h2("Configuration du pipeline"),
      table(
        ["Champ", "Quoi saisir"],
        ["**Nom du fichier workflow**", "Le fichier créé dans votre dépôt, par ex. `ci.yaml`"],
        ["**Nom du workflow**", "Le nom affiché par GitHub pour le workflow"],
        ["**Événements déclencheurs**", "Quand le workflow démarre : `push`, `pull_request`, `workflow_dispatch`"],
        ["**Filtre de branches**", "Les branches qui le déclenchent, séparées par des virgules, par ex. `main, develop`"],
        ["**Variables d’environnement globales**", "Un `NOM=valeur` par ligne, disponible pour tous les jobs"],
      ),
      tip(
        "Quel que soit votre choix, FlowOps ajoute toujours un déclencheur caché pour que le bouton **Run** puisse lancer le workflow à la demande. Voir [Comment FlowOps fonctionne avec GitHub](/docs/how-it-works).",
      ),
      h2("Jobs et orchestration"),
      p("Un **job** est un groupe d'étapes exécutées ensemble sur une même machine. Choisissez **Ajouter un job** pour en créer un."),
      table(
        ["Champ", "Ce qu'il fait"],
        ["**Nom du job**", "Identifie le job, par ex. `build` ou `deploy`"],
        ["**Runner**", "La machine : `ubuntu-latest` (Linux), `windows-latest` ou `macos-latest`"],
        ["**Dépendances**", "Les jobs qui doivent réussir d'abord. Sans dépendance, les jobs s'exécutent en parallèle"],
        ["**Clé de matrice / Valeurs de matrice**", "Exécute le même job plusieurs fois avec des valeurs différentes, par ex. `node-version` avec `18, 20, 22`"],
      ),
      h2("Étapes du workflow"),
      p(
        "Dans un job, ajoutez des **étapes** : les actions individuelles, exécutées dans l'ordre. Chaque étape a un **Nom** et un type. Le choix du bon type est expliqué dans [Choisir vos étapes](/docs/choose-steps).",
      ),
      h2("Générer le YAML"),
      p("Une fois terminé, choisissez **Générer le YAML du workflow**. FlowOps compile le formulaire et ouvre l'aperçu. Voir [Aperçu et enregistrement](/docs/preview-and-save)."),
      h2("Anticiper avant de lancer"),
      p("Pendant que vous configurez, un panneau peut estimer la durée d'exécution et le risque d'échec. Voir [Comprendre les prédictions](/docs/understand-predictions)."),
    ],
  },
  {
    slug: "choose-steps",
    title: "Choisir vos étapes",
    description: "Les six types d'étapes, ce que chacun fait et quand l'utiliser.",
    keywords: ["checkout", "node", "npm", "docker", "artifact", "shell", "custom", "script", "step types", "étapes", "types d'étapes", "artefact", "commande personnalisée"],
    blocks: [
      p("Chaque étape d'un job est de l'un de ces six types."),
      table(
        ["Étape", "À utiliser pour…", "Vous fournissez"],
        ["**Récupérer le dépôt**", "Placer le code de votre dépôt sur le runner. Presque tous les jobs commencent par là.", "Rien"],
        ["**Configurer Node.js**", "Installer une version de Node.js", "Version : 18, 20 ou 22"],
        ["**Exécuter npm**", "Lancer une commande npm", "`npm install`, `npm ci`, `npm run lint`, `npm test` ou `npm run build`"],
        ["**Construire l’image Docker**", "Construire une image et la pousser vers un registre", "Nom de l'image et registre (Docker Hub ou GitHub Packages)"],
        ["**Téléverser un artefact**", "Conserver les fichiers produits par le job (résultat de build, rapports)", "Un chemin, par ex. `dist/`"],
        ["**Commande personnalisée**", "Tout le reste", "Votre commande ou script"],
      ),
      h2("Bon à savoir"),
      ul(
        "**L'ordre compte.** Placez d'abord **Récupérer le dépôt**, puis la configuration, puis l'installation, puis les tests et le build.",
        "**`npm ci` ou `npm install` ?** Préférez `npm ci` dans les pipelines : il installe exactement ce que dit votre lockfile, plus vite et de façon plus reproductible.",
        "**Matrice et Node.js.** Si le job a une clé de matrice contenant `node` (comme `node-version`), l'étape **Configurer Node.js** utilise automatiquement la valeur de la matrice.",
      ),
      warning(
        "L'étape **Construire l’image Docker** construit, tague et pousse l'image, mais elle ne **se connecte pas** au registre. Ajoutez avant elle une étape **Commande personnalisée** qui s'authentifie, avec un secret défini dans les paramètres de votre dépôt. Voir la [recette Docker](/docs/recipes).",
        "Docker nécessite une connexion",
      ),
    ],
  },
  {
    slug: "recipes",
    title: "Recettes",
    description: "Des configurations prêtes à l'emploi pour les pipelines les plus courants.",
    keywords: ["example", "node", "ci", "matrix", "docker", "deploy", "main", "template", "exemple", "matrice", "déploiement", "modèle"],
    blocks: [
      h2("Intégration continue Node.js"),
      p("Vérifiez chaque changement : lint, tests et build."),
      ul(
        "**Événements déclencheurs** : `push` et `pull_request` · **Filtre de branches** : `main`",
        "**Job** `build` sur `ubuntu-latest`",
        "**Étapes** : Récupérer le dépôt → Configurer Node.js (20) → `npm ci` → `npm run lint` → `npm test` → `npm run build`",
      ),
      h2("Tester sur plusieurs versions de Node.js"),
      p("Assurez-vous que votre code fonctionne sur toutes les versions que vous supportez."),
      ul(
        "Même job que ci-dessus, plus la **Clé de matrice** `node-version` et les **Valeurs de matrice** `18, 20, 22`.",
        "La clé contient `node` : **Configurer Node.js** utilise donc automatiquement chaque valeur. Le job s'exécute trois fois en parallèle.",
      ),
      h2("Ne lancer que sur la branche main"),
      ul(
        "Définissez le **Filtre de branches** sur `main`.",
        "Gardez `push` et `pull_request` comme **Événements déclencheurs** : les deux ne réagiront alors qu'à la branche `main`.",
      ),
      h2("Déployer seulement si les tests passent"),
      ul(
        "Créez un second job `deploy`.",
        "Dans **Dépendances**, sélectionnez `build` : `deploy` l'attend et est ignoré s'il échoue.",
        "Ajoutez votre déploiement dans une étape **Commande personnalisée**, et définissez le **Filtre de branches** sur `main` pour que les déploiements ne suivent que la branche principale.",
      ),
      h2("Construire et pousser une image Docker"),
      ol(
        "Créez un job `docker` qui dépend de `build`.",
        "Ajoutez **Récupérer le dépôt**.",
        "Ajoutez une étape **Commande personnalisée** qui se connecte au registre. Pour GitHub Packages : `echo \"${{ secrets.GITHUB_TOKEN }}\" | docker login ghcr.io -u ${{ github.actor }} --password-stdin`",
        "Ajoutez une étape **Construire l’image Docker** avec votre **Nom de l’image** et le registre **GitHub Packages (GHCR)**.",
      ),
      code(
        "yaml",
        `  docker:
    runs-on: ubuntu-latest
    needs:
      - build
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
      - name: Registry login
        run: echo "\${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u \${{ github.actor }} --password-stdin
      - name: Build and push
        run: |
          docker build -t my-app .
          docker tag my-app ghcr.io/\${{ github.repository_owner }}/my-app:latest
          docker push ghcr.io/\${{ github.repository_owner }}/my-app:latest`,
        "Job obtenu (simplifié)",
      ),
      note("Pousser vers GitHub Packages avec `GITHUB_TOKEN` peut aussi exiger que le workflow ait la permission d'écriture sur les packages dans les paramètres de votre dépôt."),
      h2("Conserver le résultat du build"),
      ul(
        "Après `npm run build`, ajoutez une étape **Téléverser un artefact** avec le chemin `dist/`.",
        "Les fichiers sont attachés à l'exécution sur GitHub, où vous pouvez les télécharger.",
      ),
    ],
  },
  {
    slug: "preview-and-save",
    title: "Prévisualiser et enregistrer le YAML",
    description: "Lisez le YAML généré, puis enregistrez-le dans votre projet.",
    keywords: ["yaml", "preview", "save", "reconfigure", "generate", "edit", "aperçu", "enregistrer", "reconfigurer", "générer", "modifier"],
    blocks: [
      h2("Relire avant de publier"),
      p(
        "Après **Générer le YAML du workflow**, FlowOps affiche l'**Aperçu YAML** : le fichier exact qui sera publié. Pas besoin de comprendre chaque ligne, mais une lecture rapide vaut le coup : les déclencheurs en haut, puis les jobs, puis les étapes de chaque job.",
      ),
      h2("Enregistrer"),
      p("Choisissez **Enregistrer le workflow**. Il est stocké dans votre projet, et la carte du projet passe à **Pipeline actif**. Enregistrer ne publie encore rien sur GitHub."),
      h2("Modifier quelque chose"),
      p("Choisissez **Reconfigurer** pour revenir au formulaire, ajustez-le, puis régénérez le YAML. **Nouveau workflow** démarre une configuration vierge. Le fil d'Ariane en haut vous permet de revenir à votre projet ou à la liste des projets."),
      h2("Modifier plus tard"),
      p("À tout moment, choisissez **Modifier le workflow** sur la carte du projet pour rouvrir le formulaire."),
      tip("L'aperçu et le fichier publié viennent du même générateur : ce que vous lisez est ce que vous obtenez."),
    ],
  },
  {
    slug: "run-workflow",
    title: "Lancer un workflow",
    description: "Ce qui se passe quand vous choisissez Run, et ce que vous voyez ensuite sur GitHub.",
    keywords: ["execute", "run", "trigger", "publish", "commit", "dispatch", "exécuter", "lancer", "déclencher", "publier"],
    blocks: [
      h2("Démarrer une exécution"),
      p("Sur une carte de projet affichant **Pipeline actif**, choisissez **Run**."),
      h2("Ce que fait FlowOps"),
      ol(
        "Publie votre fichier de workflow dans `.github/workflows/` du dépôt lié, sur la branche `main`. Cela apparaît comme un commit dans l'historique de votre dépôt.",
        "Envoie à GitHub un événement qui démarre le workflow.",
        "Vous emmène dans l'onglet **Historique** pour suivre l'exécution.",
      ),
      note("C'est GitHub, pas FlowOps, qui exécute vos jobs. Une exécution peut rester **En attente** quelques secondes avant de démarrer."),
      h2("Ce que vous verrez sur GitHub"),
      ul(
        "Un commit nommé comme `ci(flowops): update/create workflow ci.yaml via FlowOps Studio` sur `main`.",
        "Le workflow listé dans l'onglet **Actions** de votre dépôt.",
        "Une exécution par lancement, avec les mêmes logs que ceux affichés par FlowOps.",
      ),
      h2("À chaque lancement"),
      p("Le fichier est mis à jour s'il existe déjà : ce que vous modifiez dans FlowOps est donc toujours ce qui s'exécute. Les modifications faites à la main sur ce fichier dans GitHub sont écrasées."),
      warning(
        "Si votre branche `main` est protégée contre les commits directs, GitHub peut refuser la publication et l'exécution ne démarrera pas. Voir [Dépannage](/docs/troubleshooting).",
        "Branches protégées",
      ),
    ],
  },
  {
    slug: "monitor-runs",
    title: "Suivre les exécutions et lire les logs",
    description: "Suivez vos exécutions, explorez un job et lisez ses logs.",
    keywords: ["history", "logs", "status", "failed", "succeeded", "queued", "running", "job", "steps", "copy", "historique", "état", "échoué", "réussi", "en attente", "en cours", "étapes", "copier"],
    blocks: [
      h2("Ouvrir l'historique"),
      p("Allez dans l'onglet **Historique** et choisissez un projet. **Exécutions récentes** liste ses dernières exécutions, les plus récentes en premier. Utilisez **Actualiser** pour mettre la liste à jour."),
      h2("États"),
      table(
        ["État", "Signification"],
        ["**En attente**", "Attend qu'une machine soit disponible"],
        ["**En cours**", "En cours d'exécution"],
        ["**Réussi**", "Toutes les étapes ont réussi"],
        ["**Échoué**", "Au moins une étape a échoué : ouvrez les logs pour voir laquelle"],
      ),
      p("Chaque exécution affiche aussi son déclencheur, la **Branche**, le **Commit** et sa date de **Mis à jour**. **Ouvrir sur GitHub** vous emmène sur l'exécution dans github.com."),
      h2("Jobs et étapes"),
      p("Sélectionnez une exécution pour voir **Jobs et étapes**, avec le résultat de chaque étape. Utilisez **Retour aux exécutions** pour revenir à la liste."),
      h2("Lire les logs"),
      ol(
        "Dans **Jobs et étapes**, sélectionnez un job.",
        "Ses logs s'affichent en dessous.",
        "Utilisez **Copier les logs** pour les copier, ou **Aller en bas** pour sauter aux dernières lignes.",
      ),
      h2("Trouver pourquoi une exécution a échoué"),
      ul(
        "Ouvrez le job en échec et faites défiler jusqu'à la première ligne rouge ou d'erreur : les erreurs suivantes en découlent souvent.",
        "Repérez le nom de l'étape juste au-dessus pour savoir quelle partie de votre pipeline a échoué.",
        "Corrigez la cause, puis choisissez **Run** à nouveau.",
      ),
      note(
        "**Les logs du job ne sont pas encore disponibles.** GitHub ne fournit les logs qu'une fois le job démarré. Patientez quelques secondes et actualisez.",
        "Logs vides ?",
      ),
    ],
  },
  {
    slug: "understand-predictions",
    title: "Comprendre les prédictions",
    description: "Comment FlowOps estime la durée d'exécution et le risque d'échec, et comment utiliser ces chiffres.",
    keywords: ["prediction", "duration", "risk", "forecast", "failure", "machine learning", "estimate", "prédiction", "durée", "risque", "échec", "estimation", "apprentissage automatique"],
    blocks: [
      h2("Ce que vous obtenez"),
      p("Pendant que vous configurez un workflow, FlowOps peut afficher deux estimations :"),
      ul(
        "**Durée estimée**, en secondes : le temps qu'une exécution devrait prendre.",
        "**Risque d’échec**, en pourcentage : la probabilité qu'une exécution échoue.",
      ),
      h2("Lire le risque"),
      table(
        ["Risque d'échec", "Niveau", "Que faire"],
        ["0 % – 30 %", "Faible", "Rien de particulier"],
        ["30 % – 70 %", "Moyen", "Vérifiez que les étapes de test et de build sont présentes et cohérentes"],
        ["70 % – 100 %", "Élevé", "Revoyez la configuration avant de lancer ; attendez-vous à des échecs"],
      ),
      h2("Comment c'est calculé"),
      p(
        "Deux modèles examinent la forme de votre workflow (nombre de jobs et d'étapes, build, tests ou déploiement, mode de déclenchement, runner) et, quand ils existent, les exécutions passées du dépôt.",
      ),
      h2("À garder en tête"),
      ul(
        "Ce sont des **estimations**, pas des promesses.",
        "Les modèles sont livrés entraînés sur des **données d'exemple**. Tant qu'ils ne sont pas réentraînés sur de vraies exécutions, considérez les chiffres comme indicatifs.",
        "Une prédiction nécessite que le service de prédiction soit disponible. Sinon, le reste de FlowOps fonctionne normalement.",
      ),
      tip("Les estimations deviennent plus utiles à mesure que votre dépôt accumule de l'historique d'exécutions."),
    ],
  },
];
