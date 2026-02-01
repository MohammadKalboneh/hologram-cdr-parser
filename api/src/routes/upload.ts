import type { Request, Response } from "express";
import multer from "multer";
import { parseFileContent } from "../parsers/parseFileContent";
import { prisma } from "../db";

// note: using memory storage since files are expected to be small
// for larger files I would stream line by line to avoid high memory usage
const upload = multer({ storage: multer.memoryStorage() });

export const uploadMiddleware = upload.single("file");

export async function uploadHandler(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ message: "Missing file field 'file' in multipart form-data." });
  }

  const content = req.file.buffer.toString("utf-8");

  const { records, errors } = parseFileContent(content);

  const dbRows = records.map((r) => ({
    id: r.id,
    mnc: r.mnc,
    bytesUsed: r.bytes_used,
    dmcc: r.dmcc,
    cellid: r.cellid != null ? BigInt(r.cellid) : null,
    ip: r.ip,
  }));

  let insertedCount = 0;

  if (dbRows.length > 0) {
    const result = await prisma.usageRecord.createMany({
      data: dbRows,
      skipDuplicates: true,
    });
    insertedCount = result.count;
  }

  return res.status(200).json({
    meta: {
      totalLines: content.split(/\r?\n/).filter((l) => l.trim().length > 0).length,
      parsedRecords: records.length,
      insertedRecords: insertedCount,
      errorCount: errors.length,
    },
    records,
    errors,
  });
}
