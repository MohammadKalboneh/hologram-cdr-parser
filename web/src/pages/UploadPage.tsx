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
      <h1 style={{ marginTop: 0 }}>Upload</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="file"
          accept=".txt"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
        />
        <button onClick={onUpload} disabled={!selectedFile || loading}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {result && (
        <>
          <div style={{ marginTop: 16 }}>
            <strong>Summary:</strong>{" "}
            totalLines={result.meta.totalLines}, parsed={result.meta.parsedRecords}, inserted=
            {result.meta.insertedRecords}, errors={result.meta.errorCount}
          </div>

          <h2 style={{ marginTop: 20 }}>Records</h2>
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

          {result.errors.length > 0 && (
            <>
              <h2 style={{ marginTop: 20 }}>Errors</h2>
              <ul>
                {result.errors.map((e, idx) => (
                  <li key={idx}>
                    Line {e.lineNumber}: {e.message} — <code>{e.line}</code>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
