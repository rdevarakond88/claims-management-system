-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('URGENT', 'STANDARD', 'ROUTINE');

-- AlterTable
ALTER TABLE "claims" ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "priority_confidence" DECIMAL(3,2),
ADD COLUMN     "priority_reasoning" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_first_login" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "session" (
    "sid" VARCHAR NOT NULL,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE INDEX "IDX_session_expire" ON "session"("expire");

-- CreateIndex
CREATE INDEX "claims_priority_created_at_idx" ON "claims"("priority", "created_at");
