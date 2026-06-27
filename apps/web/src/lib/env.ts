const LOCAL_SITE_URL = 'http://localhost:3000';
const LOCAL_API_URL = 'http://localhost:3001/api';

declare global {
  interface Window {
    __CEV_API_URL__?: string;
  }
}

/** Treat unset or blank Railway/Docker env values as missing. */
export function publicEnv(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
}

/** Ensure API base URL ends with `/api` (Nest global prefix). */
export function normalizeApiUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return LOCAL_API_URL;
  if (trimmed.endsWith('/api')) return trimmed;
  return `${trimmed}/api`;
}

/** Server-side API URL (runtime env API_URL, then build-time NEXT_PUBLIC_API_URL). */
export function getServerApiUrl(): string {
  return normalizeApiUrl(publicEnv('API_URL', publicEnv('NEXT_PUBLIC_API_URL', LOCAL_API_URL)));
}

export function getSiteUrl(): string {
  return publicEnv('NEXT_PUBLIC_SITE_URL', LOCAL_SITE_URL);
}

/** Client API URL: injected at runtime in root layout, then env fallbacks. */
export function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    const runtime = window.__CEV_API_URL__?.trim();
    if (runtime) return normalizeApiUrl(runtime);
  }
  return getServerApiUrl();
}
