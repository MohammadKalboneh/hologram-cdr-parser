import type { Request, Response } from "express";
import Busboy from "busboy";
import { parseFileStream } from "../parsers/streamParser";
import { streamUploadService } from "../services/streamUploadService";
import { ParseError } from "../types";

export async function streamUploadHandler(req: Request, res: Response) {
  try {
    const result = await new Promise<{
      totalLines: number;
      parsedRecords: number;
      insertedRecords: number;
      errors: ParseError[];
    }>((resolve, reject) => {
      const busboy = Busboy({
        headers: req.headers,
        limits: {
          fileSize: 100 * 1024 * 1024, // 100 MB limit
          files: 1,
        },
      });

      let fileProcessed = false;
      const errors: ParseError[] = [];
      let totalLines = 0;
      let parsedRecords = 0;

      busboy.on("file", (fieldname, fileStream) => {
        if (fieldname !== "file") {
          fileStream.resume(); // Drain stream
          return;
        }
        fileProcessed = true;

        (async () => {
          try {
            const recordGenerator = (async function* () {
              for await (const r of parseFileStream(fileStream)) {
                totalLines++;
                if (r.record) {
                  parsedRecords++;
                  yield r.record;
                } else if (r.error) {
                  errors.push(r.error);
                }
              }
            })();

            const { insertedCount } =
              await streamUploadService.processStreamInBatches(recordGenerator);

            resolve({
              totalLines,
              parsedRecords,
              insertedRecords: insertedCount,
              errors,
            });
          } catch (e) {
            reject(e);
          }
        })().catch(reject);
      });

      busboy.on("error", reject);

      busboy.on("finish", () => {
        if (!fileProcessed) {
          reject(new Error("Missing file field 'file' in multipart form-data."));
        }
      });

      req.pipe(busboy);
    });

    return res.status(200).json({
      meta: {
        totalLines: result.totalLines,
        parsedRecords: result.parsedRecords,
        insertedRecords: result.insertedRecords,
        errorCount: result.errors.length,
      },
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error("Error in stream upload:", error);
    const statusCode =
      error instanceof Error && error.message.includes("Missing file field") ? 400 : 500;
    return res.status(statusCode).json({
      message: "Failed to process upload",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
