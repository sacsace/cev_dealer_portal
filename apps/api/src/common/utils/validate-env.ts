const WEAK_JWT_SECRETS = new Set([
  'change-me-in-production',
  'change-me-refresh-in-production',
  'secret',
  'jwt-secret',
]);

export function validateEnv(): void {
  if (process.env.NODE_ENV !== 'production') return;

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
