import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

declare const __dirname: string
const here = __dirname

function findRepoRoot(start: string): string {
  let dir = start
  let lastWithEnv: string | null = null
  for (let i = 0; i < 8; i++) {
    try {
      const pkg = require(resolve(dir, 'package.json'))
      const isBackend =
        pkg?.name === 'lawMate-backend' || pkg?.name === 'lawmate-backend'
      const hasEnv =
        existsSync(resolve(dir, '.env.local')) ||
        existsSync(resolve(dir, '.env'))
      if (hasEnv) lastWithEnv = dir
      if (isBackend && hasEnv) return dir
      if (pkg?.workspaces) return lastWithEnv ?? dir
    } catch {}
    const parent = resolve(dir, '..')
    if (parent === dir) break
    dir = parent
  }
  return lastWithEnv ?? start
}
const repoRoot = findRepoRoot(resolve(here, '..'))
const envLocal = resolve(repoRoot, '.env.local')
const envFile = resolve(repoRoot, '.env')
if (existsSync(envLocal)) config({ path: envLocal, override: false })
if (existsSync(envFile)) config({ path: envFile, override: false })

const globalForPrisma = globalThis as unknown as {
  prisma: any
}

function resolveDatabaseUrl(): string {
  const candidates = [
    process.env.ORM_DATABASE_URL,
    process.env.ORM_PRISMA_DATABASE_URL,
    process.env.ORM_POSTGRES_URL,
    process.env.DATABASE_URL,
  ]
  for (const value of candidates) {
    if (value && value.trim().length > 0) return value
  }
  throw new Error(
    'No database URL found. Set one of: ORM_DATABASE_URL, ORM_PRISMA_DATABASE_URL, ORM_POSTGRES_URL, DATABASE_URL',
  )
}

function createPrismaClient() {
  const connectionString = resolveDatabaseUrl()
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

let prisma: PrismaClient
try {
  prisma = globalForPrisma.prisma ?? createPrismaClient()
} catch (error) {
  console.error('Failed to create PrismaClient:', error)
  throw error
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export { prisma }
