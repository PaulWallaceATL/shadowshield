-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "chatId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "queryId" TEXT,
ADD COLUMN     "resolvedBy" TEXT,
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "violatedRule" TEXT,
ALTER COLUMN "metadata" SET DEFAULT '{}';

-- CreateIndex
CREATE INDEX "Alert_userId_idx" ON "Alert"("userId");

-- CreateIndex
CREATE INDEX "Alert_chatId_idx" ON "Alert"("chatId");

-- CreateIndex
CREATE INDEX "Alert_queryId_idx" ON "Alert"("queryId");

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "Query"("id") ON DELETE SET NULL ON UPDATE CASCADE;
