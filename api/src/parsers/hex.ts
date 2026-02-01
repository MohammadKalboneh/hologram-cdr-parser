import type { NormalizedUsageRecord } from "../types";

function hexToInt(hex: string): number {
  const n = parseInt(hex, 16);
  if (!Number.isFinite(n)) throw new Error("hex: invalid hex number");
  return n;
}

export function parseHex(line: string, id: number): NormalizedUsageRecord {
  const parts = line.split(",").map((s) => s.trim());
  if (parts.length !== 2) throw new Error("hex: expected 2 comma-separated values");

  const hex = parts[1];
  if (hex.length !== 24) throw new Error("hex: expected 24-character hex string");
  if (!/^[0-9a-fA-F]+$/.test(hex)) throw new Error("hex: contains non-hex characters");

  // bytes are pairs of chars
  const mncHex = hex.slice(0, 4);          // bytes 1-2
  const bytesHex = hex.slice(4, 8);        // bytes 3-4
  const cellidHex = hex.slice(8, 16);      // bytes 5-8
  const ipHex = hex.slice(16, 24);         // bytes 9-12

  const mnc = hexToInt(mncHex);
  const bytes = hexToInt(bytesHex);
  const cellid = hexToInt(cellidHex);

  const ipParts = [
    hexToInt(ipHex.slice(0, 2)),
    hexToInt(ipHex.slice(2, 4)),
    hexToInt(ipHex.slice(4, 6)),
    hexToInt(ipHex.slice(6, 8)),
  ];
  const ip = ipParts.join(".");

  return { id, mnc, bytes_used: bytes, dmcc: null, cellid, ip };
}
