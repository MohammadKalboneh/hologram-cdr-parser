import { Readable } from "stream";
import { createInterface } from "readline";
import { parseLine } from "./parseLine";
import { NormalizedUsageRecord, ParseError } from "../types";

export interface StreamParseResult {
  record?: NormalizedUsageRecord;
  error?: ParseError;
  lineNumber: number;
}

export async function* parseFileStream(
  fileStream: Readable
): AsyncGenerator<StreamParseResult> {
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity, // Handle \r\n as single line break
  });

  let lineNumber = 0;

  try {
    for await (const raw of rl) {
      lineNumber++;
      const line = raw.trim();

      if (!line) continue; // Skip empty lines

      const result = parseLine(line);

      if (result.ok) {
        yield { record: result.record, lineNumber };
      } else {
        yield {
          error: { lineNumber, line: raw, message: result.message },
          lineNumber,
        };
      }
    }
  } finally {
    rl.close();
  }
}
