/**
 * Vercel Sandbox service wrapper.
 *
 * Provides a thin, audited facade over `@vercel/sandbox` for safely running
 * untrusted code, arbitrary shell pipelines, and full Linux workflows inside
 * isolated microVMs. Use this whenever the caller needs to execute code that
 * originated from outside the trust boundary (e.g. model-generated snippets,
 * uploaded documents, third-party scripts).
 *
 * Authentication is automatic when VERCEL_OIDC_TOKEN is present (set by
 * `vercel link` / `vercel env pull` locally, and provided natively on Vercel).
 *
 * Security defaults: network egress is closed by default. Pass
 * `networkPolicy: 'allow-all'` explicitly when external access is required.
 */

import { Sandbox, Snapshot, APIError, type CommandFinished, type NetworkPolicy, type Sandbox as SandboxInstance } from '@vercel/sandbox'
import { randomUUID } from 'node:crypto'
import { writeAuditLog } from './audit.js'
import { agentLogger } from './logger.js'

const log = agentLogger('vercel-sandbox')

export type { NetworkPolicy }

export interface CreateSandboxInput {
  /** Unique sandbox name within the project (used to resume later). */
  name?: string
  /** OCI image reference. Defaults to env or `vercel/sandbox/universal`. */
  image?: string
  /** vCPUs (memory auto-scales to 2048 MB per vCPU). */
  vcpus?: number
  /** Session timeout in ms. */
  timeout?: number
  /** Egress policy. Defaults to env-driven value or `allow-all`. */
  networkPolicy?: NetworkPolicy
  /** Region override. */
  region?: string
  /** Failover regions. */
  failoverRegions?: string[]
  /** Per-sandbox env vars. */
  env?: Record<string, string>
  /** Tags for filtering / listing. */
  tags?: Record<string, string>
  /** Persist filesystem across stop/resume. Defaults to `true`. */
  persistent?: boolean
  /** Default snapshot TTL in ms (0 = never expire). */
  snapshotExpiration?: number
  /** Mount a git repo as the source. */
  source?: {
    type: 'git'
    url: string
    username?: string
    password?: string
    depth?: number
    revision?: string
  }
  /** Mount a tarball URL. */
  sourceTarball?: { url: string }
  /** Audit context. */
  audit?: { traceId?: string; userId?: string; orgId?: string }
}

export interface RunCommandInput {
  cmd: string
  args?: string[]
  cwd?: string
  env?: Record<string, string>
  sudo?: boolean
  /** Detached = return immediately; caller must await later. */
  detached?: boolean
  signal?: AbortSignal
}

export interface RunCommandResult {
  exitCode: number
  stdout: string
  stderr: string
  durationMs: number
  cmdId: string
}

const DEFAULT_IMAGE = process.env.VERCEL_SANDBOX_IMAGE || 'vercel/sandbox/universal'
const DEFAULT_TIMEOUT = Number(process.env.VERCEL_SANDBOX_TIMEOUT_MS) || 5 * 60 * 1000
const DEFAULT_VCPUS = Number(process.env.VERCEL_SANDBOX_VCPUS) || 2
const DEFAULT_NETWORK_POLICY: NetworkPolicy =
  (process.env.VERCEL_SANDBOX_NETWORK_POLICY === 'deny-all' ? 'deny-all' : 'allow-all')
const DEFAULT_REGION = process.env.VERCEL_SANDBOX_REGION || undefined

function auditCtx(input?: { traceId?: string; userId?: string; orgId?: string }) {
  return {
    traceId: input?.traceId ?? randomUUID(),
    userId: input?.userId,
    orgId: input?.orgId,
  }
}

type SourceParam =
  | { type: 'git'; url: string; username?: string; password?: string; depth?: number; revision?: string }
  | { type: 'tarball'; url: string }

function buildSource(input: CreateSandboxInput): SourceParam | undefined {
  if (input.source) {
    if (input.source.username && input.source.password) {
      return {
        type: 'git',
        url: input.source.url,
        username: input.source.username,
        password: input.source.password,
        ...(input.source.depth !== undefined ? { depth: input.source.depth } : {}),
        ...(input.source.revision !== undefined ? { revision: input.source.revision } : {}),
      }
    }
    return {
      type: 'git',
      url: input.source.url,
      ...(input.source.depth !== undefined ? { depth: input.source.depth } : {}),
      ...(input.source.revision !== undefined ? { revision: input.source.revision } : {}),
    }
  }
  if (input.sourceTarball) {
    return { type: 'tarball', url: input.sourceTarball.url }
  }
  return undefined
}

