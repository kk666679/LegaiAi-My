import { prisma } from '../db/index.js'
import { chainHash, signOutput } from './crypto.js'

/**
 * Write an immutable audit log entry with hash-chain linking.
 * @param {object} entry
 */
export async function writeAuditLog(entry) {
  const last = await prisma.auditLog.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { hash: true },
  })
  const prevHash = last?.hash || null
  const hash = chainHash(prevHash, entry)
  const signature = signOutput(entry)

  return prisma.auditLog.create({
    data: {
      traceId: entry.traceId,
      agentName: entry.agentName,
      userId: entry.userId,
      action: entry.action,
      input: entry.input,
      output: { ...entry.output, _sig: signature },
      confidence: entry.confidence,
      durationMs: entry.durationMs,
      prevHash,
      hash,
      caseId: entry.caseId,
      legalHold: entry.legalHold || false,
    },
  })
}

/** Apply legal hold to all logs for a caseId */
export async function applyLegalHold(caseId) {
  return prisma.auditLog.updateMany({
    where: { caseId },
    data: { legalHold: true },
  })
}

/** Delete all data for a userId (PDPA right to be forgotten) */
export async function forgetUser(userId) {
  await prisma.auditLog.deleteMany({ where: { userId, legalHold: false } })
  await prisma.draftDocument.deleteMany({ where: { userId } })
  await prisma.userConsent.deleteMany({ where: { userId } })
  await prisma.vectorDoc.deleteMany({ where: { metadata: { path: ['userId'], equals: userId } } })
}
