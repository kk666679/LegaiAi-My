import { prisma } from '../db'
import { randomUUID } from 'crypto'
import { JobStatus, JobType, Prisma } from '@prisma/client'

export interface CreateJobInput {
  orgId?: string
  userId?: string
  traceId?: string
  jobType: JobType
  priority?: number
  input?: Prisma.InputJsonValue
  maxAttempts?: number
  idempotencyKey?: string
}

export interface JobProgress {
  [key: string]: unknown;
  stage: string
  percent: number
  message: string
  timestamp: string
}

export interface UpdateJobInput {
  status?: JobStatus
  progress?: JobProgress
  result?: Prisma.InputJsonValue
  errorMessage?: string
  errorCode?: string
  workerId?: string
  attempts?: number
}

export class JobService {
  static async create(input: CreateJobInput) {
    const idempotencyKey = input.idempotencyKey || randomUUID()

    const existing = await prisma.job.findUnique({
      where: { idempotencyKey },
    })

    if (existing) {
      return existing
    }

    return prisma.job.create({
      data: {
        orgId: input.orgId,
        userId: input.userId,
        traceId: input.traceId,
        jobType: input.jobType,
        priority: input.priority ?? 10,
        input: input.input,
        maxAttempts: input.maxAttempts ?? 3,
        idempotencyKey,
      },
    })
  }

  static async getById(id: string) {
    return prisma.job.findUnique({ where: { id } })
  }

  static async getByTraceId(traceId: string) {
    return prisma.job.findMany({
      where: { traceId },
      orderBy: { createdAt: 'asc' },
    })
  }

  static async update(id: string, input: UpdateJobInput) {
    const data: Prisma.JobUpdateInput = {}

    if (input.status) {
      data.status = input.status
      if (input.status === JobStatus.RUNNING && !data.startedAt) {
        data.startedAt = new Date()
      }
      if (input.status === JobStatus.COMPLETED) {
        data.completedAt = new Date()
      }
      if (input.status === JobStatus.FAILED) {
        data.failedAt = new Date()
      }
    }

    if (input.progress) {
      data.progress = input.progress as unknown as Prisma.InputJsonValue
    }

    if (input.result !== undefined) {
      data.result = input.result
    }

    if (input.errorMessage !== undefined) {
      data.errorMessage = input.errorMessage
    }

    if (input.errorCode !== undefined) {
      data.errorCode = input.errorCode
    }

    if (input.workerId !== undefined) {
      data.workerId = input.workerId
    }

    if (input.attempts !== undefined) {
      data.attempts = input.attempts
    }

    data.updatedAt = new Date()

    return prisma.job.update({
      where: { id },
      data,
    })
  }

  static async markRunning(id: string, workerId: string) {
    return this.update(id, {
      status: JobStatus.RUNNING,
      workerId,
      progress: { stage: 'starting', percent: 0, message: 'Job started', timestamp: new Date().toISOString() },
    })
  }

  static async markProcessing(id: string, stage: string, percent: number, message: string) {
    return this.update(id, {
      status: JobStatus.PROCESSING,
      progress: { stage, percent, message, timestamp: new Date().toISOString() },
    })
  }

  static async markCompleted(id: string, result: Prisma.InputJsonValue) {
    return this.update(id, {
      status: JobStatus.COMPLETED,
      result,
      progress: { stage: 'completed', percent: 100, message: 'Job completed', timestamp: new Date().toISOString() },
    })
  }

  static async markFailed(id: string, errorMessage: string, errorCode?: string) {
    return this.update(id, {
      status: JobStatus.FAILED,
      errorMessage,
      errorCode,
      progress: { stage: 'failed', percent: 0, message: errorMessage, timestamp: new Date().toISOString() },
    })
  }

  static async markRetrying(id: string, attempts: number) {
    return this.update(id, {
      status: JobStatus.RETRYING,
      attempts,
      progress: { stage: 'retrying', percent: 0, message: `Retry attempt ${attempts}`, timestamp: new Date().toISOString() },
    })
  }

  static async markCancelled(id: string) {
    return this.update(id, {
      status: JobStatus.CANCELLED,
      progress: { stage: 'cancelled', percent: 0, message: 'Job cancelled', timestamp: new Date().toISOString() },
    })
  }

  static async list(filters: {
    orgId?: string
    userId?: string
    jobType?: JobType
    status?: JobStatus
    traceId?: string
    limit?: number
    cursor?: string
  }) {
    const where: Prisma.JobWhereInput = {}

    if (filters.orgId) where.orgId = filters.orgId
    if (filters.userId) where.userId = filters.userId
    if (filters.jobType) where.jobType = filters.jobType
    if (filters.status) where.status = filters.status
    if (filters.traceId) where.traceId = filters.traceId

    return prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: (filters.limit ?? 20) + 1,
      cursor: filters.cursor ? { id: filters.cursor } : undefined,
    })
  }

  static async getStats(orgId?: string) {
    const where = orgId ? { orgId } : {}

    const [total, byStatus, byType] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.groupBy({ by: ['status'], where, _count: { id: true } }),
      prisma.job.groupBy({ by: ['jobType'], where, _count: { id: true } }),
    ])

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count.id])),
      byType: Object.fromEntries(byType.map(t => [t.jobType, t._count.id])),
    }
  }

  static async getStaleJobs(thresholdMinutes = 10) {
    const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000)
    return prisma.job.findMany({
      where: {
        status: { in: [JobStatus.QUEUED, JobStatus.RUNNING, JobStatus.PROCESSING, JobStatus.RETRYING] },
        updatedAt: { lt: threshold },
      },
    })
  }

  static async retry(id: string) {
    const job = await prisma.job.findUnique({ where: { id } })
    if (!job) throw new Error('Job not found')

    if (job.attempts >= job.maxAttempts) {
      throw new Error('Max attempts reached')
    }

    return this.update(id, {
      status: JobStatus.QUEUED,
      attempts: job.attempts + 1,
      errorMessage: undefined,
      errorCode: undefined,
    })
  }
}

export const jobService = JobService