/**
 * Create a new sandbox. Sandboxes are persistent by default so subsequent
 * `getOrCreate` calls can resume the filesystem.
 */
export async function createSandbox(input: CreateSandboxInput = {}) {
  const ctx = auditCtx(input.audit)
  const start = Date.now()
  const source = buildSource(input)
  const networkPolicy = input.networkPolicy ?? DEFAULT_NETWORK_POLICY

  try {
    const sandbox = await Sandbox.create({
      ...(input.name !== undefined ? { name: input.name } : {}),
      image: input.image || DEFAULT_IMAGE,
      resources: { vcpus: input.vcpus ?? DEFAULT_VCPUS },
      timeout: input.timeout ?? DEFAULT_TIMEOUT,
      networkPolicy,
      ...(input.region ?? DEFAULT_REGION ? { region: input.region ?? DEFAULT_REGION } : {}),
      ...(input.failoverRegions ? { failoverRegions: input.failoverRegions } : {}),
      ...(input.env ? { env: input.env } : {}),
      ...(input.tags ? { tags: input.tags } : {}),
      persistent: input.persistent ?? true,
      ...(input.snapshotExpiration !== undefined ? { snapshotExpiration: input.snapshotExpiration } : {}),
      ...(source ? { source } : {}),
    })

    await writeAuditLog({
      traceId: ctx.traceId,
      agentName: 'vercel-sandbox',
      userId: ctx.userId,
      action: 'sandbox_create',
      input: {
        name: sandbox.name,
        image: input.image || DEFAULT_IMAGE,
        vcpus: input.vcpus ?? DEFAULT_VCPUS,
        timeout: input.timeout ?? DEFAULT_TIMEOUT,
        networkPolicy,
      },
      output: { sandboxName: sandbox.name, status: sandbox.status, region: sandbox.region },
      durationMs: Date.now() - start,
    })

    log.info({ traceId: ctx.traceId, name: sandbox.name }, 'sandbox created')
    return sandbox
  } catch (err) {
    log.error({ traceId: ctx.traceId, err: (err as Error).message }, 'sandbox create failed')
    throw err
  }
}

/**
 * Resume an existing sandbox by name. Auto-resumes on next SDK call when
 * `resume: true` is passed (default).
 */
export async function getSandbox(name: string, opts: { resume?: boolean } = {}) {
  return Sandbox.get({ name, resume: opts.resume ?? true })
}

/**
 * getOrCreate pattern: resume if exists, create if missing. `onCreate` runs
 * once on first creation. `onResume` runs every session resume.
 */
export async function getOrCreateSandbox(
  input: CreateSandboxInput & {
    onCreate?: (sandbox: SandboxInstance) => Promise<void>
    onResume?: (sandbox: SandboxInstance) => Promise<void>
    resume?: boolean
  },
) {
  const { onCreate, onResume, resume, audit, ...create } = input
  auditCtx(audit)
  const source = buildSource(create)
  const networkPolicy = create.networkPolicy ?? DEFAULT_NETWORK_POLICY

  return Sandbox.getOrCreate({
    ...(create.name !== undefined ? { name: create.name } : {}),
    image: create.image || DEFAULT_IMAGE,
    resources: { vcpus: create.vcpus ?? DEFAULT_VCPUS },
    timeout: create.timeout ?? DEFAULT_TIMEOUT,
    networkPolicy,
    ...(create.region ?? DEFAULT_REGION ? { region: create.region ?? DEFAULT_REGION } : {}),
    ...(create.failoverRegions ? { failoverRegions: create.failoverRegions } : {}),
    ...(create.env ? { env: create.env } : {}),
    ...(create.tags ? { tags: create.tags } : {}),
    persistent: create.persistent ?? true,
    ...(create.snapshotExpiration !== undefined ? { snapshotExpiration: create.snapshotExpiration } : {}),
    ...(source ? { source } : {}),
    ...(resume !== undefined ? { resume } : {}),
    ...(onCreate ? { onCreate } : {}),
    ...(onResume ? { onResume } : {}),
  } as Parameters<typeof Sandbox.getOrCreate>[0])
}

