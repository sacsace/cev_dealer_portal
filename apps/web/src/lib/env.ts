const LOCAL_SITE_URL = 'http://localhost:3000';
const LOCAL_API_URL = 'http://localhost:3001/api';

/** Treat unset or blank Railway/Docker env values as missing. */
export function publicEnv(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
}

export function getSiteUrl(): string {
  return publicEnv('NEXT_PUBLIC_SITE_URL', LOCAL_SITE_URL);
}

export function getApiUrl(): string {
  return publicEnv('NEXT_PUBLIC_API_URL', LOCAL_API_URL);
}
