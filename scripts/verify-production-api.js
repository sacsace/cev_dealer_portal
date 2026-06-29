const API_URL = process.env.PRODUCTION_API_URL ?? 'https://api-production-76a7f.up.railway.app/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, options);
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  console.log(`[prod:verify] API: ${API_URL}`);

  const health = await request('');
  if (!health.ok) {
    console.error('[prod:verify] API root failed:', health.status, health.body);
    process.exit(1);
  }
  console.log('[prod:verify] API root OK');

  const login = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId: 'root', password: 'admin123' }),
  });
  if (!login.ok || !login.body?.accessToken) {
    console.error('[prod:verify] Admin login failed:', login.status, login.body);
    process.exit(1);
  }
  console.log('[prod:verify] Admin login OK');

  const headers = { Authorization: `Bearer ${login.body.accessToken}` };
  const traffic = await request('/settings/traffic', { headers });
  if (!traffic.ok) {
    console.error('[prod:verify] Traffic endpoint failed (page_visits migration?):', traffic.status, traffic.body);
    process.exit(1);
  }
  console.log(`[prod:verify] Traffic OK (totalVisits=${traffic.body?.summary?.totalVisits ?? 'n/a'})`);

  console.log('[prod:verify] Production API checks passed.');
}

main().catch((error) => {
  console.error('[prod:verify] Failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
