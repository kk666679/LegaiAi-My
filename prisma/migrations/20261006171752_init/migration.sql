CREATE EXTENSION IF NOT EXISTS vector;


-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."CitationStatus" AS ENUM ('PENDING', 'VERIFIED', 'UNVERIFIED', 'INVALID', 'CONFLICT', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."DraftJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'RETRIEVING_EVIDENCE', 'DRAFTING', 'VALIDATING', 'ANALYSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ExecutionMode" AS ENUM ('HOSTED', 'BYOK', 'LOCAL');

-- CreateEnum
CREATE TYPE "public"."ProviderType" AS ENUM ('OPENAI', 'ANTHROPIC', 'GOOGLE', 'AZURE', 'AWS_BEDROCK', 'OLLAMA', 'OPENROUTER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'SUSPENDED', 'TRIALING', 'PAYMENT_FAILED', 'INCOMPLETE');

-- CreateTable
CREATE TABLE "public"."agent_actions" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "matterId" TEXT,
    "agentName" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "authLevel" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "input" JSONB,
    "output" JSONB,
    "evidence" JSONB,
    "aiModel" TEXT,
    "toolsUsed" TEXT[],
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "traceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_governance_logs" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "eventType" TEXT NOT NULL,
    "aiModel" TEXT,
    "provider" TEXT,
    "dataClass" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "costUsd" DOUBLE PRECISION,
    "latencyMs" INTEGER,
    "userId" TEXT,
    "matterId" TEXT,
    "traceId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_governance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."alerts" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "matterId" TEXT,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB,
    "actionRequired" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "userId" TEXT,
    "orgId" TEXT,
    "action" TEXT NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "confidence" DOUBLE PRECISION,
    "durationMs" INTEGER,
    "prevHash" TEXT,
    "hash" TEXT,
    "caseId" TEXT,
    "legalHold" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."citation_references" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "orgId" TEXT,
    "userId" TEXT,
    "sourceId" TEXT,
    "displayText" TEXT NOT NULL,
    "section" TEXT,
    "jurisdiction" TEXT,
    "status" "public"."CitationStatus" NOT NULL DEFAULT 'PENDING',
    "confidence" DOUBLE PRECISION,
    "matchedTitle" TEXT,
    "matchedCitation" TEXT,
    "explanation" TEXT,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citation_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clients" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "clientType" TEXT NOT NULL DEFAULT 'individual',
    "status" TEXT NOT NULL DEFAULT 'active',
    "conflictCheck" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contracts" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "clientId" TEXT,
    "matterId" TEXT,
    "title" TEXT NOT NULL,
    "contractType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "counterparty" TEXT,
    "value" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'MYR',
    "effectiveDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "renewalNoticeDays" INTEGER DEFAULT 30,
    "riskScore" DOUBLE PRECISION,
    "riskLevel" TEXT,
    "playbook" JSONB,
    "obligations" JSONB,
    "keyTerms" JSONB,
    "fileUrl" TEXT,
    "content" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."country_configs" (
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
    "defaultPaymentProvider" TEXT NOT NULL DEFAULT 'xendit',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "taxEnabled" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_configs_pkey" PRIMARY KEY ("countryCode")
);

-- CreateTable
CREATE TABLE "public"."credit_accounts" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "currentBalance" INTEGER NOT NULL DEFAULT 0,
    "totalAllocated" INTEGER NOT NULL DEFAULT 0,
    "totalConsumed" INTEGER NOT NULL DEFAULT 0,
    "lastAllocatedAt" TIMESTAMP(3),
    "lastConsumedAt" TIMESTAMP(3),
    "lifetimeAllocated" INTEGER NOT NULL DEFAULT 0,
    "lifetimeConsumed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."credit_transactions" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."debate_transcripts" (
    "id" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "rounds" JSONB NOT NULL,
    "winner" TEXT,
    "adjudicator" TEXT,
    "anonymised" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debate_transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."devices" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "deviceFamily" TEXT NOT NULL,
    "pairedAt" TIMESTAMP(3),
    "token" TEXT,
    "metadata" JSONB,
    "lastSeen" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."draft_analyses" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "orgId" TEXT,
    "qualityScore" INTEGER,
    "citationCoverage" DOUBLE PRECISION,
    "issues" JSONB,
    "completeness" JSONB,
    "irac" JSONB,
    "conflicts" JSONB,
    "unsupported" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draft_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."draft_documents" (
    "id" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "userId" TEXT,
    "orgId" TEXT,
    "docType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'markdown',
    "tone" TEXT NOT NULL DEFAULT 'neutral',
    "citationsOk" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draft_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."draft_jobs" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "orgId" TEXT,
    "userId" TEXT,
    "traceId" TEXT,
    "jobType" TEXT NOT NULL,
    "status" "public"."DraftJobStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" JSONB,
    "payload" JSONB,
    "result" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draft_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."evidence_references" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "orgId" TEXT,
    "sourceId" TEXT,
    "title" TEXT NOT NULL,
    "citation" TEXT,
    "jurisdiction" TEXT,
    "section" TEXT,
    "relevance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supportType" TEXT NOT NULL DEFAULT 'authority',
    "excerpt" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."index_stats" (
    "id" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "docCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "index_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoices" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "customerId" TEXT,
    "subscriptionId" TEXT,
    "paymentId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MYR',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."key_audit_logs" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "userId" TEXT,
    "providerConfigId" TEXT,
    "action" TEXT NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "keyRef" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "key_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."legal_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "orgId" TEXT,
    "clientId" TEXT,
    "caseNumber" TEXT,
    "court" TEXT,
    "jurisdiction" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "parties" JSONB,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT DEFAULT 'text/markdown',
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."matter_events" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "parties" TEXT[],
    "documents" TEXT[],
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matter_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."matters" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "matterNumber" TEXT,
    "matterType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "jurisdiction" TEXT NOT NULL DEFAULT 'MY',
    "court" TEXT,
    "caseNumber" TEXT,
    "assignedTo" TEXT,
    "description" TEXT,
    "riskScore" DOUBLE PRECISION,
    "riskLevel" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "deadlineAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."model_routing_configs" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "name" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "provider" "public"."ProviderType",
    "model" TEXT,
    "minConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "maxCostUsd" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "model_routing_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organisations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pairing_requests" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "challenger" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pairing_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_audit_logs" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "paymentId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_customers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "organisationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'xendit',
    "providerCustomerId" TEXT,
    "countryCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_provider_accounts" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_provider_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_records" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "customerId" TEXT,
    "subscriptionId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'xendit',
    "providerPaymentId" TEXT,
    "providerCustomerId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'MYR',
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentMethod" TEXT,
    "providerMethod" TEXT,
    "countryCode" TEXT,
    "description" TEXT,
    "idempotencyKey" TEXT,
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_refunds" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "providerRefundId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MYR',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_routing_rules" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT,
    "currency" TEXT,
    "paymentMethod" TEXT,
    "customerSegment" TEXT,
    "planId" TEXT,
    "transactionValueMin" DOUBLE PRECISION,
    "transactionValueMax" DOUBLE PRECISION,
    "provider" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_routing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signature" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processingStatus" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."plan_prices" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "billingInterval" TEXT NOT NULL DEFAULT 'monthly',
    "provider" TEXT NOT NULL DEFAULT 'xendit',
    "providerPriceId" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveUntil" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."promotions" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "promotionalPrice" DOUBLE PRECISION NOT NULL,
    "standardPrice" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxRedemptions" INTEGER,
    "redemptionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provider_configs" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "userId" TEXT,
    "provider" "public"."ProviderType" NOT NULL,
    "name" TEXT NOT NULL,
    "apiKeyRef" TEXT NOT NULL,
    "apiBaseUrl" TEXT,
    "defaultModel" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "executionMode" "public"."ExecutionMode" NOT NULL DEFAULT 'BYOK',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."risk_scores" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "matterId" TEXT,
    "riskType" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "level" TEXT NOT NULL,
    "evidence" JSONB,
    "reasoning" TEXT,
    "recommendation" TEXT,
    "aiModel" TEXT,
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscriptions" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "trialEndsAt" TIMESTAMP(3),
    "promotionType" TEXT,
    "promotionalPrice" DOUBLE PRECISION,
    "userId" TEXT,
    "customerId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'xendit',
    "providerSubscriptionId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'MYR',
    "amount" DOUBLE PRECISION,
    "promotionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tax_rules" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "taxType" TEXT NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "inclusive" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "allowLLM" BOOLEAN NOT NULL DEFAULT true,
    "allowDraft" BOOLEAN NOT NULL DEFAULT false,
    "dataRegion" TEXT NOT NULL DEFAULT 'MY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "orgId" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vector_docs" (
    "id" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "source_type" TEXT,
    "content" TEXT,
    "metadata" JSONB,
    "vector" vector(1536),
    "caseName" TEXT,
    "court" TEXT,
    "judge" TEXT,
    "caseDate" TIMESTAMP(3),
    "citation" TEXT,
    "areaOfLaw" TEXT,
    "paragraphNum" INTEGER,
    "language" TEXT DEFAULT 'en',
    "checksum" TEXT,
    "approvedBy" TEXT,
    "indexVersion" INTEGER DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vector_docs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_actions_agentName_idx" ON "public"."agent_actions"("agentName" ASC);

-- CreateIndex
CREATE INDEX "agent_actions_matterId_idx" ON "public"."agent_actions"("matterId" ASC);

-- CreateIndex
CREATE INDEX "agent_actions_orgId_idx" ON "public"."agent_actions"("orgId" ASC);

-- CreateIndex
CREATE INDEX "agent_actions_status_idx" ON "public"."agent_actions"("status" ASC);

-- CreateIndex
CREATE INDEX "agent_actions_traceId_idx" ON "public"."agent_actions"("traceId" ASC);

-- CreateIndex
CREATE INDEX "ai_governance_logs_aiModel_idx" ON "public"."ai_governance_logs"("aiModel" ASC);

-- CreateIndex
CREATE INDEX "ai_governance_logs_createdAt_idx" ON "public"."ai_governance_logs"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "ai_governance_logs_eventType_idx" ON "public"."ai_governance_logs"("eventType" ASC);

-- CreateIndex
CREATE INDEX "ai_governance_logs_orgId_idx" ON "public"."ai_governance_logs"("orgId" ASC);

-- CreateIndex
CREATE INDEX "alerts_acknowledged_idx" ON "public"."alerts"("acknowledged" ASC);

-- CreateIndex
CREATE INDEX "alerts_alertType_idx" ON "public"."alerts"("alertType" ASC);

-- CreateIndex
CREATE INDEX "alerts_matterId_idx" ON "public"."alerts"("matterId" ASC);

-- CreateIndex
CREATE INDEX "alerts_orgId_idx" ON "public"."alerts"("orgId" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_agentName_idx" ON "public"."audit_logs"("agentName" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_caseId_idx" ON "public"."audit_logs"("caseId" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_orgId_idx" ON "public"."audit_logs"("orgId" ASC);

-- CreateIndex
CREATE INDEX "audit_logs_traceId_idx" ON "public"."audit_logs"("traceId" ASC);

-- CreateIndex
CREATE INDEX "citation_references_draftId_idx" ON "public"."citation_references"("draftId" ASC);

-- CreateIndex
CREATE INDEX "citation_references_orgId_idx" ON "public"."citation_references"("orgId" ASC);

-- CreateIndex
CREATE INDEX "citation_references_sourceId_idx" ON "public"."citation_references"("sourceId" ASC);

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "public"."clients"("email" ASC);

-- CreateIndex
CREATE INDEX "clients_orgId_idx" ON "public"."clients"("orgId" ASC);

-- CreateIndex
CREATE INDEX "contracts_clientId_idx" ON "public"."contracts"("clientId" ASC);

-- CreateIndex
CREATE INDEX "contracts_expiryDate_idx" ON "public"."contracts"("expiryDate" ASC);

-- CreateIndex
CREATE INDEX "contracts_matterId_idx" ON "public"."contracts"("matterId" ASC);

-- CreateIndex
CREATE INDEX "contracts_orgId_idx" ON "public"."contracts"("orgId" ASC);

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "public"."contracts"("status" ASC);

-- CreateIndex
CREATE INDEX "credit_accounts_orgId_idx" ON "public"."credit_accounts"("orgId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "credit_accounts_orgId_key" ON "public"."credit_accounts"("orgId" ASC);

-- CreateIndex
CREATE INDEX "credit_transactions_accountId_idx" ON "public"."credit_transactions"("accountId" ASC);

-- CreateIndex
CREATE INDEX "credit_transactions_createdAt_idx" ON "public"."credit_transactions"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "credit_transactions_type_idx" ON "public"."credit_transactions"("type" ASC);

-- CreateIndex
CREATE INDEX "debate_transcripts_traceId_idx" ON "public"."debate_transcripts"("traceId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "devices_deviceId_key" ON "public"."devices"("deviceId" ASC);

-- CreateIndex
CREATE INDEX "draft_analyses_draftId_idx" ON "public"."draft_analyses"("draftId" ASC);

-- CreateIndex
CREATE INDEX "draft_analyses_orgId_idx" ON "public"."draft_analyses"("orgId" ASC);

-- CreateIndex
CREATE INDEX "draft_documents_orgId_idx" ON "public"."draft_documents"("orgId" ASC);

-- CreateIndex
CREATE INDEX "draft_documents_traceId_idx" ON "public"."draft_documents"("traceId" ASC);

-- CreateIndex
CREATE INDEX "draft_jobs_draftId_idx" ON "public"."draft_jobs"("draftId" ASC);

-- CreateIndex
CREATE INDEX "draft_jobs_orgId_idx" ON "public"."draft_jobs"("orgId" ASC);

-- CreateIndex
CREATE INDEX "draft_jobs_status_idx" ON "public"."draft_jobs"("status" ASC);

-- CreateIndex
CREATE INDEX "evidence_references_draftId_idx" ON "public"."evidence_references"("draftId" ASC);

-- CreateIndex
CREATE INDEX "evidence_references_orgId_idx" ON "public"."evidence_references"("orgId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "index_stats_collection_key" ON "public"."index_stats"("collection" ASC);

-- CreateIndex
CREATE INDEX "invoice_items_invoiceId_idx" ON "public"."invoice_items"("invoiceId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "public"."invoices"("invoiceNumber" ASC);

-- CreateIndex
CREATE INDEX "invoices_organisationId_idx" ON "public"."invoices"("organisationId" ASC);

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "public"."invoices"("status" ASC);

-- CreateIndex
CREATE INDEX "invoices_subscriptionId_idx" ON "public"."invoices"("subscriptionId" ASC);

-- CreateIndex
CREATE INDEX "key_audit_logs_action_idx" ON "public"."key_audit_logs"("action" ASC);

-- CreateIndex
CREATE INDEX "key_audit_logs_createdAt_idx" ON "public"."key_audit_logs"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "key_audit_logs_orgId_idx" ON "public"."key_audit_logs"("orgId" ASC);

-- CreateIndex
CREATE INDEX "key_audit_logs_providerConfigId_idx" ON "public"."key_audit_logs"("providerConfigId" ASC);

-- CreateIndex
CREATE INDEX "legal_documents_caseNumber_idx" ON "public"."legal_documents"("caseNumber" ASC);

-- CreateIndex
CREATE INDEX "legal_documents_clientId_idx" ON "public"."legal_documents"("clientId" ASC);

-- CreateIndex
CREATE INDEX "legal_documents_createdAt_idx" ON "public"."legal_documents"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "legal_documents_docType_idx" ON "public"."legal_documents"("docType" ASC);

-- CreateIndex
CREATE INDEX "legal_documents_orgId_idx" ON "public"."legal_documents"("orgId" ASC);

-- CreateIndex
CREATE INDEX "legal_documents_status_idx" ON "public"."legal_documents"("status" ASC);

-- CreateIndex
CREATE INDEX "matter_events_eventDate_idx" ON "public"."matter_events"("eventDate" ASC);

-- CreateIndex
CREATE INDEX "matter_events_matterId_idx" ON "public"."matter_events"("matterId" ASC);

-- CreateIndex
CREATE INDEX "matters_clientId_idx" ON "public"."matters"("clientId" ASC);

-- CreateIndex
CREATE INDEX "matters_deadlineAt_idx" ON "public"."matters"("deadlineAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "matters_matterNumber_key" ON "public"."matters"("matterNumber" ASC);

-- CreateIndex
CREATE INDEX "matters_matterType_idx" ON "public"."matters"("matterType" ASC);

-- CreateIndex
CREATE INDEX "matters_orgId_idx" ON "public"."matters"("orgId" ASC);

-- CreateIndex
CREATE INDEX "matters_status_idx" ON "public"."matters"("status" ASC);

-- CreateIndex
CREATE INDEX "model_routing_configs_isActive_idx" ON "public"."model_routing_configs"("isActive" ASC);

-- CreateIndex
CREATE INDEX "model_routing_configs_orgId_idx" ON "public"."model_routing_configs"("orgId" ASC);

-- CreateIndex
CREATE INDEX "model_routing_configs_taskType_idx" ON "public"."model_routing_configs"("taskType" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "organisations_slug_key" ON "public"."organisations"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "pairing_requests_deviceId_challenger_key" ON "public"."pairing_requests"("deviceId" ASC, "challenger" ASC);

-- CreateIndex
CREATE INDEX "payment_audit_logs_action_idx" ON "public"."payment_audit_logs"("action" ASC);

-- CreateIndex
CREATE INDEX "payment_audit_logs_orgId_idx" ON "public"."payment_audit_logs"("orgId" ASC);

-- CreateIndex
CREATE INDEX "payment_audit_logs_subscriptionId_idx" ON "public"."payment_audit_logs"("subscriptionId" ASC);

-- CreateIndex
CREATE INDEX "payment_customers_organisationId_idx" ON "public"."payment_customers"("organisationId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "payment_customers_organisationId_key" ON "public"."payment_customers"("organisationId" ASC);

-- CreateIndex
CREATE INDEX "payment_customers_provider_idx" ON "public"."payment_customers"("provider" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "payment_provider_accounts_provider_key" ON "public"."payment_provider_accounts"("provider" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "payment_records_idempotencyKey_key" ON "public"."payment_records"("idempotencyKey" ASC);

-- CreateIndex
CREATE INDEX "payment_records_organisationId_idx" ON "public"."payment_records"("organisationId" ASC);

-- CreateIndex
CREATE INDEX "payment_records_providerPaymentId_idx" ON "public"."payment_records"("providerPaymentId" ASC);

-- CreateIndex
CREATE INDEX "payment_records_provider_idx" ON "public"."payment_records"("provider" ASC);

-- CreateIndex
CREATE INDEX "payment_records_status_idx" ON "public"."payment_records"("status" ASC);

-- CreateIndex
CREATE INDEX "payment_records_subscriptionId_idx" ON "public"."payment_records"("subscriptionId" ASC);

-- CreateIndex
CREATE INDEX "payment_refunds_paymentId_idx" ON "public"."payment_refunds"("paymentId" ASC);

-- CreateIndex
CREATE INDEX "payment_routing_rules_countryCode_idx" ON "public"."payment_routing_rules"("countryCode" ASC);

-- CreateIndex
CREATE INDEX "payment_routing_rules_provider_idx" ON "public"."payment_routing_rules"("provider" ASC);

-- CreateIndex
CREATE INDEX "payment_webhook_events_processingStatus_idx" ON "public"."payment_webhook_events"("processingStatus" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_provider_eventId_key" ON "public"."payment_webhook_events"("provider" ASC, "eventId" ASC);

-- CreateIndex
CREATE INDEX "payment_webhook_events_provider_idx" ON "public"."payment_webhook_events"("provider" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "plan_prices_planId_countryCode_currency_billingInterval_key" ON "public"."plan_prices"("planId" ASC, "countryCode" ASC, "currency" ASC, "billingInterval" ASC);

-- CreateIndex
CREATE INDEX "plan_prices_planId_idx" ON "public"."plan_prices"("planId" ASC);

-- CreateIndex
CREATE INDEX "promotions_isActive_idx" ON "public"."promotions"("isActive" ASC);

-- CreateIndex
CREATE INDEX "promotions_planId_idx" ON "public"."promotions"("planId" ASC);

-- CreateIndex
CREATE INDEX "provider_configs_isActive_idx" ON "public"."provider_configs"("isActive" ASC);

-- CreateIndex
CREATE INDEX "provider_configs_orgId_idx" ON "public"."provider_configs"("orgId" ASC);

-- CreateIndex
CREATE INDEX "provider_configs_provider_idx" ON "public"."provider_configs"("provider" ASC);

-- CreateIndex
CREATE INDEX "provider_configs_userId_idx" ON "public"."provider_configs"("userId" ASC);

-- CreateIndex
CREATE INDEX "risk_scores_matterId_idx" ON "public"."risk_scores"("matterId" ASC);

-- CreateIndex
CREATE INDEX "risk_scores_riskType_idx" ON "public"."risk_scores"("riskType" ASC);

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "public"."sessions"("token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "public"."sessions"("token" ASC);

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "public"."sessions"("userId" ASC);

-- CreateIndex
CREATE INDEX "subscriptions_orgId_idx" ON "public"."subscriptions"("orgId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_orgId_key" ON "public"."subscriptions"("orgId" ASC);

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "public"."subscriptions"("status" ASC);

-- CreateIndex
CREATE INDEX "tax_rules_countryCode_idx" ON "public"."tax_rules"("countryCode" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "user_consents_userId_key" ON "public"."user_consents"("userId" ASC);

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email" ASC);

-- CreateIndex
CREATE INDEX "users_orgId_idx" ON "public"."users"("orgId" ASC);

-- CreateIndex
CREATE INDEX "vector_docs_caseDate_idx" ON "public"."vector_docs"("caseDate" ASC);

-- CreateIndex
CREATE INDEX "vector_docs_collection_idx" ON "public"."vector_docs"("collection" ASC);

-- CreateIndex
CREATE INDEX "vector_docs_court_idx" ON "public"."vector_docs"("court" ASC);

-- AddForeignKey
ALTER TABLE "public"."agent_actions" ADD CONSTRAINT "agent_actions_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "public"."matters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "public"."matters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "public"."matters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credit_transactions" ADD CONSTRAINT "credit_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."credit_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matter_events" ADD CONSTRAINT "matter_events_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "public"."matters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."matters" ADD CONSTRAINT "matters_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pairing_requests" ADD CONSTRAINT "pairing_requests_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_records" ADD CONSTRAINT "payment_records_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."payment_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_records" ADD CONSTRAINT "payment_records_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_refunds" ADD CONSTRAINT "payment_refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."payment_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."risk_scores" ADD CONSTRAINT "risk_scores_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "public"."matters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."payment_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

