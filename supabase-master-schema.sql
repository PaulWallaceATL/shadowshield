-- ShadowAI Shield: Master schema bootstrap for Supabase Postgres
-- Source: consolidated from prisma/migrations/* in this repository
-- Intended for fresh databases (run once).

begin;

-- =========================================================
-- 1) Enums
-- =========================================================

CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE "QueryStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'FLAGGED');
CREATE TYPE "LLMProvider" AS ENUM ('ANTHROPIC', 'OPENAI', 'GOOGLE');
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "AlertType" AS ENUM ('DLP_VIOLATION', 'SYSTEM_ERROR', 'AUTHENTICATION_FAILURE', 'API_ERROR');
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'ESCALATED');
CREATE TYPE "DLPType" AS ENUM ('REGEX', 'KEYWORD', 'ENTITY');
CREATE TYPE "DLPAction" AS ENUM ('ALERT', 'BLOCK', 'REDACT');

-- =========================================================
-- 2) Base tables
-- =========================================================

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "department" TEXT,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "verifyToken" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Query" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "QueryStatus" NOT NULL DEFAULT 'PROCESSED',
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "latency" INTEGER,
    "tokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Query_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DLPRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "description" TEXT,
    "type" "DLPType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "action" "DLPAction" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DLPRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "settings" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- =========================================================
-- 3) Base indexes / foreign keys
-- =========================================================

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_verifyToken_key" ON "User"("verifyToken");
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Query" ADD CONSTRAINT "Query_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =========================================================
-- 4) Migration: add user request model
-- =========================================================

CREATE TABLE "UserRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "department" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserRequest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "UserRequest" ADD CONSTRAINT "UserRequest_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserRequest" ADD CONSTRAINT "UserRequest_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =========================================================
-- 5) Migration: add chat + api_keys + query metadata
-- =========================================================

ALTER TABLE "Query" ADD COLUMN "metadata" JSONB DEFAULT '{}';

CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'ANTHROPIC',
    "model" TEXT NOT NULL DEFAULT 'claude-3-opus-20240229',
    "messages" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");
CREATE INDEX "Chat_userId_idx" ON "Chat"("userId");

ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =========================================================
-- 6) Migration: add alert relations
-- =========================================================

ALTER TABLE "Alert"
  ADD COLUMN "chatId" TEXT,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "queryId" TEXT,
  ADD COLUMN "resolvedBy" TEXT,
  ADD COLUMN "userId" TEXT,
  ADD COLUMN "violatedRule" TEXT,
  ALTER COLUMN "metadata" SET DEFAULT '{}';

CREATE INDEX "Alert_userId_idx" ON "Alert"("userId");
CREATE INDEX "Alert_chatId_idx" ON "Alert"("chatId");
CREATE INDEX "Alert_queryId_idx" ON "Alert"("queryId");

ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Alert" ADD CONSTRAINT "Alert_chatId_fkey"
  FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Alert" ADD CONSTRAINT "Alert_queryId_fkey"
  FOREIGN KEY ("queryId") REFERENCES "Query"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =========================================================
-- 7) Migration: model update
-- =========================================================

ALTER TABLE "Query" ADD COLUMN "content" TEXT;
ALTER TABLE "Query" ADD COLUMN "chatId" TEXT;

UPDATE "Query" SET "content" = "query" WHERE "query" IS NOT NULL;

INSERT INTO "Chat" ("id", "title", "userId", "provider", "model", "messages", "createdAt", "updatedAt")
SELECT
  'default-chat-' || "userId",
  'Default Chat',
  "userId",
  "provider",
  "model",
  ARRAY['[]'::jsonb],
  NOW(),
  NOW()
FROM "Query"
GROUP BY "userId", "provider", "model";

UPDATE "Query" SET "chatId" = 'default-chat-' || "userId";

ALTER TABLE "Query" ALTER COLUMN "content" SET NOT NULL;
ALTER TABLE "Query" ALTER COLUMN "chatId" SET NOT NULL;

ALTER TABLE "Alert" DROP CONSTRAINT IF EXISTS "Alert_userId_fkey";
ALTER TABLE "Query" DROP CONSTRAINT IF EXISTS "Query_userId_fkey";

ALTER TABLE "Alert"
  DROP COLUMN IF EXISTS "assignedTo",
  DROP COLUMN IF EXISTS "violatedRule",
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  DROP COLUMN IF EXISTS "type",
  ADD COLUMN "type" TEXT NOT NULL DEFAULT 'SYSTEM_ERROR',
  DROP COLUMN IF EXISTS "severity",
  ADD COLUMN "severity" TEXT NOT NULL DEFAULT 'HIGH',
  DROP COLUMN IF EXISTS "status",
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING',
  ALTER COLUMN "metadata" DROP DEFAULT,
  ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Chat"
  ALTER COLUMN "provider" DROP DEFAULT,
  ALTER COLUMN "model" DROP DEFAULT;

ALTER TABLE "Query"
  DROP COLUMN IF EXISTS "flagReason",
  DROP COLUMN IF EXISTS "flagged",
  DROP COLUMN IF EXISTS "query",
  DROP COLUMN IF EXISTS "status",
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING',
  ALTER COLUMN "response" DROP NOT NULL,
  ALTER COLUMN "metadata" DROP DEFAULT;

CREATE INDEX IF NOT EXISTS "Query_userId_idx" ON "Query"("userId");
CREATE INDEX IF NOT EXISTS "Query_chatId_idx" ON "Query"("chatId");

ALTER TABLE "Query" ADD CONSTRAINT "Query_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Query" ADD CONSTRAINT "Query_chatId_fkey"
  FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Alert" ADD CONSTRAINT "Alert_resolvedBy_fkey"
  FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =========================================================
-- 8) Migration: alert defaults cleanup
-- =========================================================

ALTER TABLE "Alert"
  ALTER COLUMN "updatedAt" DROP DEFAULT,
  ALTER COLUMN "type" DROP DEFAULT,
  ALTER COLUMN "severity" DROP DEFAULT;

-- =========================================================
-- 9) Migration: admin test chat support
-- =========================================================

ALTER TABLE "Chat"
  ADD COLUMN "isAdminTest" BOOLEAN NOT NULL DEFAULT false,
  ALTER COLUMN "provider" DROP NOT NULL,
  ALTER COLUMN "model" DROP NOT NULL;

commit;

-- =========================================================
-- Optional bootstrap seed data
-- =========================================================
-- NOTE: Replace IDs/emails/password hashes as needed.
-- Password hashes must be bcrypt hashes because the app verifies with bcryptjs.

-- Example super admin password hash below corresponds to "password123".
-- You should change it after first login.
--
-- INSERT INTO "User" (
--   "id", "name", "email", "password", "role", "isActive",
--   "mustChangePassword", "department", "emailVerified", "createdAt", "updatedAt"
-- ) VALUES (
--   'seed-super-admin',
--   'Platform Super Admin',
--   'admin@example.com',
--   '$2b$10$q1eLqoAHaNtOE.edwxtkF.XoxoF1q2EIxr78lRRD2gTs/L8/iJ1ni',
--   'SUPER_ADMIN',
--   true,
--   true,
--   'Security',
--   now(),
--   now(),
--   now()
-- ) ON CONFLICT ("email") DO NOTHING;
--
-- INSERT INTO "SystemSettings" ("id", "key", "value", "createdAt", "updatedAt")
-- VALUES (
--   'seed-llm-config',
--   'llm_config',
--   '{"defaultProvider":"ANTHROPIC","defaultModel":"claude-3-opus-20240229","maxTokens":4096,"temperature":0.7}',
--   now(),
--   now()
-- )
-- ON CONFLICT ("key") DO UPDATE SET
--   "value" = excluded."value",
--   "updatedAt" = now();
--
-- INSERT INTO "DLPRule" (
--   "id", "name", "pattern", "description", "type", "severity", "action", "isActive", "createdAt", "updatedAt"
-- ) VALUES
--   (
--     'seed-rule-credit-card-1',
--     'Credit Card Numbers',
--     '\\b\\d{4}[- ]?\\d{4}[- ]?\\d{4}[- ]?\\d{4}\\b',
--     'Detects credit card numbers',
--     'REGEX',
--     'HIGH',
--     'BLOCK',
--     true,
--     now(),
--     now()
--   ),
--   (
--     'seed-rule-credit-card-2',
--     'Credit Card Detection',
--     '\\b(?:\\d[ -]*?){13,16}\\b',
--     'Detects potential credit card numbers in messages',
--     'REGEX',
--     'HIGH',
--     'BLOCK',
--     true,
--     now(),
--     now()
--   )
-- ON CONFLICT ("id") DO NOTHING;
