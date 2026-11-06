/**
 * Session persistante côté navigateur (localStorage).
 *
 * Le jeton GitHub est conservé avec une date d'expiration **glissante** :
 * tant que l'utilisateur revient avant la fin de la durée, elle est repoussée.
 * Ainsi le Device Flow GitHub (et son éventuel second facteur) n'est rejoué
 * qu'après `SESSION_TTL_MS` d'inactivité, ou après un logout / un 401.
 *
 * Aucun cookie : le backend lit un en-tête `Authorization`, un cookie lisible
 * par JS n'apporterait rien de plus qu'un jeton en localStorage.
 */

/** Durée de la session « se souvenir de moi » : 30 jours d'inactivité. */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** On ne ré-écrit l'expiration que si elle a perdu plus d'un jour (évite des écritures inutiles). */
const REFRESH_THRESHOLD_MS = 24 * 60 * 60 * 1000;

const TOKEN_KEY = "flowops_token";
const USER_KEY = "flowops_user";
const AVATAR_KEY = "flowops_avatar";
const GITHUB_ID_KEY = "flowops_github_id";
const EXPIRES_KEY = "flowops_session_expires";

const SESSION_KEYS = [TOKEN_KEY, USER_KEY, AVATAR_KEY, GITHUB_ID_KEY, EXPIRES_KEY];

/** Données de profil mémorisées avec le jeton. */
export interface SessionData {
  token: string;
  username?: string;
  avatarUrl?: string;
  githubId?: string;
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // stockage bloqué (navigation privée stricte, etc.)
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Quota / stockage indisponible : la session ne sera pas mémorisée.
  }
}

/** Supprime le jeton, le profil et l'expiration. */
export function clearSession(): void {
  for (const key of SESSION_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignoré
    }
  }
}

/**
 * Enregistre une nouvelle session pour `SESSION_TTL_MS`.
 *
 * @param data - Jeton GitHub et profil renvoyés par `/api/auth/check-login`.
 */
export function saveSession(data: SessionData): void {
  write(TOKEN_KEY, data.token);
  write(USER_KEY, data.username ?? "");
  write(AVATAR_KEY, data.avatarUrl ?? "");
  write(GITHUB_ID_KEY, data.githubId ?? "");
  write(EXPIRES_KEY, String(Date.now() + SESSION_TTL_MS));
}

/**
 * Retourne le jeton s'il est présent et non expiré, sinon `null`.
 *
 * Une session expirée est purgée. Une session ancienne sans date d'expiration
 * (créée avant ce module) est migrée avec une durée complète. À chaque lecture
 * réussie, l'expiration est repoussée (fenêtre glissante).
 */
export function getValidToken(): string | null {
  const token = read(TOKEN_KEY);
  if (!token) return null;

  const now = Date.now();
  const expires = Number(read(EXPIRES_KEY));

  if (!expires) {
    write(EXPIRES_KEY, String(now + SESSION_TTL_MS));
    return token;
  }
  if (expires <= now) {
    clearSession();
    return null;
  }
  if (expires - now < SESSION_TTL_MS - REFRESH_THRESHOLD_MS) {
    write(EXPIRES_KEY, String(now + SESSION_TTL_MS));
  }
  return token;
}

/** `true` si une session valide existe. */
export function hasSession(): boolean {
  return getValidToken() !== null;
}

/** Profil mémorisé (nom et avatar) pour l'affichage. */
export function getSessionProfile(): { username: string | null; avatarUrl: string | null } {
  return { username: read(USER_KEY) || null, avatarUrl: read(AVATAR_KEY) || null };
}
