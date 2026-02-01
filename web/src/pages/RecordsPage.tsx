import { useEffect, useState } from "react";

type DbRecord = {
  id: number;
  mnc: number | null;
  bytesUsed: number;
  dmcc: string | null;
  cellid: number | string | null;
  ip: string | null;
  createdAt: string;
};

export default function RecordsPage() {
  const [rows, setRows] = useState<DbRecord[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/records`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as DbRecord[];
      })
      .then(setRows)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load records"));
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ marginTop: 0 }}>Records</h1>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <div style={{ overflowX: "auto" }}>
        <table cellPadding={8} style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th>ID</th>
              <th>MNC</th>
              <th>Bytes</th>
              <th>DMCC</th>
              <th>Cell ID</th>
              <th>IP</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                <td>{r.id}</td>
                <td>{r.mnc ?? "-"}</td>
                <td>{r.bytesUsed}</td>
                <td>{r.dmcc ?? "-"}</td>
                <td>{r.cellid ?? "-"}</td>
                <td>{r.ip ?? "-"}</td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && !err && <p style={{ marginTop: 12 }}>No records yet.</p>}
      </div>
    </div>
  );
}
