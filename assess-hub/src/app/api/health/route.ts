import { NextResponse } from 'next/server'
import pool from '@/lib/db'

interface HealthResponse {
  status: 'ok' | 'degraded' | 'error'
  timestamp: string
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const timestamp = new Date().toISOString()

  try {
    await pool.execute('SELECT 1')
    return NextResponse.json({ status: 'ok', timestamp } satisfies HealthResponse)
  } catch {
    return NextResponse.json(
      { status: 'error', timestamp } satisfies HealthResponse,
      { status: 503 }
    )
  }
}
