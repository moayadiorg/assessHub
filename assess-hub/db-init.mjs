import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('FATAL: DATABASE_URL is not set');
  process.exit(1);
}

const conn = await createConnection({ uri: url, multipleStatements: true });

try {
  // Check if tables already exist
  let tablesExist = false;
  try {
    await conn.execute('SELECT 1 FROM AssessmentType LIMIT 1');
    tablesExist = true;
  } catch {
    // table doesn't exist
  }

  if (!tablesExist) {
    console.log('Tables not found, applying migration...');
    const migration = readFileSync('./migration.sql', 'utf8');
    await conn.query(migration);
    console.log('Migration applied successfully.');
  } else {
    console.log('Tables already exist, skipping migration.');
  }

  console.log('Running database seed (idempotent)...');
  const seed = readFileSync('./seed.sql', 'utf8');
  await conn.query(seed);
  console.log('Seed applied.');
} finally {
  await conn.end();
}
