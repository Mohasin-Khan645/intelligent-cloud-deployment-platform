const fs = require('fs');
const path = require('path');
const { Pool, Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/deployment_platform';

async function ensureDatabaseExists() {
  try {
    // Parse target db name from connection string
    const url = new URL(connectionString);
    const targetDbName = url.pathname.replace(/^\//, '') || 'deployment_platform';

    // Connect to the default 'postgres' maintenance database to check/create target database
    const adminUrl = new URL(connectionString);
    adminUrl.pathname = '/postgres';

    const client = new Client({ connectionString: adminUrl.toString() });
    await client.connect();

    const checkRes = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDbName]);
    if (checkRes.rows.length === 0) {
      console.log(`Database "${targetDbName}" does not exist. Creating database...`);
      await client.query(`CREATE DATABASE "${targetDbName}"`);
      console.log(`✅ Database "${targetDbName}" created successfully!`);
    } else {
      console.log(`Database "${targetDbName}" already exists.`);
    }

    await client.end();
  } catch (err) {
    // If admin database connection fails, log and continue to attempt direct connection
    console.warn('Notice while checking database existence:', err.message);
  }
}

async function initDb() {
  console.log('Connecting to PostgreSQL database:', connectionString.replace(/:[^:@]+@/, ':****@'));

  await ensureDatabaseExists();

  const pool = new Pool({ connectionString });

  try {
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Executing schema.sql...');

    await pool.query(schemaSql);
    console.log('✅ Database schema initialized and seeded successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  initDb();
}

module.exports = initDb;
