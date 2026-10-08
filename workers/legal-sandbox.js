/**
 * Agent 13: Vercel Sandbox Worker
 *
 * Runs untrusted code, extracted scripts, or shell pipelines inside an
 * isolated Vercel Sandbox microVM. Use this whenever the caller code path
 * is outside the trust boundary: model-generated snippets, uploaded
 * documents, third-party plugins, ad-hoc computations the user wants
 * to test.
 *
 * Each job:
 *   1. Resolves (or creates) a persistent sandbox named `sandboxName`.
 *   2. Uploads any provided source files.
 *   3. Runs the requested command (defaults to `node -e <code>`).
 *   4. Streams stdout/stderr back via the audit log.
 *   5. Persists the result; stops the session on demand.
 */
import { Worker } from 'bullmq'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { SandboxService } from '@/backend/src/lib/sandbox.js'
import { writeAuditLog } from '@/backend/src/lib/audit.js'
import { agentLogger } from '@/backend/src/lib/logger.js'
import { jobService } from '@/backend/src/lib/jobs.js'
import { classifyError, DEFAULT_REDIS_CONNECTION } from '@/backend/src/lib/worker-utils.js'

const log = agentLogger('legal-sandbox')

const connection = DEFAULT_REDIS_CONNECTION

const SANDBOX_TIMEOUT = 300000

const ExecJobSchema = z.object({
  sandboxName: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-_]*$/)
    .default(() => `legal-sandbox-${randomUUID().slice(0, 8)}`),
  language: z.enum(['node', 'python', 'bash', 'shell']).default('node'),
  code: z.string().max(200_000).optional(),
  cmd: z.string().max(1024).optional(),
  args: z.array(z.string().max(1024)).max(64).optional(),
  cwd: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
  files: z
    .array(
      z.object({
        path: z.string(),
        contentBase64: z.string(),
        mode: z.number().int().min(0).max(0o7777).optional(),
      }),
    )
    .optional(),
  networkPolicy: z.union([z.literal('allow-all'), z.literal('deny-all')]).default('deny-all'),
  vcpus: z.number().int().min(1).max(32).default(2),
  snapshotAfter: z.boolean().default(false),
  stopAfter: z.boolean().default(false),
  traceId: z.string().default(() => randomUUID()),
  userId: z.string().optional(),
  orgId: z.string().optional(),
  jobId: z.string().optional(),
})

const DEFAULT_CMD = {
  node:    { cmd: 'node',    prefixArgs: ['-e'] },
  python:  { cmd: 'python3', prefixArgs: ['-c'] },
  bash:    { cmd: 'bash',    prefixArgs: ['-c'] },
  shell:   { cmd: 'sh',      prefixArgs: ['-c'] },
}

