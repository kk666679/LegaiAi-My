import { createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { prisma } from '../db'

const SECRET = (process.env.SESSION_SECRET || 'change-me-in-production') as string
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = createHmac('sha256', SECRET).update(salt + password).digest('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  const candidate = createHmac('sha256', SECRET).update(salt + password).digest('hex')
  return timingSafeEqual(Buffer.from(hash ?? '', 'hex'), Buffer.from(candidate, 'hex'))
}

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export async function createSession(userId: string) {
  const token = generateToken()
  const session = await prisma.session.create({
    data: { userId, token, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  })
  return session.token
}

export async function validateSession(token: string) {
  if (!token) return null
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { org: true } } },
  })
  if (!session || session.expiresAt < new Date()) return null
  return session.user
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { token } })
}

export const ROLES = ['admin', 'lawyer', 'paralegal', 'viewer'] as const
export type Role = typeof ROLES[number]

export const PERMISSIONS = {
  create_case:            ['admin', 'lawyer'],
  edit_document:          ['admin', 'lawyer', 'paralegal'],
  delete_document:        ['admin'],
  view_audit_log:         ['admin', 'lawyer'],
  manage_users:           ['admin'],
  run_agents:             ['admin', 'lawyer', 'paralegal'],
  view_drafts:            ['admin', 'lawyer', 'paralegal', 'viewer'],
  approve_agent_action:   ['admin', 'lawyer'],
} as const

export type Permission = keyof typeof PERMISSIONS

export function hasPermission(role: string, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[] | undefined)?.includes(role) ?? false
}
