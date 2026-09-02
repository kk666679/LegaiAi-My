/**
 * Vercel Sandbox tRPC router.
 *
 * Exposes a curated surface over the @vercel/sandbox SDK for the frontend:
 *  - create / get / getOrCreate / list
 *  - runCommand (blocking) / runDetached (returns cmdId)
 *  - writeFiles / readFileToBuffer
 *  - snapshot / stop / delete
 *  - listSnapshots / listSandboxes
 *
 * All mutations require `manage_users` permission because sandbox creation
 * consumes project quota and runs arbitrary code.
 */
import { z } from 'zod'
import { router, protectedProcedure, permissionProcedure } from '../trpc'
import { SandboxService } from '../../lib/sandbox'
import { TRPCError } from '@trpc/server'
import { writeAuditLog } from '../../lib/audit'

const SandboxNameSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9][a-z0-9-_]*$/, 'Sandbox name must be lowercase alphanumeric with dashes/underscores')

const NetworkPolicySchema = z.union([
  z.literal('allow-all'),
  z.literal('deny-all'),
  z.object({
    allow: z.array(z.string()).optional(),
    subnets: z
      .object({
        allow: z.array(z.string()).optional(),
        deny: z.array(z.string()).optional(),
      })
      .optional(),
  }),
])

const CreateSandboxSchema = z.object({
  name: SandboxNameSchema.optional(),
  image: z.string().optional(),
  vcpus: z.number().int().min(1).max(32).optional(),
  timeout: z.number().int().min(30_000).max(24 * 60 * 60 * 1000).optional(),
  networkPolicy: NetworkPolicySchema.optional(),
  region: z.string().optional(),
  failoverRegions: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  tags: z.record(z.string(), z.string()).refine((r) => Object.keys(r).length <= 5, 'Max 5 tags').optional(),
  persistent: z.boolean().optional(),
  snapshotExpiration: z.number().int().min(0).optional(),
  source: z
    .object({
      type: z.literal('git'),
      url: z.string().url(),
      username: z.string().optional(),
      password: z.string().optional(),
      depth: z.number().int().min(1).optional(),
      revision: z.string().optional(),
    })
    .optional(),
  snapshotId: z.string().optional(),
})

const RunCommandSchema = z.object({
  sandboxName: SandboxNameSchema,
  cmd: z.string().min(1).max(1024),
  args: z.array(z.string().max(1024)).max(64).optional(),
  cwd: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
  sudo: z.boolean().optional(),
  detached: z.boolean().optional(),
})

