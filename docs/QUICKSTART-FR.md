# Démarrage rapide FlowOps

FlowOps réunit une interface React, une API FastAPI, GitHub Actions et un
pipeline MLOps local.

## Prérequis

- Python 3.12 ou supérieur
- Node.js et pnpm
- MongoDB pour la persistance des projets
- Une application OAuth GitHub pour la connexion

## Configurer et lancer le backend

Depuis la racine du dépôt :

```bash
cd backend
cp .env.example .env
```

Renseignez `GITHUB_CLIENT_ID` et `GITHUB_CLIENT_SECRET` dans `backend/.env`,
puis configurez `MONGO_URI`. Avec `mongo-docker.sh`, utilisez les identifiants
et l’URI indiqués dans ce script.

Si l’environnement Python n’existe pas encore :

```bash
python3 -m venv venv
venv/bin/pip install -r requirements.txt
```

Démarrez l’API :

```bash
venv/bin/uvicorn main:app --reload --port 8000
```

## Configurer et lancer le frontend

Dans un second terminal, depuis la racine du dépôt :

```bash
cd frontend
pnpm install
pnpm dev
```

Ouvrez <http://localhost:5173>. En développement, le frontend utilise l’API
sur <http://localhost:8000>.

## Connecter GitHub

1. Ouvrez `/setup` et créez une application OAuth GitHub en suivant les étapes.
2. Ajoutez ses identifiants à `backend/.env`, puis redémarrez le backend.
3. Connectez-vous avec le Device Flow GitHub et autorisez l’accès.
4. Créez un projet et sélectionnez un dépôt auquel vous avez accès.

## Créer et exécuter un workflow

1. Ouvrez un projet et créez un workflow avec le formulaire visuel.
2. Configurez les événements, branches, jobs et étapes prises en charge.
3. Prévisualisez le YAML compilé par le backend, puis enregistrez le workflow.
4. Lancez-le depuis le projet. FlowOps publie le fichier dans
   `.github/workflows/`, puis envoie un événement `flowops_trigger`.
5. Consultez l’état des exécutions et des jobs dans l’historique. Les logs sont
   récupérés depuis GitHub lorsqu’ils sont disponibles ; ils ne sont pas
   diffusés en direct.

## Lancer le pipeline MLOps

Depuis `backend/`, exécutez le pipeline de démonstration reproductible :

```bash
venv/bin/python -m mlops.pipeline --sample
```

Les prédictions sont disponibles uniquement si des modèles compatibles sont
déployés. Consultez [`MLOPS.md`](MLOPS.md) pour l’architecture et
[`API-FR.md`](API-FR.md) pour les routes HTTP.

## Vérifier l’installation

Depuis `backend/` :

```bash
venv/bin/ruff check .
venv/bin/python -m pytest
```

Depuis `frontend/` :

```bash
pnpm lint
pnpm exec tsc -b
pnpm build
```

## Dépannage

- **Connexion impossible :** vérifiez `GET /api/auth/status`, les identifiants
  OAuth et le redémarrage du backend après modification de `.env`.
- **Projets non enregistrés :** vérifiez que MongoDB est disponible et que
  `MONGO_URI` est correct.
- **Exécution non déclenchée :** vérifiez les permissions GitHub du dépôt,
  la présence du workflow sur la branche par défaut et la prise en charge de
  `repository_dispatch`.
- **Prédictions indisponibles :** lancez le pipeline MLOps et consultez
  `/api/mlops/status`.
