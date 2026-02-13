import mysql from 'mysql2/promise'

function parseDbUrl(url: string) {
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '3306'),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.slice(1),
  }
}

const globalForDb = globalThis as unknown as {
  pool: mysql.Pool | undefined
}

export const pool =
  globalForDb.pool ??
  mysql.createPool({
    ...parseDbUrl(process.env.DATABASE_URL!),
    connectionLimit: 10,
    timezone: '+00:00',
    enableKeepAlive: true,
  })

if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool

export default pool
