import { prisma } from "../db";
import { NormalizedUsageRecord } from "../types";

export interface UploadResult {
  insertedCount: number;
}

export class UploadService {
  async bulkCreateRecords(records: NormalizedUsageRecord[]): Promise<UploadResult> {
    const dbRows = records.map((r) => ({
      id: r.id,
      mnc: r.mnc,
      bytesUsed: r.bytes_used,
      dmcc: r.dmcc,
      cellid: r.cellid != null ? BigInt(r.cellid) : null,
      ip: r.ip,
    }));

    if (dbRows.length === 0) {
      return { insertedCount: 0 };
    }

    const result = await prisma.usageRecord.createMany({
      data: dbRows,
      skipDuplicates: true,
    });

    return { insertedCount: result.count };
  }
}

export const uploadService = new UploadService();