const worker = new Worker('legal-sandbox', async (job) => {
    const parsed = ExecJobSchema.safeParse(job.data)
    if (!parsed.success) {
      log.error({ errors: parsed.error.issues }, 'Invalid sandbox job')
      throw new Error(`Validation failed: ${JSON.stringify(parsed.error.issues)}`)
    }

    const data = parsed.data
    const start = Date.now()
    log.info({ traceId: data.traceId, sandboxName: data.sandboxName, language: data.language, jobId: data.jobId }, 'sandbox job started')

    let unifiedJob = null
    if (data.jobId) {
      unifiedJob = await jobService.getById(data.jobId)
      if (unifiedJob) {
        await jobService.markRunning(unifiedJob.id, `worker-${process.pid}`)
      }
    }

    try {
      await jobService.markProcessing(unifiedJob?.id || '', 'creating_sandbox', 10, 'Creating sandbox')
      await SandboxService.getOrCreate({
        name: data.sandboxName,
        vcpus: data.vcpus,
        networkPolicy: data.networkPolicy,
        audit: { traceId: data.traceId, userId: data.userId, orgId: data.orgId },
      })

      if (data.files && data.files.length > 0) {
        await jobService.markProcessing(unifiedJob?.id || '', 'uploading_files', 30, 'Uploading files')
        await SandboxService.writeFiles(
          data.sandboxName,
          data.files.map((f) => ({
            path: f.path,
            content: Buffer.from(f.contentBase64, 'base64'),
            mode: f.mode,
          })),
          { traceId: data.traceId, userId: data.userId, orgId: data.orgId },
        )
      }

      let cmd
      let args
      if (data.cmd) {
        cmd = data.cmd
        args = data.args || []
      } else {
        if (!data.code) throw new Error('Either `cmd` or `code` must be provided')
        const spec = DEFAULT_CMD[data.language]
        cmd = spec.cmd
        args = [...spec.prefixArgs, data.code]
      }

      await jobService.markProcessing(unifiedJob?.id || '', 'executing', 50, `Executing: ${cmd}`)
      const result = await Promise.race([
        SandboxService.runCommand(
          data.sandboxName,
          { cmd, args, cwd: data.cwd, env: data.env, sudo: true },
          { traceId: data.traceId, userId: data.userId, orgId: data.orgId },
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sandbox execution timeout')), SANDBOX_TIMEOUT)),
      ])

      let snapshotInfo
      if (data.snapshotAfter) {
        await jobService.markProcessing(unifiedJob?.id || '', 'snapshotting', 85, 'Creating snapshot')
        const snap = await SandboxService.snapshot(data.sandboxName, { audit: { traceId: data.traceId } })
        snapshotInfo = { snapshotId: snap.snapshotId, sizeBytes: snap.sizeBytes }
      }

      let stopInfo
      if (data.stopAfter) {
        await jobService.markProcessing(unifiedJob?.id || '', 'stopping', 95, 'Stopping sandbox')
        const stopped = await SandboxService.stop(data.sandboxName, { traceId: data.traceId })
        stopInfo = { snapshotId: stopped.snapshot?.id }
      }

      const output = {
        traceId: data.traceId,
        sandboxName: data.sandboxName,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        durationMs: result.durationMs,
        snapshot: snapshotInfo,
        stopped: stopInfo,
      }

      await writeAuditLog({
        traceId: data.traceId,
        agentName: 'legal-sandbox',
        userId: data.userId,
        action: 'sandbox_exec_complete',
        input: {
          sandboxName: data.sandboxName,
          language: data.language,
          cmd,
          argsPreview: args.slice(0, 1),
          fileCount: data.files?.length ?? 0,
        },
        output: {
          exitCode: result.exitCode,
          durationMs: result.durationMs,
          stdoutBytes: result.stdout.length,
          stderrBytes: result.stderr.length,
          snapshotId: snapshotInfo?.snapshotId,
        },
        durationMs: Date.now() - start,
      })

      if (unifiedJob) await jobService.markCompleted(unifiedJob.id, output)

      log.info(
        {
          traceId: data.traceId,
          sandboxName: data.sandboxName,
          exitCode: result.exitCode,
          durationMs: result.durationMs,
        },
        'sandbox job complete',
      )

      return output
    } catch (err) {
      const error = err
      const { retryable, code } = classifyError(error)
      log.error({ traceId: data.traceId, err: error.message, retryable, code }, 'sandbox job failed')

      await writeAuditLog({
        traceId: data.traceId,
        agentName: 'legal-sandbox',
        userId: data.userId,
        action: 'sandbox_exec_failed',
        input: { sandboxName: data.sandboxName, language: data.language, cmd: cmd || 'unknown' },
        output: { error: error.message },
        durationMs: Date.now() - start,
      })

      if (unifiedJob) {
        if (retryable && unifiedJob.attempts < unifiedJob.maxAttempts) {
          await jobService.markRetrying(unifiedJob.id, unifiedJob.attempts + 1)
          throw error
        }
        await jobService.markFailed(unifiedJob.id, error.message, code)
      }

      throw error
    }
  },
  { connection, concurrency: 2, maxStalledCount: 2, removeOnFail: false, removeOnComplete: false },
)

worker.on('completed', (job, result) => {
  log.info({ jobId: job.id }, 'sandbox job completed')
})
worker.on('failed', (job, err) => {
  log.error({ jobId: job?.id, err: err.message }, 'sandbox job failed')
})

process.on('SIGTERM', async () => {
  await worker.close()
  process.exit(0)
})

log.info('Legal Sandbox Worker started')