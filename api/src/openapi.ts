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
        summary: "Upload a CDR file and parse records",
        description:
          "Accepts a text file containing one CDR record per line. Returns parsed records and per-line parse errors. Valid records are inserted into the database (duplicates skipped).",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary" },
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
