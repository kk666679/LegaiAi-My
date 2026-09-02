import { prisma } from '../../db';
import { encrypt, decrypt, generateKeyRef, hashKeyRef } from './credentials';
import { createProviderClient } from '../providers/factory';
import type { ProviderType, ExecutionMode } from '../providers/types';

export interface StoredCredential {
  id: string;
  orgId?: string;
  userId?: string;
  provider: ProviderType;
  name: string;
  keyRef: string;
  apiBaseUrl?: string;
  defaultModel: string;
  isActive: boolean;
  isDefault: boolean;
  executionMode: ExecutionMode;
  priority: number;
  expiresAt?: Date;
}

export interface CreateCredentialInput {
  orgId?: string;
  userId?: string;
  provider: ProviderType;
  name: string;
  apiKey: string;
  apiBaseUrl?: string;
  defaultModel: string;
  executionMode?: ExecutionMode;
  priority?: number;
}

export interface DecryptedCredential extends StoredCredential {
  apiKey: string;
}

export class CredentialStore {
  async store(input: CreateCredentialInput): Promise<StoredCredential> {
    const keyRef = generateKeyRef();
    const encryptedKey = encrypt(input.apiKey);

    const config = await prisma.providerConfig.create({
      data: {
        orgId: input.orgId,
        userId: input.userId,
        provider: input.provider,
        name: input.name,
        apiKeyRef: `${keyRef}:${encryptedKey}`,
        apiBaseUrl: input.apiBaseUrl,
        defaultModel: input.defaultModel,
        executionMode: input.executionMode || 'BYOK',
        priority: input.priority || 0,
      },
    });

    return {
      id: config.id,
      orgId: config.orgId || undefined,
      userId: config.userId || undefined,
      provider: config.provider as ProviderType,
      name: config.name,
      keyRef: hashKeyRef(keyRef),
      apiBaseUrl: config.apiBaseUrl || undefined,
      defaultModel: config.defaultModel,
      isActive: config.isActive,
      isDefault: config.isDefault,
      executionMode: config.executionMode as ExecutionMode,
      priority: config.priority,
      expiresAt: config.expiresAt || undefined,
    };
  }

  async retrieve(id: string, userId?: string, orgId?: string): Promise<DecryptedCredential | null> {
    const config = await prisma.providerConfig.findFirst({
      where: {
        id,
        ...(orgId ? { orgId } : { userId: userId || undefined }),
      },
    });

    if (!config) return null;

    const [keyRef = '', encryptedKey = ''] = config.apiKeyRef.split(':');
    const apiKey = decrypt(encryptedKey);

    return {
      id: config.id,
      orgId: config.orgId || undefined,
      userId: config.userId || undefined,
      provider: config.provider as ProviderType,
      name: config.name,
      keyRef: hashKeyRef(keyRef),
      apiBaseUrl: config.apiBaseUrl || undefined,
      defaultModel: config.defaultModel,
      isActive: config.isActive,
      isDefault: config.isDefault,
      executionMode: config.executionMode as ExecutionMode,
      priority: config.priority,
      expiresAt: config.expiresAt || undefined,
      apiKey,
    };
  }

  async verify(id: string, userId?: string, orgId?: string): Promise<boolean> {
    const credential = await this.retrieve(id, userId, orgId);
    if (!credential) return false;

    const client = createProviderClient(credential.provider);
    return client.verifyCredential(credential.apiKey, credential.apiBaseUrl);
  }

  async list(orgId?: string, userId?: string): Promise<StoredCredential[]> {
    const configs = await prisma.providerConfig.findMany({
      where: {
        OR: [
          { orgId: orgId || null, userId: null },
          { userId: userId || null },
        ],
      },
      orderBy: [{ isDefault: 'desc' }, { priority: 'desc' }],
    });

    return configs.map((c) => ({
      id: c.id,
      orgId: c.orgId || undefined,
      userId: c.userId || undefined,
      provider: c.provider as ProviderType,
      name: c.name,
      keyRef: hashKeyRef(c.apiKeyRef.split(':')[0] ?? ''),
      apiBaseUrl: c.apiBaseUrl || undefined,
      defaultModel: c.defaultModel,
      isActive: c.isActive,
      isDefault: c.isDefault,
      executionMode: c.executionMode as ExecutionMode,
      priority: c.priority,
      expiresAt: c.expiresAt || undefined,
    }));
  }

  async setActive(id: string, active: boolean, orgId?: string): Promise<void> {
    await prisma.providerConfig.updateMany({
      where: { id, orgId: orgId || undefined },
      data: { isActive: active },
    });
  }

  async setDefault(id: string, orgId?: string): Promise<void> {
    await prisma.$transaction([
      prisma.providerConfig.updateMany({
        where: { orgId: orgId || undefined, userId: null },
        data: { isDefault: false },
      }),
      prisma.providerConfig.updateMany({
        where: { id, orgId: orgId || undefined },
        data: { isDefault: true },
      }),
    ]);
  }

  async delete(id: string, orgId?: string): Promise<void> {
    await prisma.providerConfig.deleteMany({
      where: { id, orgId: orgId || undefined },
    });
  }

  async rotate(id: string, newApiKey: string, orgId?: string): Promise<void> {
    const config = await prisma.providerConfig.findFirst({
      where: { id, orgId: orgId || undefined },
    });

    if (!config) throw new Error('Credential not found');

    const [oldKeyRef] = config.apiKeyRef.split(':');
    const encryptedKey = encrypt(newApiKey);

    await prisma.providerConfig.update({
      where: { id },
      data: { apiKeyRef: `${oldKeyRef}:${encryptedKey}`, updatedAt: new Date() },
    });
  }

  async logKeyAction(params: {
    orgId?: string;
    userId?: string;
    providerConfigId?: string;
    action: string;
    provider?: string;
    model?: string;
    keyRef: string;
    success: boolean;
    errorMessage?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await prisma.keyAuditLog.create({
      data: {
        orgId: params.orgId,
        userId: params.userId,
        providerConfigId: params.providerConfigId,
        action: params.action,
        provider: params.provider,
        model: params.model,
        keyRef: params.keyRef,
        success: params.success,
        errorMessage: params.errorMessage,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }
}

export const credentialStore = new CredentialStore();
