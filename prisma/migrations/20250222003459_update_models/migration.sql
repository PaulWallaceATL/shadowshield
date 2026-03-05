-- First add the new columns
ALTER TABLE "Query" ADD COLUMN "content" TEXT;
ALTER TABLE "Query" ADD COLUMN "chatId" TEXT;

-- Copy existing data to new columns
UPDATE "Query" SET "content" = "query" WHERE "query" IS NOT NULL;

-- Create a default chat for existing queries
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

-- Link existing queries to default chats
UPDATE "Query" SET "chatId" = 'default-chat-' || "userId";

-- Now make the columns required
ALTER TABLE "Query" ALTER COLUMN "content" SET NOT NULL;
ALTER TABLE "Query" ALTER COLUMN "chatId" SET NOT NULL;

-- Drop foreign keys
ALTER TABLE "Alert" DROP CONSTRAINT IF EXISTS "Alert_userId_fkey";
ALTER TABLE "Query" DROP CONSTRAINT IF EXISTS "Query_userId_fkey";

-- Modify Alert table
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

-- Modify Chat table
ALTER TABLE "Chat" 
  ALTER COLUMN "provider" DROP DEFAULT,
  ALTER COLUMN "model" DROP DEFAULT;

-- Modify Query table
ALTER TABLE "Query" 
  DROP COLUMN IF EXISTS "flagReason",
  DROP COLUMN IF EXISTS "flagged",
  DROP COLUMN IF EXISTS "query",
  DROP COLUMN IF EXISTS "status",
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING',
  ALTER COLUMN "response" DROP NOT NULL,
  ALTER COLUMN "metadata" DROP DEFAULT;

-- Create indexes
CREATE INDEX IF NOT EXISTS "Query_userId_idx" ON "Query"("userId");
CREATE INDEX IF NOT EXISTS "Query_chatId_idx" ON "Query"("chatId");

-- Add foreign keys
ALTER TABLE "Query" ADD CONSTRAINT "Query_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Query" ADD CONSTRAINT "Query_chatId_fkey" 
  FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Alert" ADD CONSTRAINT "Alert_resolvedBy_fkey" 
  FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
