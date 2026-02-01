import type { NormalizedUsageRecord, ParseError } from "../types";
import { parseLine } from "./parseLine";

export function parseFileContent(content: string): {
  records: NormalizedUsageRecord[];
  errors: ParseError[];
} {
  const records: NormalizedUsageRecord[] = [];
  const errors: ParseError[] = [];

  const lines = content.split(/\r?\n/);

  lines.forEach((raw, idx) => {
    const lineNumber = idx + 1;
    const line = raw.trim();
    if (!line) return; // ignore empty lines

    const result = parseLine(line);
    if (result.ok) records.push(result.record);
    else errors.push({ lineNumber, line: raw, message: result.message });
  });

  return { records, errors };
}
