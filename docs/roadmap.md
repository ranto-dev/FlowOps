# FlowOps Documentation Structure

## 1. Introduction (Getting Started)

_Objectif : Accueillir l'utilisateur, expliquer la vision du produit et permettre un premier déploiement en moins de 5 minutes._

- **1.1. Overview**
- What is FlowOps? (Core mission & philosophy)
- Key Features (Live telemetry, Low-code CI/CD, ML-driven risk & duration predictions)
- Architecture at a glance (React + Vite, FastAPI, MongoDB, MLflow)

- **1.2. Quick Start**
- Prerequisites (Node.js, Python, MongoDB, Git)
- Cloning and repository setup
- Environment variables configuration (`.env` template)
- Running locally (Backend & Frontend development servers)

- **1.3. Installation & Setup**
- Detailed Docker & local installation guide
- Database connection (MongoDB configuration)
- MLflow local server initialization

---

## 2. Core Concepts (How FlowOps Works)

_Objectif : Expliquer les briques fondamentales et le fonctionnement interne de la plateforme._

- **2.1. Projects & Workspaces**
- Understanding projects and MongoDB records
- Linking GitHub repositories via Device Code OAuth Flow

- **2.2. The Low-Code Pipeline Builder**
- Visual node/form composition
- Triggers, branches, and global environment variables
- Jobs and steps mapping

- **2.3. YAML Code Generation & Compilation**
- From visual JSON graph to standard GitHub Actions `.github/workflows/*.yaml`
- Preview and manual override capabilities

---

## 3. MLOps & Predictive Intelligence

_Objectif : Documenter la brique de Machine Learning locale, la gestion des datasets et le tracking._

- **3.1. Overview of MLOps Architecture**
- Local dataset storage (`/backend/dataset/`)
- Feature engineering for CI/CD metrics

- **3.2. Predictive Analytics**
- Execution duration prediction (in seconds)
- Failure risk assessment (in percentage and severity levels)

- **3.3. MLflow Lifecycle Management**
- Tracking experiments locally
- Model training, evaluation, and registry
- Inference endpoints serving real-time predictions to the UI

---

## 4. User Guide & Interface

_Objectif : Guide d'utilisation pas à pas de chaque écran de l'application._

- **4.1. Authentication Gateway**
- GitHub Device Code authorization workflow
- Session management and security tokens

- **4.2. Projects Dashboard**
- Creating projects via the modal dialog
- Managing, configuring, and deleting project registries

- **4.3. Execution & Live Logs Terminal**
- Triggering workflow runs
- Real-time log streaming and reactive terminal console
- Error detection and telemetry inspection

---

## 5. API Reference

_Objectif : Documentation exhaustive des points de terminaison (Endpoints) du backend FastAPI._

- **5.1. Authentication Endpoints**
- `POST /api/auth/device-code`
- `POST /api/auth/check-login`

- **5.2. Projects Management**
- `GET /api/projects`
- `POST /api/projects`
- `DELETE /api/projects/{id}`
- `POST /api/projects/{id}/workflow`

- **5.3. GitHub Integration**
- `GET /api/github/repositories`
- `POST /api/projects/{id}/execute`

- **5.4. Workflow & ML Engine**
- `POST /api/generate-workflow`
- `POST /api/predict`

---

## 6. Advanced Guides & Ecosystem

_Objectif : Pour aller plus loin, personnaliser l'outil ou contribuer au projet._

- **6.1. Customizing the Design System**
- Tailwind CSS configuration and the "White Background / Purple Accent" theme
- Framer Motion animations and glassmorphism guidelines

- **6.2. Extending the ML Models**
- Adding custom features to the CSV datasets
- Retraining models with scikit-learn / XGBoost

- **6.3. Troubleshooting & FAQ**
- Common issues with MongoDB connection
- Handling expired GitHub OAuth device tokens
- Port conflicts (`8000` for FastAPI, `5000` for frontend, `27017` for MongoDB)
