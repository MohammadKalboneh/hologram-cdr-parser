import type { NormalizedUsageRecord } from "../types";

export function parseExtended(line: string, id: number): NormalizedUsageRecord {
  const parts = line.split(",").map((s) => s.trim());
  if (parts.length !== 5) throw new Error("extended: expected 5 comma-separated values");

  const dmcc = parts[1];
  const mnc = Number(parts[2]);
  const bytes = Number(parts[3]);
  const cellid = Number(parts[4]);

  if (!dmcc) throw new Error("extended: dmcc is required");
  if (!Number.isInteger(mnc)) throw new Error("extended: mnc must be an integer");
  if (!Number.isInteger(bytes)) throw new Error("extended: bytes_used must be an integer");
  if (!Number.isInteger(cellid)) throw new Error("extended: cellid must be an integer");

  return { id, mnc, bytes_used: bytes, dmcc, cellid, ip: null };
}
