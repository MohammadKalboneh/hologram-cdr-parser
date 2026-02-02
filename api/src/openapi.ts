export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "Hologram CDR Processor API",
    version: "1.0.0",
    description:
      "Upload CDR files, parse mixed record formats into a normalized usage schema, store valid records, and report per-line parse errors.",
  },
  servers: [{ url: "http://localhost:3001" }],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "API is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean" },
                    service: { type: "string" },
                  },
                },
                example: { ok: true, service: "api" },
              },
            },
          },
        },
      },
    },

    "/upload": {
      post: {
        summary: "Upload a CDR file and parse records (Memory-based)",
        description:
          "Accepts a text file containing one CDR record per line. Loads entire file into memory before processing. Returns parsed records and per-line parse errors. Valid records are inserted into the database (duplicates skipped). Max file size: 5MB. For larger files, use /upload/stream.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary", description: "CDR file (max 5MB)" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Parsed and stored results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    meta: {
                      type: "object",
                      properties: {
                        totalLines: { type: "integer" },
                        parsedRecords: { type: "integer" },
                        insertedRecords: { type: "integer" },
                        errorCount: { type: "integer" },
                      },
                    },
                    records: { type: "array", items: { $ref: "#/components/schemas/NormalizedUsageRecord" } },
                    errors: { type: "array", items: { $ref: "#/components/schemas/ParseError" } },
                  },
                },
              },
            },
          },
          "400": {
            description: "Missing file",
          },
          "413": {
            description: "File too large (max 5MB)",
          },
        },
      },
    },

    "/upload/stream": {
      post: {
        summary: "Upload a CDR file and parse records (Stream-based, Recommended)",
        description:
          "Accepts a text file containing one CDR record per line. Processes file line-by-line using streaming for memory efficiency. Ideal for large files. Returns metadata and parse errors. Valid records are inserted into the database in batches (duplicates skipped). Max file size: 100MB.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary", description: "CDR file (max 100MB)" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Parsed and stored results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    meta: {
                      type: "object",
                      properties: {
                        totalLines: { type: "integer", description: "Total number of lines processed" },
                        parsedRecords: { type: "integer", description: "Number of successfully parsed records" },
                        insertedRecords: { type: "integer", description: "Number of records inserted (duplicates skipped)" },
                        errorCount: { type: "integer", description: "Number of lines with parse errors" },
                      },
                    },
                    errors: { 
                      type: "array", 
                      items: { $ref: "#/components/schemas/ParseError" },
                      description: "Array of parse errors (omitted if empty)"
                    },
                  },
                },
                example: {
                  meta: {
                    totalLines: 1000,
                    parsedRecords: 995,
                    insertedRecords: 990,
                    errorCount: 5
                  },
                  errors: [
                    {
                      lineNumber: 10,
                      line: "invalid,data",
                      message: "basic: bytes_used must be an integer"
                    }
                  ]
                },
              },
            },
          },
          "400": {
            description: "Missing file field",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "500": {
            description: "Processing error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    error: { type: "string" }
                  }
                }
              }
            }
          },
        },
      },
    },

    "/records": {
      get: {
        summary: "List stored records",
        description:
          "Returns records stored in the database. (Currently returns the DB shape; you can optionally align it to the normalized schema later.)",
        responses: {
          "200": {
            description: "Array of records",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/DbUsageRecord" },
                },
              },
            },
          },
        },
      },
    },
  },

  components: {
    schemas: {
      NormalizedUsageRecord: {
        type: "object",
        required: ["id", "bytes_used", "mnc", "dmcc", "cellid", "ip"],
        properties: {
          id: { type: "integer" },
          mnc: { type: ["integer", "null"] },
          bytes_used: { type: "integer" },
          dmcc: { type: ["string", "null"] },
          cellid: { type: ["integer", "null"] },
          ip: { type: ["string", "null"] },
        },
        example: {
          id: 7294,
          mnc: 182,
          bytes_used: 293451,
          dmcc: null,
          cellid: 31194,
          ip: "192.168.0.1",
        },
      },

      ParseError: {
        type: "object",
        required: ["lineNumber", "line", "message"],
        properties: {
          lineNumber: { type: "integer", description: "1-based line number in the uploaded file" },
          line: { type: "string" },
          message: { type: "string" },
        },
      },

      DbUsageRecord: {
        type: "object",
        required: ["id", "bytesUsed", "createdAt"],
        properties: {
          id: { type: "integer" },
          mnc: { type: ["integer", "null"] },
          bytesUsed: { type: "integer" },
          dmcc: { type: ["string", "null"] },
          cellid: {
            description:
              "Stored as BIGINT in DB. API may return number when safe, or string for very large values.",
            oneOf: [{ type: "integer" }, { type: "string" }, { type: "null" }],
          },
          ip: { type: ["string", "null"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
} as const;
