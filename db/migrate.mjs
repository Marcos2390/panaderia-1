// Aplica las migraciones pendientes contra la base de datos indicada en
// DATABASE_URL. Se corre automáticamente antes de levantar el servidor
// (ver "start" en package.json) para que ningún deploy quede con el
// esquema desactualizado.
//
// Nota especial: esta base ya tenía las tablas creadas por otra vía antes
// de que este proyecto empezara a usar el sistema de migraciones de
// Drizzle, así que la primera vez que corre este script hay que marcar la
// migración inicial como "ya aplicada" (sin volver a ejecutarla) para que
// Drizzle no intente recrear tablas que ya existen. Las corridas
// siguientes son un simple "aplicar lo pendiente".
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

if (!process.env.DATABASE_URL) {
  console.error('Falta la variable de entorno DATABASE_URL. No se pueden aplicar migraciones.')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)
const db = drizzle(process.env.DATABASE_URL)

const FIRST_MIGRATION_NAME = '20260817004224_create_bakery_schema'
const MIGRATIONS_FOLDER = './db/migrations'

function formatToMillis(dateStr) {
  const year = parseInt(dateStr.slice(0, 4), 10)
  const month = parseInt(dateStr.slice(4, 6), 10) - 1
  const day = parseInt(dateStr.slice(6, 8), 10)
  const hour = parseInt(dateStr.slice(8, 10), 10)
  const minute = parseInt(dateStr.slice(10, 12), 10)
  const second = parseInt(dateStr.slice(12, 14), 10)
  return Date.UTC(year, month, day, hour, minute, second)
}

async function markFirstMigrationAsAppliedIfNeeded() {
  const tableCheck = await sql(
    `select 1 from information_schema.tables where table_schema = 'public' and table_name = 'services' limit 1`,
  )
  if (tableCheck.length === 0) {
    return
  }

  await sql(`CREATE SCHEMA IF NOT EXISTS "drizzle"`)
  await sql(`
    CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint,
      name text,
      applied_at timestamp with time zone DEFAULT now()
    )
  `)

  const already = await sql(
    `select 1 from "drizzle"."__drizzle_migrations" where name = $1 limit 1`,
    [FIRST_MIGRATION_NAME],
  )
  if (already.length > 0) return

  const migrationPath = join(MIGRATIONS_FOLDER, FIRST_MIGRATION_NAME, 'migration.sql')
  const query = readFileSync(migrationPath).toString()
  const hash = createHash('sha256').update(query).digest('hex')
  const folderMillis = formatToMillis(FIRST_MIGRATION_NAME.slice(0, 14))

  console.log(
    'La base ya tenía las tablas creadas: marcando la migración inicial como aplicada sin volver a ejecutarla.',
  )
  await sql(
    `insert into "drizzle"."__drizzle_migrations" ("hash", "created_at", "name") values ($1, $2, $3)`,
    [hash, folderMillis, FIRST_MIGRATION_NAME],
  )
}

try {
  console.log('Verificando estado de las migraciones...')
  await markFirstMigrationAsAppliedIfNeeded()
  console.log('Aplicando migraciones pendientes...')
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })
  console.log('Migraciones al día.')
} catch (err) {
  console.error('Error aplicando migraciones:', err)
  process.exit(1)
}
