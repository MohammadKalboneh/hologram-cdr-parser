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
  records: NormalizedUsageRecord[];
  errors: ParseError[];
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:3001";

export async function uploadCdrFile(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: HTTP ${res.status} - ${text}`);
  }

  return (await res.json()) as UploadResponse;
}
