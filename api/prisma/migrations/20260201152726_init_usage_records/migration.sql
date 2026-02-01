-- CreateTable
CREATE TABLE "usage_records" (
    "id" INTEGER NOT NULL,
    "mnc" INTEGER,
    "bytes_used" INTEGER NOT NULL,
    "dmcc" TEXT,
    "cellid" BIGINT,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);
