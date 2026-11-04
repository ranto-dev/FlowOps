# FlowOps

une appllication qui permette de configurer des workflows github actions via une interface low-code.
A la base, les developpeurs doivent ecrire des fichiers de configuration YAML pour le faire. Avec flowOps, il suffit de remplir un formulaire et push et il genere automatiquement les workflows

actuellement on a:

- une landing page
- un systeme d'authentification avec gihub
- un systeme de gestion de projet
- une formulaire pour la configuration de workflow et la gestion d'un / des fichiers yaml
- un systeme pour executer les workflow diretement avec github actions
- un systeme de recuperation et d'affichage des logs

le plus important et interessant

- on a un systeme de prediction du duree d'execution et du risque d'echec du workflow avec un system MLOps

## Stack

- react / typescript / tailwindcss / lucide pour le frontend
- fastapi pour le backend
- python pour l'intelligence artiecielle
- MLFow pour la gestion de cycle de vie et le processuss MLOps
- MongoDB pour la partie base de donnee

## Amelioration

### Interface

On a fait quelque recherche sur d'autre technologie moderne comme le site de Drizzle ORM et mistral AI
voici les liens: https://orm.drizzle.team/ et https://mistral.ai/fr/

on veut creer une interface moderne, anime et tres attirante. Une application complet avec une meilleur interface et experience utilisateur

pour cela, on a planifier 3 chose

- la partie landing page et documentation
- authentification utilisateur via leur compte github
- la fonctionnalite de base (configuration + generation YAML + execution + affichage des logs)

pour tous les trois point, on veut garder

- le meme structure de page
- le meme design (meme couleur + meme typographie)

reference:

- design: celle de Drizzle ORM + Mistral AI(une interface avec des illustration + animation legerer + d'image innovate et attirante)
- typographie et text: on prend cele de open code (https://opencode.ai/fr): du text proche d'un vrai simulation de terminal en quelque sort.

! on evite d'utiliser des emojie. On utilise des icons et des images d'illustration (de preference on telecharge les images a utiliser et les mettre dans un dossier assets/images avant)

#### ASPECT

1. **Landing page**

on veut presente des section consernant FlowOps, dans la bare de navigation on a les menus suivantes:

- tous les menu actuelles
- Github: POur allez et visiter le depot github de FLowOps (https://github.com/ranto-dev/flowops)
- Documentation : comme tous les techonologie moderne actuelle comme dans `drizzle ORM`, `Vuejs`, `Next.js`, on a differente menus (on trouve le detaille et les plan dans `docs/roadmap.md`)

2. **Authentfication**

POur le design on prefere copie le design de la page d'authentification de mistral AI (illustration et background + animation), mais avec seulement un bouton "continuer avec github" du genre

3. **Workspace**

Dans le workspace, on a la possibilite de : creer et generer des project, executer des workflows via un projet (du projet).
principalement cette interface est pour les utilisateurs, dont on veut que les fonctionnalite qui sont dans cette interface sont:

- la gestion de projet: les utilisateur peut creer, suppriemer (gerer les projet)
- la configuation de workflow + appercu du YAML + affiche du resultat de prediction en seconde + affichage du prediction de risque d'echec en pourcentage
- l'execution de workflow CI/CD
- affichage des logs

on abandane l'idee d'afficher les metrix et avoir une autre interface pour le MLOps dans FlowOps, on gere tous la partie MLOps independament

### Backend

je veux seulement refactor et reorganiser la structure du projet ainsi que nettoyer le code (clean code) + ajouter des commentaire pour documenter les codes plus proprement