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

/** Server-side API URL (runtime env API_URL, then build-time NEXT_PUBLIC_API_URL). */
export function getServerApiUrl(): string {
  return publicEnv('API_URL', publicEnv('NEXT_PUBLIC_API_URL', LOCAL_API_URL));
}

export function getSiteUrl(): string {
  return publicEnv('NEXT_PUBLIC_SITE_URL', LOCAL_SITE_URL);
}

/** Client API URL: injected at runtime in root layout, then env fallbacks. */
export function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    const runtime = window.__CEV_API_URL__?.trim();
    if (runtime) return runtime;
  }
  return getServerApiUrl();
}
