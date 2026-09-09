# FlowOps — Frontend

FlowOps Control Plane frontend (React 19 + Vite 7 + Tailwind 4).

## Prerequisites

- Node.js 20+
- Backend FlowOps running on `http://localhost:8000`

## Setup

```bash
# 1. Copy the environment template
cp .env.example .env

# 2. (Optional) Point the API URL to your backend
#    VITE_API_URL=http://localhost:8000
```

## GitHub OAuth — one-time configuration

FlowOps never stores GitHub credentials in the source code. GitHub
authentication uses the **OAuth Device Flow**, configured with **your own**
GitHub OAuth App via environment variables.

> Tip: the in-app `/setup` page (/auth redirects there automatically when the
> backend reports that GitHub is not configured) walks you through the whole
> process.

1. Create an OAuth App: https://github.com/settings/developers → **New OAuth App**
2. Fill in:
   - **Application name**: `FlowOps`
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:5173/auth`
3. Copy the `Client ID` and `Client Secret`.
4. In `backend/`, copy `.env.example` to `.env` and paste your values:

   ```
   GITHUB_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx
   GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

5. Restart the backend.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

## Build

```bash
npm run build
```