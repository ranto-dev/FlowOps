# Plans temporaires — session

Utiliser ce fichier pour noter les plans de travail générés au cours de cette session.

## Plan en cours — refonte du workspace

**Objectif**

Réorganiser l’espace de travail FlowOps autour d’une barre supérieure, d’une barre latérale gauche et d’un contenu commun structuré en introduction, filtres si pertinents, puis contenu. Rendre la configuration de workflow et ses prédictions visibles côte à côte, et afficher un résumé des prédictions dans l’aperçu YAML.

**État initial observé**

- `frontend/src/pages/Workspace.tsx` gère les vues Projets, Historique, Aide et Configuration. La navigation est actuellement dans l’en-tête, avec un tiroir mobile; les projets ont déjà une recherche textuelle.
- Le menu de profil contient l’identité et la déconnexion, tandis que `PreferenceControls` (thème + langue) est séparé dans la barre supérieure.
- `WorkflowForm.tsx` place actuellement « Generate workflow YAML » en bas du formulaire.
- `PredictionPanel.tsx` affiche les prédictions, le contexte historique et les informations de modèles. Dans `Workspace.tsx`, ce panneau est rendu après le formulaire, en colonne.
- L’état de prédiction est local à `PredictionPanel`; `YamlPreview.tsx` ne reçoit actuellement aucune prédiction et affiche principalement le code, le nom de fichier et les actions.
- `History.tsx` a sa propre barre de titre, son sélecteur de projet et son bouton d’actualisation, dans une zone à hauteur fixe.
- La structure de la documentation fournit un précédent utile pour une sidebar responsive, mais son layout et sa navigation restent distincts du workspace.
- Le dépôt comporte déjà des modifications non validées, notamment dans les contrôles de préférences et le thème. Les intégrer sans les écraser lors de l’implémentation.

**Plan d’implémentation**

1. **Poser le shell du workspace**
   - Recomposer le layout de `Workspace.tsx` en en-tête supérieur, sidebar à gauche et zone principale flexible.
   - Conserver le logo FlowOps dans l’en-tête. Mettre Projets, Historique et Aide dans la sidebar, avec état actif, icônes et navigation utilisable au clavier.
   - Prévoir un comportement mobile (sidebar repliable/tiroir, superposition et fermeture après navigation); ne pas reproduire le menu horizontal de l’interface actuelle.
   - Garder le shell dans les vues de configuration de workflow, d’historique et d’aide, et vérifier les transitions existantes (retour au tableau de bord, lancement vers l’historique, etc.).

2. **Replacer les préférences et la déconnexion**
   - Retirer `PreferenceControls` de la barre supérieure du workspace.
   - Dans le menu profil, conserver l’identité, regrouper les contrôles de langue et de thème, puis placer « Sign out » en dernier.
   - Réutiliser `PreferenceControls` et `ThemeToggle` plutôt que créer de nouveaux réglages; conserver la confirmation de déconnexion et les interactions accessibles du menu.

3. **Uniformiser la zone principale**
   - Pour chaque vue principale, créer une introduction (titre + description), une zone de filtres/commandes lorsqu’elle s’applique, puis le contenu.
   - Vue Projets : déplacer la création de projet et la recherche dans une zone de commandes/filtres clairement identifiée, sans perdre recherche, états vide/chargement et cartes.
   - Vue Historique : remonter le sélecteur de projet et l’actualisation dans sa zone de filtres; préserver le suivi périodique, le détail des runs/jobs/logs et l’usage mobile.
   - Vue Aide : conserver son contenu et son lien vers `/docs`, dans la même hiérarchie visuelle.
   - Vue Configuration : fournir un titre/description liés au projet et un contexte de retour cohérent, sans ajouter de filtres non pertinents.

4. **Rendre la configuration et ses prédictions côte à côte**
   - Déplacer l’action de génération en haut du formulaire `WorkflowForm.tsx`, accessible sans parcourir tous les champs; préserver état de chargement, désactivation et libellé traduit.
   - Dans la vue Configuration, organiser le formulaire à gauche et `PredictionPanel` à droite avec une grille/flex responsive; empiler les panneaux sur petits écrans.
   - Vérifier les contraintes de hauteur et de défilement pour que les champs et les commandes restent accessibles sur viewport réduit.

5. **Afficher le résumé de prédiction dans l’aperçu YAML**
   - Partager les prédictions entre le panneau de configuration et `YamlPreview` (par exemple en remontant l’état dans `Workspace` ou via un hook partagé), sans multiplier inutilement les requêtes.
   - Dans l’aperçu, présenter une ligne compacte et lisible du type « Durée prédite : 110 s | Risque d’échec : 12 % ».
   - Gérer explicitement valeurs indisponibles, erreur ou prédiction en attente; ne pas afficher de valeurs inventées. Conserver les détails YAML et les actions existantes (copier, reconfigurer, sauvegarder, nouveau workflow).

6. **Valider l’ensemble**
   - Vérifier les vues Projets, Configuration, Aperçu YAML, Historique et Aide, ainsi que l’ouverture/fermeture du menu profil et de la sidebar.
   - Vérifier les tailles desktop et mobile, l’accessibilité des boutons/menu et la persistance des préférences.
   - Lancer `pnpm lint` puis `pnpm exec tsc -b` depuis `frontend/`; distinguer les éventuels problèmes préexistants des régressions.

**Fichiers principalement concernés**

- `frontend/src/pages/Workspace.tsx` — structure du shell, navigation, profil et assemblage des vues.
- `frontend/src/components/WorkflowForm.tsx` — position de l’action de génération.
- `frontend/src/components/PredictionPanel.tsx` — panneau de prédictions et éventuelle extraction de l’état partagé.
- `frontend/src/components/YamlPreview.tsx` — résumé des prédictions.
- `frontend/src/components/History.tsx` — intégration du titre/filtres dans la nouvelle hiérarchie.
- Éventuellement, nouveaux composants de layout dans `frontend/src/components/` si cela permet de garder le shell clair et réutilisable.

**Critères d’acceptation**

- Le workspace a bien une barre supérieure (logo et profil), une sidebar gauche (Projets, Historique, Aide) et un contenu ordonné en titre/description, filtres pertinents, puis contenu.
- Le menu profil présente thème et langue avant le bouton de déconnexion; les préférences continuent de fonctionner.
- Le bouton de génération est immédiatement visible en haut du formulaire.
- Le formulaire et le panneau de prédictions sont côte à côte sur grand écran et s’empilent proprement sur petit écran.
- L’aperçu YAML montre la durée et le risque prédits sous une forme concise, sans perdre les fonctions existantes.
- Les flux métier existants et les états de chargement/erreur restent utilisables.
