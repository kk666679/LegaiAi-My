ALTER TABLE "users"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "jobTitle" TEXT,
  ADD COLUMN "bio" TEXT,
  ADD COLUMN "timezone" TEXT DEFAULT 'Asia/Kuala_Lumpur',
  ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN "profilePhoto" TEXT;

ALTER TABLE "sessions"
  ADD COLUMN "userAgent" TEXT,
  ADD COLUMN "ipAddress" TEXT;

CREATE TABLE "saved_authorities" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "authority" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "saved_authorities_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "saved_authorities_userId_sourceId_key" ON "saved_authorities"("userId", "sourceId");
CREATE INDEX "saved_authorities_userId_createdAt_idx" ON "saved_authorities"("userId", "createdAt");
ALTER TABLE "saved_authorities" ADD CONSTRAINT "saved_authorities_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "integration_connections" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "config" TEXT NOT NULL,
  "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "integration_connections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "integration_connections_userId_provider_key" ON "integration_connections"("userId", "provider");
CREATE INDEX "integration_connections_userId_idx" ON "integration_connections"("userId");
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