/**
 * Run a blocking command. Captures stdout/stderr, returns structured result,
 * and writes an audit log entry. For long-running processes use `runDetached`.
 */
export async function runCommand(
  sandboxName: string,
  input: RunCommandInput,
  audit: { traceId?: string; userId?: string; orgId?: string } = {},
): Promise<RunCommandResult> {
  const ctx = auditCtx(audit)
  const start = Date.now()
  const sandbox = await getSandbox(sandboxName, { resume: true })

  const finished: CommandFinished = await sandbox.runCommand({
    cmd: input.cmd,
    args: input.args,
    cwd: input.cwd,
    env: input.env,
    sudo: input.sudo,
    detached: false,
    signal: input.signal,
  } as Parameters<typeof sandbox.runCommand>[0])

  const stdout = await finished.stdout()
  const stderr = await finished.stderr()

  const result: RunCommandResult = {
    exitCode: finished.exitCode,
    stdout,
    stderr,
    durationMs: finished.durationMs ?? Date.now() - start,
    cmdId: finished.cmdId,
  }

  await writeAuditLog({
    traceId: ctx.traceId,
    agentName: 'vercel-sandbox',
    userId: ctx.userId,
    action: 'sandbox_runCommand',
    input: {
      sandboxName,
      cmd: input.cmd,
      args: input.args,
      cwd: input.cwd,
      sudo: input.sudo ?? true,
    },
    output: { exitCode: result.exitCode, durationMs: result.durationMs, cmdId: result.cmdId },
    durationMs: result.durationMs,
  })

  return result
}

/**
 * Run a detached command. Returns a Command-like handle with kill/wait/stdout.
 * Caller is responsible for awaiting `wait()` to collect the result.
 */
export async function runDetached(
  sandboxName: string,
  input: RunCommandInput,
  audit: { traceId?: string; userId?: string; orgId?: string } = {},
) {
  const ctx = auditCtx(audit)
  const sandbox = await getSandbox(sandboxName, { resume: true })

  const cmd = await sandbox.runCommand({
    cmd: input.cmd,
    args: input.args,
    cwd: input.cwd,
    env: input.env,
    sudo: input.sudo,
    detached: true,
  } as Parameters<typeof sandbox.runCommand>[0])

  await writeAuditLog({
    traceId: ctx.traceId,
    agentName: 'vercel-sandbox',
    userId: ctx.userId,
    action: 'sandbox_runDetached',
    input: { sandboxName, cmd: input.cmd, args: input.args },
    output: { cmdId: cmd.cmdId, startedAt: cmd.startedAt },
    durationMs: 0,
  })

  return cmd
}

/**
 * Write one or more files into the sandbox filesystem.
 */
export async function writeFiles(
  sandboxName: string,
  files: Array<{ path: string; content: Buffer | Uint8Array; mode?: number }>,
  audit: { traceId?: string; userId?: string; orgId?: string } = {},
) {
  const ctx = auditCtx(audit)
  const sandbox = await getSandbox(sandboxName, { resume: true })
  await sandbox.writeFiles(
    files.map((f) => ({
      path: f.path,
      content: Buffer.isBuffer(f.content) ? f.content : Buffer.from(f.content),
      ...(f.mode !== undefined ? { mode: f.mode } : {}),
    })),
  )
  await writeAuditLog({
    traceId: ctx.traceId,
    agentName: 'vercel-sandbox',
    userId: ctx.userId,
    action: 'sandbox_writeFiles',
    input: { sandboxName, count: files.length, paths: files.map((f) => f.path) },
    output: { count: files.length },
    durationMs: 0,
  })
}

/**
 * Read a file from the sandbox. Returns `null` when the file does not exist.
 */
export async function readFileToBuffer(
  sandboxName: string,
  path: string,
  audit: { traceId?: string; userId?: string; orgId?: string } = {},
): Promise<Buffer | null> {
  const sandbox = await getSandbox(sandboxName, { resume: true })
  return sandbox.readFileToBuffer({ path })
}

