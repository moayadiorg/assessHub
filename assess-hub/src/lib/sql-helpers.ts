import pool from './db'
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise'

export async function query<T>(sql: string, params?: unknown[]): Promise<T[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params)
  return rows as T[]
}

export async function queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

export async function execute(sql: string, params?: unknown[]): Promise<ResultSetHeader> {
  const [result] = await pool.execute<ResultSetHeader>(sql, params)
  return result
}

export async function transaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export function isDuplicateEntryError(error: unknown): boolean {
  const err = error as { code?: string; errno?: number }
  return err?.code === 'ER_DUP_ENTRY' || err?.errno === 1062
}

export function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const k = keyFn(item)
    const group = map.get(k)
    if (group) {
      group.push(item)
    } else {
      map.set(k, [item])
    }
  }
  return map
}
