import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('DATABASE_URL is required')

export const sql = postgres(DATABASE_URL, {
  idle_timeout: 20,
  max_lifetime: 60 * 30,
})

export type SQL = typeof sql
