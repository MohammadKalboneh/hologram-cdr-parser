import type { NormalizedUsageRecord } from "../types";

export function parseBasic(line: string, id: number): NormalizedUsageRecord {
  const parts = line.split(",").map((s) => s.trim());
  if (parts.length !== 2) throw new Error("basic: expected 2 comma-separated values");

  const bytes = Number(parts[1]);
  if (!Number.isInteger(bytes)) throw new Error("basic: bytes_used must be an integer");

  return { id, mnc: null, bytes_used: bytes, dmcc: null, cellid: null, ip: null };
}
