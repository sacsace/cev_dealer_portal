-- CreateTable
CREATE TABLE "order_review_entries" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" "OrderStatus",
    "delivery_status" TEXT,
    "courier_name" TEXT,
    "tracking_no" TEXT,
    "note" TEXT,
    "author_id" TEXT,
    "author_name" TEXT NOT NULL,
    "author_role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_review_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_review_entries_order_id_created_at_idx" ON "order_review_entries"("order_id", "created_at");

-- AddForeignKey
ALTER TABLE "order_review_entries" ADD CONSTRAINT "order_review_entries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_review_entries" ADD CONSTRAINT "order_review_entries_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
