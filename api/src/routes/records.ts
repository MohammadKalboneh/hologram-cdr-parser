import { Request, Response } from "express";
import { recordService } from "../services/recordService";
import { toJsonSafe } from "../serialize";

export async function getRecordsHandler(_req: Request, res: Response) {
  try {
    const rows = await recordService.getRecords();
    res.json(toJsonSafe(rows));
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({
      message: "Failed to fetch records",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function createRecordHandler(req: Request, res: Response) {
  try {
    const { id, mnc, bytes_used, dmcc, cellid, ip } = req.body ?? {};

    if (typeof id !== "number" || typeof bytes_used !== "number") {
      return res.status(400).json({
        message: "id and bytes_used are required and must be numbers",
      });
    }

    const created = await recordService.createRecord({
      id,
      mnc,
      bytes_used,
      dmcc,
      cellid,
      ip,
    });

    // BigInt doesn't JSON-serialize by default, so normalize:
    res.status(201).json({
      ...created,
      cellid: created.cellid?.toString() ?? null,
    });
  } catch (error) {
    console.error("Error creating record:", error);
    res.status(500).json({
      message: "Failed to create record",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
