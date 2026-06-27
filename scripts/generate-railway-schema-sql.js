const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const migrations = ['20250626120000_init', '20250626140000_add_fitments'];

let sql = [
  '-- CEV schema for Railway Postgres (manual fallback)',
  '-- Prefer: .\\scripts\\railway-apply-schema.ps1 after `railway login`',
  '',
].join('\n');

for (const name of migrations) {
  sql += `\n-- Migration: ${name}\n`;
  sql += fs.readFileSync(
    path.join('prisma', 'migrations', name, 'migration.sql'),
    'utf8',
  );
  sql += '\n';
}

sql += `
-- Prisma migration history
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL PRIMARY KEY,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);
`;

for (const name of migrations) {
  const checksum = crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join('prisma', 'migrations', name, 'migration.sql')))
    .digest('hex');
  sql += `
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
SELECT gen_random_uuid()::text, '${checksum}', NOW(), '${name}', NOW(), 1
WHERE NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '${name}');
`;
}

const outPath = path.join('scripts', 'railway-manual-schema.sql');
fs.writeFileSync(outPath, sql);
console.log(`Wrote ${outPath} (${sql.length} bytes)`);
