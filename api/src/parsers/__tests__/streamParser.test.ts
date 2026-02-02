import { Readable } from "stream";
import { parseFileStream } from "../streamParser";

describe("parseFileStream", () => {
  function createReadableStream(content: string): Readable {
    const stream = new Readable();
    stream.push(content);
    stream.push(null); // End of stream
    return stream;
  }

  it("should parse valid lines from stream", async () => {
    const content = "1,1000\n2,2000";
    const stream = createReadableStream(content);

    const results = [];
    for await (const result of parseFileStream(stream)) {
      results.push(result);
    }

    expect(results).toHaveLength(2);
    expect(results[0].record).toBeDefined();
    expect(results[0].record?.id).toBe(1);
    expect(results[0].record?.bytes_used).toBe(1000);
    expect(results[0].lineNumber).toBe(1);
    expect(results[1].record).toBeDefined();
    expect(results[1].record?.id).toBe(2);
    expect(results[1].record?.bytes_used).toBe(2000);
    expect(results[1].lineNumber).toBe(2);
  });

  it("should handle errors in stream", async () => {
    const content = "1,1000\ninvalid-line\n3,3000";
    const stream = createReadableStream(content);

    const results = [];
    for await (const result of parseFileStream(stream)) {
      results.push(result);
    }

    expect(results).toHaveLength(3);
    expect(results[0].record).toBeDefined();
    expect(results[1].error).toBeDefined();
    expect(results[1].error?.lineNumber).toBe(2);
    expect(results[2].record).toBeDefined();
  });

  it("should skip empty lines", async () => {
    const content = "1,1000\n\n\n2,2000";
    const stream = createReadableStream(content);

    const results = [];
    for await (const result of parseFileStream(stream)) {
      results.push(result);
    }

    expect(results).toHaveLength(2);
    expect(results[0].lineNumber).toBe(1);
    expect(results[1].lineNumber).toBe(4);
  });

  it("should handle different line endings", async () => {
    const content = "1,1000\r\n2,2000\n3,3000";
    const stream = createReadableStream(content);

    const results = [];
    for await (const result of parseFileStream(stream)) {
      results.push(result);
    }

    expect(results).toHaveLength(3);
    expect(results[0].record?.id).toBe(1);
    expect(results[1].record?.id).toBe(2);
    expect(results[2].record?.id).toBe(3);
  });

  it("should handle empty stream", async () => {
    const content = "";
    const stream = createReadableStream(content);

    const results = [];
    for await (const result of parseFileStream(stream)) {
      results.push(result);
    }

    expect(results).toHaveLength(0);
  });

  it("should handle stream with only whitespace", async () => {
    const content = "   \n  \n\t\n";
    const stream = createReadableStream(content);

    const results = [];
    for await (const result of parseFileStream(stream)) {
      results.push(result);
    }

    expect(results).toHaveLength(0);
  });

  it("should track line numbers correctly", async () => {
    const content = "1,1000\ninvalid\n\n2,2000";
    const stream = createReadableStream(content);

    const results = [];
    for await (const result of parseFileStream(stream)) {
      results.push(result);
    }

    expect(results).toHaveLength(3);
    expect(results[0].lineNumber).toBe(1);
    expect(results[1].lineNumber).toBe(2);
    expect(results[1].error).toBeDefined();
    expect(results[2].lineNumber).toBe(4);
  });
});
