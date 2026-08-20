// Aplica las migraciones pendientes contra la base de datos indicada en
// DATABASE_URL. Se corre automáticamente antes de levantar el servidor
// (ver "start" en package.json) para que ningún deploy quede con el
// esquema desactualizado.
import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'

if (!process.env.DATABASE_URL) {
  console.error('Falta la variable de entorno DATABASE_URL. No se pueden aplicar migraciones.')
  process.exit(1)
}

const db = drizzle(process.env.DATABASE_URL)

try {
  console.log('Aplicando migraciones pendientes...')
  await migrate(db, { migrationsFolder: './db/migrations' })
  console.log('Migraciones al día.')
} catch (err) {
  console.error('Error aplicando migraciones:', err)
  process.exit(1)
}
