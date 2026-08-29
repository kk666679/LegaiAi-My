import { z } from 'zod';
import { router, protectedProcedure, permissionProcedure } from '../trpc';
import { prisma } from '../../db';
import { credentialStore } from '../../lib/security/credentialStore';
import { createProviderClient } from '../../lib/providers/factory';
import { hashKeyRef } from '../../lib/security/credentials';
import type { ProviderType } from '../../lib/providers/types';

const ProviderTypeSchema = z.enum([
  'OPENAI', 'ANTHROPIC', 'GOOGLE', 'AZURE',
  'AWS_BEDROCK', 'OLLAMA', 'OPENROUTER', 'CUSTOM',
]);

export const providerRouter = router({
  addKey: permissionProcedure('manage_users')
    .input(z.object({
      provider: ProviderTypeSchema,
      name: z.string().min(1).max(100),
      apiKey: z.string().min(1),
      apiBaseUrl: z.string().url().optional(),
      defaultModel: z.string().min(1),
      executionMode: z.enum(['HOSTED', 'BYOK', 'LOCAL']).default('BYOK'),
      priority: z.number().int().min(0).max(100).default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const client = createProviderClient(input.provider);
      const isValid = await client.verifyCredential(input.apiKey, input.apiBaseUrl);

      if (!isValid) {
        await credentialStore.logKeyAction({
          orgId: ctx.orgId ?? undefined,
          userId: ctx.userId,
          action: 'FAILED',
          provider: input.provider,
          model: input.defaultModel,
          keyRef: hashKeyRef(input.apiKey),
          success: false,
          errorMessage: 'Credential verification failed',
          ipAddress: ctx.ipAddress,
        });
        throw new Error('Credential verification failed - invalid API key or endpoint');
      }

      const credential = await credentialStore.store({
        orgId: ctx.orgId ?? undefined,
        userId: ctx.userId,
        provider: input.provider as ProviderType,
        name: input.name,
        apiKey: input.apiKey,
        apiBaseUrl: input.apiBaseUrl,
        defaultModel: input.defaultModel,
        executionMode: input.executionMode,
        priority: input.priority,
      });

      await credentialStore.logKeyAction({
        orgId: ctx.orgId ?? undefined,
        userId: ctx.userId,
        providerConfigId: credential.id,
        action: 'VERIFIED',
        provider: input.provider,
        model: input.defaultModel,
        keyRef: credential.keyRef,
        success: true,
        ipAddress: ctx.ipAddress,
      });

      return { id: credential.id, name: credential.name, provider: credential.provider, verified: true };
    }),

  listKeys: permissionProcedure('view_audit_log')
    .query(async ({ ctx }) => {
      const keys = await credentialStore.list(ctx.orgId ?? undefined, ctx.userId);
      return keys.map((k) => ({
        id: k.id,
        name: k.name,
        provider: k.provider,
        defaultModel: k.defaultModel,
        isActive: k.isActive,
        isDefault: k.isDefault,
        executionMode: k.executionMode,
        priority: k.priority,
        keyRef: k.keyRef,
      }));
    }),

  verifyKey: permissionProcedure('manage_users')
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const isValid = await credentialStore.verify(input.id, ctx.userId, ctx.orgId ?? undefined);
      return { id: input.id, verified: isValid };
    }),

  setActive: permissionProcedure('manage_users')
    .input(z.object({ id: z.string(), active: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await credentialStore.setActive(input.id, input.active, ctx.orgId ?? undefined);
      return { id: input.id, active: input.active };
    }),

  setDefault: permissionProcedure('manage_users')
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await credentialStore.setDefault(input.id, ctx.orgId ?? undefined);
      return { id: input.id, isDefault: true };
    }),

  rotateKey: permissionProcedure('manage_users')
    .input(z.object({ id: z.string(), newApiKey: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const credential = await credentialStore.retrieve(input.id, ctx.userId, ctx.orgId ?? undefined);
      if (!credential) {
        throw new Error('Credential not found');
      }

      const client = createProviderClient(credential.provider);
      const isValid = await client.verifyCredential(input.newApiKey, credential.apiBaseUrl);

      if (!isValid) {
        throw new Error('New credential verification failed');
      }

      await credentialStore.rotate(input.id, input.newApiKey, ctx.orgId ?? undefined);

      await credentialStore.logKeyAction({
        orgId: ctx.orgId ?? undefined,
        userId: ctx.userId,
        providerConfigId: input.id,
        action: 'ROTATED',
        provider: credential.provider,
        model: credential.defaultModel,
        keyRef: credential.keyRef,
        success: true,
        ipAddress: ctx.ipAddress,
      });

      return { id: input.id, rotated: true };
    }),

  deleteKey: permissionProcedure('manage_users')
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await credentialStore.delete(input.id, ctx.orgId ?? undefined);
      return { id: input.id, deleted: true };
    }),

  getKeyAuditLog: permissionProcedure('view_audit_log')
    .input(z.object({
      providerConfigId: z.string().optional(),
      action: z.string().optional(),
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input, ctx }) => {
      const logs = await prisma.keyAuditLog.findMany({
        where: {
          orgId: ctx.orgId ?? undefined,
          ...(input.providerConfigId ? { providerConfigId: input.providerConfigId } : {}),
          ...(input.action ? { action: input.action } : {}),
          ...(input.from || input.to ? {
            createdAt: {
              ...(input.from ? { gte: new Date(input.from) } : {}),
              ...(input.to ? { lte: new Date(input.to) } : {}),
            },
          } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      });
      return logs;
    }),
});
