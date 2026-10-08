import { randomBytes } from 'crypto'
import { prisma } from '../db'
import { hashPassword, needsRehash, verifyPassword } from './security/password'

// Re-exported so existing importers keep a single auth entrypoint.
export { hashPassword, needsRehash, verifyPassword }

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export async function createSession(userId: string, metadata?: { userAgent?: string; ipAddress?: string }) {
  const token = generateToken()
  const session = await prisma.session.create({
    data: { userId, token, expiresAt: new Date(Date.now() + SESSION_TTL_MS), ...metadata },
  })
  return session.token
}

export async function validateSession(token: string) {
  if (!token) return null
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { org: true } } },
  })
  if (!session) return null
  if (session.expiresAt < new Date()) {
    // Rejected but not removed: purge it so expired rows do not accumulate.
    // Never let cleanup failure turn a clean 401 into a 500.
    await prisma.session.deleteMany({ where: { id: session.id } }).catch(() => {})
    return null
  }
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
