import { prisma } from "../db";

export interface CreateRecordInput {
  id: number;
  mnc?: number;
  bytes_used: number;
  dmcc?: string;
  cellid?: number;
  ip?: string;
}

export class RecordService {
  async getRecords(limit: number = 500) {
    return await prisma.usageRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async createRecord(input: CreateRecordInput) {
    const { id, mnc, bytes_used, dmcc, cellid, ip } = input;

    const created = await prisma.usageRecord.create({
      data: {
        id,
        mnc: typeof mnc === "number" ? mnc : null,
        bytesUsed: bytes_used,
        dmcc: typeof dmcc === "string" ? dmcc : null,
        cellid: typeof cellid === "number" ? BigInt(cellid) : null,
        ip: typeof ip === "string" ? ip : null,
      },
    });

    return created;
  }
}

export const recordService = new RecordService();