export const sandboxRouter = router({
  /**
   * Create a new sandbox. The response includes only safe accessors; the
   * SDK object is not exposed to clients.
   */
  create: permissionProcedure('manage_users')
    .input(CreateSandboxSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const sandbox = await SandboxService.create({
          ...input,
          audit: { traceId: ctx.traceId, userId: ctx.userId ?? undefined, orgId: ctx.orgId ?? undefined },
        })
        return {
          name: sandbox.name,
          status: sandbox.status,
          region: sandbox.region,
          image: sandbox.image,
          vcpus: sandbox.vcpus,
          memory: sandbox.memory,
          timeout: sandbox.timeout,
        }
      } catch (err) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: (err as Error).message })
      }
    }),

  get: protectedProcedure
    .input(z.object({ name: SandboxNameSchema, resume: z.boolean().default(false) }))
    .query(async ({ input }) => {
      const sandbox = await SandboxService.get(input.name, { resume: input.resume })
      return {
        name: sandbox.name,
        status: sandbox.status,
        region: sandbox.region,
        image: sandbox.image,
        vcpus: sandbox.vcpus,
        memory: sandbox.memory,
        timeout: sandbox.timeout,
        persistent: sandbox.persistent,
        expiresAt: sandbox.expiresAt,
        tags: sandbox.tags,
      }
    }),

  getOrCreate: permissionProcedure('manage_users')
    .input(CreateSandboxSchema.extend({ resume: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      const sandbox = await SandboxService.getOrCreate({
        ...input,
        audit: { traceId: ctx.traceId, userId: ctx.userId ?? undefined, orgId: ctx.orgId ?? undefined },
      })
      return {
        name: sandbox.name,
        status: sandbox.status,
        region: sandbox.region,
        persistent: sandbox.persistent,
      }
    }),

  list: permissionProcedure('manage_users')
    .input(
      z
        .object({
          namePrefix: z.string().optional(),
          tags: z.record(z.string(), z.string()).optional(),
          limit: z.number().int().min(1).max(100).default(20),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      return SandboxService.list({
        namePrefix: input?.namePrefix,
        tags: input?.tags,
        limit: input?.limit,
      })
    }),

  runCommand: permissionProcedure('manage_users')
    .input(RunCommandSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.detached) {
        const cmd = await SandboxService.runDetached(
          input.sandboxName,
          {
            cmd: input.cmd,
            args: input.args,
            cwd: input.cwd,
            env: input.env,
            sudo: input.sudo,
          },
          { traceId: ctx.traceId, userId: ctx.userId ?? undefined, orgId: ctx.orgId ?? undefined },
        )
        return { cmdId: cmd.cmdId, startedAt: cmd.startedAt, exitCode: null, detached: true as const }
      }
      const result = await SandboxService.runCommand(
        input.sandboxName,
        {
          cmd: input.cmd,
          args: input.args,
          cwd: input.cwd,
          env: input.env,
          sudo: input.sudo,
        },
        { traceId: ctx.traceId, userId: ctx.userId ?? undefined, orgId: ctx.orgId ?? undefined },
      )
      return {
        cmdId: result.cmdId,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        durationMs: result.durationMs,
        detached: false as const,
      }
    }),

  writeFiles: permissionProcedure('manage_users')
    .input(
      z.object({
        sandboxName: SandboxNameSchema,
        files: z
          .array(
            z.object({
              path: z.string().min(1).max(1024),
              contentBase64: z.string().min(1).max(10 * 1024 * 1024),
              mode: z.number().int().min(0).max(0o7777).optional(),
            }),
          )
          .min(1)
          .max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const files = input.files.map((f) => ({
        path: f.path,
        content: Buffer.from(f.contentBase64, 'base64'),
        mode: f.mode,
      }))
      await SandboxService.writeFiles(input.sandboxName, files, {
        traceId: ctx.traceId,
        userId: ctx.userId ?? undefined,
        orgId: ctx.orgId ?? undefined,
      })
      await writeAuditLog({
        traceId: ctx.traceId,
        agentName: 'vercel-sandbox',
        userId: ctx.userId ?? undefined,
        action: 'sandbox_writeFiles_trpc',
        input: { sandboxName: input.sandboxName, count: files.length, paths: files.map((f) => f.path) },
        output: { count: files.length },
        durationMs: 0,
      })
      return { written: files.length }
    }),

  readFile: protectedProcedure
    .input(z.object({ sandboxName: SandboxNameSchema, path: z.string().min(1).max(1024) }))
    .query(async ({ input }) => {
      const buf = await SandboxService.readFileToBuffer(input.sandboxName, input.path)
      if (!buf) return { path: input.path, contentBase64: null, exists: false as const }
      return { path: input.path, contentBase64: buf.toString('base64'), exists: true as const }
    }),

  snapshot: permissionProcedure('manage_users')
    .input(
      z.object({
        sandboxName: SandboxNameSchema,
        expiration: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const snap = await SandboxService.snapshot(input.sandboxName, { expiration: input.expiration })
      return {
        snapshotId: snap.snapshotId,
        status: snap.status,
        sizeBytes: snap.sizeBytes,
        expiresAt: snap.expiresAt,
      }
    }),

  stop: permissionProcedure('manage_users')
    .input(z.object({ sandboxName: SandboxNameSchema }))
    .mutation(async ({ input }) => {
      const result = await SandboxService.stop(input.sandboxName)
      return {
        snapshotId: result.snapshot?.id,
        activeCpuDurationMs: result.activeCpuDurationMs,
        networkTransfer: result.networkTransfer,
      }
    }),

  delete: permissionProcedure('manage_users')
    .input(z.object({ sandboxName: SandboxNameSchema }))
    .mutation(async ({ input }) => {
      await SandboxService.delete(input.sandboxName)
      return { ok: true }
    }),

  listSnapshots: permissionProcedure('manage_users')
    .input(z.object({ name: SandboxNameSchema.optional(), limit: z.number().int().min(1).max(100).default(20) }).optional())
    .query(async ({ input }) => {
      return SandboxService.listSnapshots({ name: input?.name, limit: input?.limit })
    }),
})

export type SandboxRouter = typeof sandboxRouter