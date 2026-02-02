import type { Request, Response } from "express";
import Busboy from "busboy";
import { parseFileStream } from "../parsers/streamParser";
import { streamUploadService } from "../services/streamUploadService";
import { ParseError } from "../types";

export async function streamUploadHandler(req: Request, res: Response) {
  try {
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

    busboy.on("file", async (fieldname, fileStream, info) => {
      if (fieldname !== "file") {
        fileStream.resume(); // Drain stream
        return;
      }

      fileProcessed = true;

      try {
        const recordGenerator = (async function* () {
          for await (const result of parseFileStream(fileStream)) {
            totalLines++;

            if (result.record) {
              parsedRecords++;
              yield result.record;
            } else if (result.error) {
              errors.push(result.error);
            }
          }
        })();

        // Process in batches
        const { insertedCount } = await streamUploadService.processStreamInBatches(recordGenerator);

        res.status(200).json({
          meta: {
            totalLines,
            parsedRecords,
            insertedRecords: insertedCount,
            errorCount: errors.length,
          },
          errors: errors.length > 0 ? errors : undefined,
        });
      } catch (error) {
        console.error("Error processing file stream:", error);
        if (!res.headersSent) {
          res.status(500).json({
            message: "Failed to process file stream",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    });

    busboy.on("error", (error: Error) => {
      console.error("Busboy error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          message: "Error parsing multipart form",
          error: error.message,
        });
      }
    });

    busboy.on("finish", () => {
      if (!fileProcessed && !res.headersSent) {
        res.status(400).json({
          message: "Missing file field 'file' in multipart form-data.",
        });
      }
    });

    req.pipe(busboy);
  } catch (error) {
    console.error("Error in stream upload:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        message: "Failed to process upload",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
