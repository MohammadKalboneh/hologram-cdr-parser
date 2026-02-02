import { prisma } from "../db";
import { NormalizedUsageRecord } from "../types";

export interface BatchInsertResult {
  insertedCount: number;
  totalProcessed: number;
}

export class StreamUploadService {
  private readonly BATCH_SIZE = 500;

  async insertBatch(records: NormalizedUsageRecord[]): Promise<number> {
    if (records.length === 0) return 0;

    const dbRows = records.map((r) => ({
      id: r.id,
      mnc: r.mnc,
      bytesUsed: r.bytes_used,
      dmcc: r.dmcc,
      cellid: r.cellid != null ? BigInt(r.cellid) : null,
      ip: r.ip,
    }));

    const result = await prisma.usageRecord.createMany({
      data: dbRows,
      skipDuplicates: true,
    });

    return result.count;
  }

  async processStreamInBatches(
    recordStream: AsyncGenerator<NormalizedUsageRecord>
  ): Promise<BatchInsertResult> {
    let batch: NormalizedUsageRecord[] = [];
    let totalInserted = 0;
    let totalProcessed = 0;

    for await (const record of recordStream) {
      batch.push(record);
      totalProcessed++;

      if (batch.length >= this.BATCH_SIZE) {
        const inserted = await this.insertBatch(batch);
        totalInserted += inserted;
        batch = []; // Clear batch
      }
    }

    // Insert remaining records
    if (batch.length > 0) {
      const inserted = await this.insertBatch(batch);
      totalInserted += inserted;
    }

    return { insertedCount: totalInserted, totalProcessed };
  }
}

export const streamUploadService = new StreamUploadService();
