export type NormalizedUsageRecord = {
  id: number;
  mnc: number | null;
  bytes_used: number;
  dmcc: string | null;
  cellid: number | null;
  ip: string | null;
};

export type ParseError = {
  lineNumber: number;
  line: string;
  message: string;
};

export type UploadResponse = {
  meta: {
    totalLines: number;
    parsedRecords: number;
    insertedRecords: number;
    errorCount: number;
  };
  records?: NormalizedUsageRecord[]; // Optional - stream endpoint doesn't return records
  errors?: ParseError[]; // Optional - only present if there are errors
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3001";

/**
 * Upload a CDR file using the streaming endpoint for better performance and memory efficiency.
 * Supports files up to 100MB (vs 5MB for the legacy /upload endpoint).
 */
export async function uploadCdrFile(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE_URL}/upload/stream`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: HTTP ${res.status} - ${text}`);
  }

  return (await res.json()) as UploadResponse;
}
