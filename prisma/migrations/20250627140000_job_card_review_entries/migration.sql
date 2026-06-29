-- CreateTable
CREATE TABLE "job_card_review_entries" (
    "id" TEXT NOT NULL,
    "job_card_id" TEXT NOT NULL,
    "status" "JobCardStatus",
    "observation" TEXT,
    "rectification" TEXT,
    "author_id" TEXT,
    "author_name" TEXT NOT NULL,
    "author_role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_card_review_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_card_review_entries_job_card_id_created_at_idx" ON "job_card_review_entries"("job_card_id", "created_at");

-- AddForeignKey
ALTER TABLE "job_card_review_entries" ADD CONSTRAINT "job_card_review_entries_job_card_id_fkey" FOREIGN KEY ("job_card_id") REFERENCES "job_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_card_review_entries" ADD CONSTRAINT "job_card_review_entries_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
