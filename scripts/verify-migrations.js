const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

function run(command) {
  execSync(command, { stdio: 'inherit', env: process.env });
}

async function main() {
  console.log('[db:verify] Checking migration status...');
  run('npx prisma migrate status');

  const databaseUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[db:verify] DATABASE_URL is not set.');
    process.exit(1);
  }

  console.log('[db:verify] Comparing database schema to prisma/schema.prisma...');
  const diff = execSync(
    `npx prisma migrate diff --from-url "${databaseUrl}" --to-schema-datamodel prisma/schema.prisma`,
    { encoding: 'utf8', env: process.env },
  ).trim();

  if (diff && diff !== 'No difference detected.') {
    console.error('[db:verify] Schema drift detected:\n');
    console.error(diff);
    process.exit(1);
  }

  console.log('[db:verify] No schema drift detected.');

  const prisma = new PrismaClient();
  try {
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at
      FROM _prisma_migrations
      WHERE rolled_back_at IS NULL
      ORDER BY finished_at
    `;
    console.log('[db:verify] Applied migrations:');
    for (const row of migrations) {
      console.log(`  - ${row.migration_name}`);
    }

    const tables = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `;
    const tableCount = Number(tables[0]?.count ?? 0);
    console.log(`[db:verify] Public tables: ${tableCount}`);

    const reviewTable = await prisma.$queryRaw`
      SELECT to_regclass('public.job_card_review_entries')::text AS name
    `;
    if (!reviewTable[0]?.name) {
      console.error('[db:verify] Missing table: job_card_review_entries');
      process.exit(1);
    }

    console.log('[db:verify] OK');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[db:verify] Failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
