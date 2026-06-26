const WEAK_JWT_SECRETS = new Set([
  'change-me-in-production',
  'change-me-refresh-in-production',
  'secret',
  'jwt-secret',
]);

function isLocalhostUrl(value: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(value);
}

export function validateEnv(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const databaseUrl = process.env.DATABASE_URL ?? '';
  if (!databaseUrl || isLocalhostUrl(databaseUrl)) {
    throw new Error('DATABASE_URL must point to the production Postgres instance');
  }

  const frontendUrl = process.env.FRONTEND_URL ?? '';
  if (!frontendUrl || isLocalhostUrl(frontendUrl)) {
    throw new Error('FRONTEND_URL must be set to the public web URL in production');
  }

  const jwtSecret = process.env.JWT_SECRET ?? '';
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET ?? '';

  if (!jwtSecret || WEAK_JWT_SECRETS.has(jwtSecret)) {
    throw new Error('JWT_SECRET must be set to a strong value in production');
  }

  if (!jwtRefreshSecret || WEAK_JWT_SECRETS.has(jwtRefreshSecret)) {
    throw new Error('JWT_REFRESH_SECRET must be set to a strong value in production');
  }

  if (jwtSecret === jwtRefreshSecret) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
  }
}
