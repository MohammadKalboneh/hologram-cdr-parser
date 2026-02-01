import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import { parseFileContent } from "../parsers/parseFileContent";
import { uploadService } from "../services/uploadService";

// note: using memory storage since files are expected to be small
// for larger files I would stream line by line to avoid high memory usage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

export function uploadErrorHandler(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "File too large. Max allowed size is 5MB." });
  }
  return next(err);
}

export const uploadMiddleware = upload.single("file");

export async function uploadHandler(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Missing file field 'file' in multipart form-data." });
    }

    const content = req.file.buffer.toString("utf-8");
    const { records, errors } = parseFileContent(content);

    const { insertedCount } = await uploadService.bulkCreateRecords(records);

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
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).json({
      message: "Failed to process uploaded file",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