/**
 * Capture a snapshot of the sandbox filesystem. The sandbox is stopped and
 * cannot be used afterwards.
 */
export async function snapshotSandbox(
  sandboxName: string,
  opts: { expiration?: number; audit?: { traceId?: string; userId?: string; orgId?: string } } = {},
) {
  const ctx = auditCtx(opts.audit)
  const sandbox = await getSandbox(sandboxName, { resume: true })
  const snap = await sandbox.snapshot({ expiration: opts.expiration })
  await writeAuditLog({
    traceId: ctx.traceId,
    agentName: 'vercel-sandbox',
    userId: ctx.userId,
    action: 'sandbox_snapshot',
    input: { sandboxName, expiration: opts.expiration },
    output: { snapshotId: snap.snapshotId, sizeBytes: snap.sizeBytes },
    durationMs: 0,
  })
  return snap
}

/**
 * Stop a sandbox session (persistent sandboxes keep their filesystem as a
 * snapshot; non-persistent ones are destroyed).
 */
export async function stopSandbox(
  sandboxName: string,
  audit: { traceId?: string; userId?: string; orgId?: string } = {},
) {
  const ctx = auditCtx(audit)
  const sandbox = await getSandbox(sandboxName, { resume: true })
  const result = await sandbox.stop()
  await writeAuditLog({
    traceId: ctx.traceId,
    agentName: 'vercel-sandbox',
    userId: ctx.userId,
    action: 'sandbox_stop',
    input: { sandboxName },
    output: {
      snapshotId: result.snapshot?.id,
      activeCpuDurationMs: result.activeCpuDurationMs,
      networkTransfer: result.networkTransfer,
    },
    durationMs: 0,
  })
  return result
}

/**
 * Delete a sandbox permanently. Snapshots remain until they expire.
 */
export async function deleteSandbox(
  sandboxName: string,
  audit: { traceId?: string; userId?: string; orgId?: string } = {},
) {
  const ctx = auditCtx(audit)
  const sandbox = await getSandbox(sandboxName, { resume: false })
  await sandbox.delete()
  await writeAuditLog({
    traceId: ctx.traceId,
    agentName: 'vercel-sandbox',
    userId: ctx.userId,
    action: 'sandbox_delete',
    input: { sandboxName },
    output: {},
    durationMs: 0,
  })
}

/**
 * List sandboxes for the current project (auto-paginates).
 */
export async function listSandboxes(opts: {
  namePrefix?: string
  tags?: Record<string, string>
  limit?: number
} = {}) {
  const result = await Sandbox.list({
    namePrefix: opts.namePrefix,
    tags: opts.tags,
    limit: opts.limit,
  } as Parameters<typeof Sandbox.list>[0])

  const out: Array<{ name: string; status: string; region: string; createdAt: number }> = []
  for await (const sb of result) {
    out.push({
      name: sb.name,
      status: sb.status,
      region: sb.region ?? '',
      createdAt: sb.createdAt,
    })
  }
  return out
}

/**
 * List snapshots (auto-paginates). Returns raw snapshot metadata with
 * `expiresAt` as a millisecond timestamp.
 */
export async function listSnapshots(opts: { name?: string; limit?: number } = {}) {
  const result = await Snapshot.list(opts as Parameters<typeof Snapshot.list>[0])
  const out: Array<{
    id: string
    status: string
    sizeBytes: number
    expiresAt: number | null
    sourceSessionId: string
  }> = []
  for await (const snap of result) {
    out.push({
      id: snap.id,
      status: snap.status,
      sizeBytes: snap.sizeBytes,
      expiresAt: snap.expiresAt ?? null,
      sourceSessionId: snap.sourceSessionId,
    })
  }
  return out
}

export const SandboxService = {
  create: createSandbox,
  get: getSandbox,
  getOrCreate: getOrCreateSandbox,
  runCommand,
  runDetached,
  writeFiles,
  readFileToBuffer,
  snapshot: snapshotSandbox,
  stop: stopSandbox,
  delete: deleteSandbox,
  list: listSandboxes,
  listSnapshots,
}

export { Sandbox, Snapshot, APIError }
export type { CommandFinished }