# Référence de l’API FlowOps

En développement, l’API FastAPI est disponible sur
`http://localhost:8000`. La plupart des routes applicatives nécessitent un
jeton GitHub :

```http
Authorization: Bearer <github_access_token>
```

Les routes de projet vérifient l’identité GitHub et la propriété du projet.
Un projet appartenant à un autre utilisateur est renvoyé comme introuvable.

## Authentification et dépôts

| Méthode | Chemin | Authentification | Fonction |
| --- | --- | --- | --- |
| `GET` | `/api/auth/status` | Non | Vérifier la configuration OAuth GitHub. |
| `POST` | `/api/auth/device-code` | Non | Démarrer le Device Flow GitHub. |
| `POST` | `/api/auth/check-login` | Non | Interroger l’état avec `{"device_code":"..."}`. |
| `GET` | `/api/github/repositories` | Bearer | Lister les dépôts accessibles à l’utilisateur. |

## Projets

| Méthode | Chemin | Authentification | Fonction |
| --- | --- | --- | --- |
| `GET` | `/api/projects` | Bearer | Lister les projets de l’utilisateur connecté. |
| `POST` | `/api/projects` | Bearer | Créer un projet. |
| `DELETE` | `/api/projects/{project_id}` | Bearer + propriété | Supprimer un projet. |

Corps de création :

```json
{
  "name": "Exemple",
  "description": "Workflow CI du dépôt exemple",
  "repository": "proprietaire/depot"
}
```

## Workflows

| Méthode | Chemin | Authentification | Fonction |
| --- | --- | --- | --- |
| `POST` | `/api/generate-workflow` | Non | Compiler une configuration et renvoyer `{filename, yaml}`. |
| `POST` | `/api/projects/{project_id}/workflow` | Bearer + propriété | Compiler et enregistrer le workflow du projet. |
| `POST` | `/api/projects/{project_id}/execute` | Bearer + propriété | Publier le workflow sur GitHub et envoyer `flowops_trigger`. |

La configuration comprend `filename`, `name`, `on_events`, `branches`,
`global_env` facultatif et `jobs`. Un job comprend `id`, `name`, `runs_on`,
`needs` et `steps`. Les types d’étape pris en charge sont `checkout`,
`setup-node`, `npm`, `docker`, `custom-run` et `upload-artifact`.

## Exécutions, jobs et logs

Toutes les routes ci-dessous nécessitent un jeton Bearer et la propriété du
projet.

| Méthode | Chemin | Fonction |
| --- | --- | --- |
| `GET` | `/api/projects/{project_id}/runs` | Lister les exécutions GitHub Actions du dépôt. |
| `GET` | `/api/projects/{project_id}/runs/{run_id}/jobs` | Consulter les jobs et étapes d’une exécution. |
| `GET` | `/api/projects/{project_id}/runs/{run_id}/jobs/{job_id}/logs` | Récupérer les logs d’un job depuis GitHub. |

Si GitHub n’a pas encore publié les logs, la réponse contient une chaîne
`logs` vide et `available: false`. Une erreur GitHub est renvoyée en HTTP 502.
Les logs ne sont pas diffusés en temps réel.

## MLOps

Le routeur MLOps local est monté sous `/api/mlops`. Il est conçu pour un
déploiement local de confiance et ne s’appuie pas sur la dépendance
d’authentification des projets.

| Méthode | Chemin | Fonction |
| --- | --- | --- |
| `GET` | `/api/mlops/status` | État des modèles, évaluations, datasets et du monitoring. |
| `GET` | `/api/mlops/models` | Modèles actifs, registre et évaluations. |
| `POST` | `/api/mlops/predict` | Estimer durée et risque depuis une configuration de workflow. |
| `POST` | `/api/mlops/retrain` | Relancer le pipeline local d’entraînement et de validation. |
| `POST` | `/api/mlops/log-actual` | Enregistrer la durée et le résultat réels pour le monitoring. |
| `GET` | `/api/mlops/monitoring` | Consulter l’état du suivi des prédictions. |
| `GET` | `/api/mlops/dataset-locations` | Consulter les chemins locaux des données et modèles. |

Les prédictions acceptent un objet contenant `name`, `repository`, `on_events`,
`branches` et `jobs`. Un modèle absent est signalé comme indisponible et ne
devient pas une prédiction de risque nul.

## Erreurs

Les erreurs de validation FastAPI et de service utilisent la forme
`{"detail":"..."}`. Les statuts courants sont `401` pour une authentification
absente ou invalide, `404` pour un projet absent ou non détenu, et `502` si
GitHub ne peut pas fournir les données demandées.
