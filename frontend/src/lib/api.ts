/**
 * Client HTTP unique vers l'API FlowOps (backend FastAPI).
 *
 * Centralise :
 * - la base URL (`VITE_API_URL`) ;
 * - la lecture du jeton d'authentification **au moment de l'appel**
 *   (jamais capturé au montage du composant) ;
 * - le typage des erreurs (`detail` renvoyé par FastAPI) ;
 * - la déconnexion automatique sur un `401` (session expirée / jeton rejeté).
 *
 * Toute requête vers le backend doit passer par `apiFetch` : c'est le seul
 * endroit qui interprète le contrat HTTP (formes de réponse typées dans
 * `src/@types/api.ts`).
 */

/** Base URL de l'API backend, surchargeable via `VITE_API_URL`. */
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/** Clé localStorage du jeton GitHub (posée par `AuthPage` au login). */
export const TOKEN_STORAGE_KEY = "flowops_token";

/** Clés de session effacées automatiquement lors d'un 401. */
const SESSION_KEYS = [
  "flowops_token",
  "flowops_user",
  "flowops_avatar",
  "flowops_github_id",
];

/**
 * Erreur HTTP : la requête a répondu avec un statut non-2xx.
 *
 * `detail` reprend le champ FastAPI (`{"detail": ...}`) déjà résolu en
 * message affichable ; `status` permet aux écallants de réagir finement
 * (ex. ignorer un 401 déjà géré par le client).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/** Garde de type : distingue une erreur HTTP d'une erreur réseau/DOM. */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Extrait un message lisible d'une erreur inconnue.
 *
 * @param error - Erreur attrapée (`ApiError` ou autre).
 * @param fallback - Message utilisé si `error` n'est pas une `ApiError`.
 * @returns Le `detail` du backend, ou `fallback`.
 */
export function errorDetail(error: unknown, fallback: string): string {
  return isApiError(error) ? error.detail : fallback;
}

/**
 * Lit le jeton courant dans localStorage.
 *
 * @returns Le jeton GitHub, ou `null` si la session est absente.
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * Supprime l'ensemble des clés de session (jeton, profil, identifiant).
 *
 * Utilisé au logout manuel et automatiquement sur un `401`.
 */
export function clearSession(): void {
  for (const key of SESSION_KEYS) {
    localStorage.removeItem(key);
  }
}

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

/**
 * Remplace le comportement par défaut sur `401` (redirection `window.location`).
 *
 * Permet à l'application (ou à un test) d'injecter une navigation contrôlée
 * par React Router sans coupler le client au routeur.
 *
 * @param handler - Fonction appelée après nettoyage de la session.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

function handleUnauthorized(): void {
  clearSession();
  if (unauthorizedHandler) {
    unauthorizedHandler();
  } else {
    window.location.assign("/auth");
  }
}

/** Options d'une requête {@link apiFetch}. */
export interface ApiRequestOptions {
  /** Verbe HTTP (défaut : `GET`). */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Corps JSON sérialisé automatiquement. */
  body?: unknown;
  /**
   * Joindre l'en-tête `Authorization: Bearer <token>` si un jeton existe
   * (défaut : `true`). Passer `false` pour les endpoints publics
   * (`/api/auth/*`, `/api/generate-workflow`, `/api/mlops/predict`).
   */
  auth?: boolean;
  /** En-têtes supplémentaires (le `Content-Type: application/json` est ajouté si `body` présent). */
  headers?: Record<string, string>;
}

/**
 * Exécute une requête vers l'API FlowOps et renvoie le corps JSON typé.
 *
 * Comportement d'erreur :
 * - statut `401` **et** requête authentifiée → session nettoyée + redirection
 *   `/auth`, puis `ApiError(401)` levée ;
 * - tout autre statut non-2xx → `ApiError` avec le `detail` FastAPI ;
 * - échec réseau → l'erreur `fetch` d'origine est propagée (les écallants
 *   distinguent « serveur injoignable » via `isApiError`).
 *
 * @param path - Chemin relatif de l'endpoint (ex. `/api/projects`).
 * @param options - Méthode, corps, authentification ({@link ApiRequestOptions}).
 * @returns Le corps JSON de la réponse, typé par l'écallant.
 * @throws {ApiError} Si le backend répond avec un statut d'erreur.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = true, headers = {} } = options;
  const token = getToken();

  const finalHeaders: Record<string, string> = { ...headers };
  if (body !== undefined && !("Content-Type" in finalHeaders)) {
    finalHeaders["Content-Type"] = "application/json";
  }
  if (auth && token) {
    finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const raw = await res.text();
  let data: unknown = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      // Réponse non-JSON (page d'erreur d'un proxy) : on garde `null`.
    }
  }

  if (res.status === 401 && auth) {
    handleUnauthorized();
    throw new ApiError(401, "Session expirée — reconnectez-vous pour continuer.");
  }

  if (!res.ok) {
    throw new ApiError(res.status, extractDetail(data, res));
  }

  return data as T;
}

/** Résout le champ `detail` d'une réponse d'erreur FastAPI. */
function extractDetail(data: unknown, res: Response): string {
  if (data && typeof data === "object" && "detail" in data) {
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (detail !== null && detail !== undefined) return JSON.stringify(detail);
  }
  return `Erreur HTTP ${res.status}`;
}
