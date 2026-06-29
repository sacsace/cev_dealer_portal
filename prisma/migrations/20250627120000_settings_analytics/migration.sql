-- AlterTable
ALTER TABLE "warranty_claims" ADD COLUMN "handled_by_id" TEXT;
ALTER TABLE "warranty_claims" ADD COLUMN "handled_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "page_visits" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "role" TEXT,
    "user_id" TEXT,
    "referrer" TEXT,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_visits_created_at_idx" ON "page_visits"("created_at");
CREATE INDEX "page_visits_path_idx" ON "page_visits"("path");

-- AddForeignKey
ALTER TABLE "warranty_claims" ADD CONSTRAINT "warranty_claims_handled_by_id_fkey" FOREIGN KEY ("handled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "page_visits" ADD CONSTRAINT "page_visits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
