import { useState } from "react";
import { uploadCdrFile, type UploadResponse } from "../api";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onUpload() {
    if (!selectedFile) return;

    setLoading(true);
    setErr(null);
    setResult(null);

    try {
      const res = await uploadCdrFile(selectedFile);
      setResult(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ marginTop: 0 }}>Upload CDR File</h1>
      <p style={{ color: "#64748b", marginTop: -8 }}>
        Upload CDR files up to 100MB. Files are processed using streaming for memory efficiency.
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="file"
          accept=".txt"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
        />
        <button onClick={onUpload} disabled={!selectedFile || loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>
        {selectedFile && (
          <span style={{ color: "#64748b", fontSize: 14 }}>
            {(selectedFile.size / 1024).toFixed(1)} KB
          </span>
        )}
      </div>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {result && (
        <>
          <div style={{ marginTop: 16, padding: 16, background: "#f1f5f9", borderRadius: 8 }}>
            <strong>Upload Summary:</strong>
            <ul style={{ marginTop: 8, marginBottom: 0 }}>
              <li>Total Lines: {result.meta.totalLines}</li>
              <li>Parsed Records: {result.meta.parsedRecords}</li>
              <li>Inserted Records: {result.meta.insertedRecords}</li>
              <li style={{ color: result.meta.errorCount > 0 ? "#dc2626" : "#16a34a" }}>
                Errors: {result.meta.errorCount}
              </li>
            </ul>
          </div>

          {result.records && result.records.length > 0 && (
            <>
              <h2 style={{ marginTop: 20 }}>Records Preview</h2>
              <div style={{ overflowX: "auto" }}>
                <table cellPadding={8} style={{ borderCollapse: "collapse", width: "100%" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                      <th>ID</th>
                      <th>MNC</th>
                      <th>Bytes Used</th>
                      <th>DMCC</th>
                      <th>Cell ID</th>
                      <th>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.records.map((r) => (
                      <tr key={r.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                        <td>{r.id}</td>
                        <td>{r.mnc ?? "-"}</td>
                        <td>{r.bytes_used}</td>
                        <td>{r.dmcc ?? "-"}</td>
                        <td>{r.cellid ?? "-"}</td>
                        <td>{r.ip ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {result.errors && result.errors.length > 0 && (
            <>
              <h2 style={{ marginTop: 20, color: "#dc2626" }}>Parse Errors</h2>
              <ul style={{ color: "#991b1b" }}>
                {result.errors.map((e, idx) => (
                  <li key={idx}>
                    Line {e.lineNumber}: {e.message} — <code style={{ background: "#fef2f2", padding: "2px 4px", borderRadius: 4 }}>{e.line}</code>
                  </li>
                ))}
              </ul>
            </>
          )}

          {result.meta.insertedRecords > 0 && (
            <div style={{ marginTop: 20, padding: 12, background: "#f0fdf4", borderRadius: 8, color: "#166534" }}>
              ✓ Successfully inserted {result.meta.insertedRecords} records into the database.{" "}
              <a href="/records" style={{ color: "#16a34a", textDecoration: "underline" }}>
                View all records
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
