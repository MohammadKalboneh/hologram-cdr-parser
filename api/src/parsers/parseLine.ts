import type { NormalizedUsageRecord } from "../types";
import { parseBasic } from "./basic";
import { parseExtended } from "./extended";
import { parseHex } from "./hex";

export type ParseLineResult =
  | { ok: true; record: NormalizedUsageRecord }
  | { ok: false; message: string };

export function parseLine(line: string): ParseLineResult {
  const trimmed = line.trim();
  if (!trimmed) return { ok: false, message: "empty line" };

  const firstComma = trimmed.indexOf(",");
  if (firstComma === -1) return { ok: false, message: "missing comma" };

  const idString = trimmed.slice(0, firstComma).trim();
  const id = Number(idString);
  if (!Number.isInteger(id)) return { ok: false, message: "invalid id" };

  const lastDigit = Math.abs(id) % 10;

  try {
    if (lastDigit === 4) return { ok: true, record: parseExtended(trimmed, id) };
    if (lastDigit === 6) return { ok: true, record: parseHex(trimmed, id) };
    return { ok: true, record: parseBasic(trimmed, id) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "parse error" };
  }
}
