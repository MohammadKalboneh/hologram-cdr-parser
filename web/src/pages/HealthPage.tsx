    import { useEffect, useState } from "react";

type Health = { ok: boolean; service?: string };

export default function HealthPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/health`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setErr("API not reachable"));
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ marginTop: 0 }}>Health</h1>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {health ? <pre>{JSON.stringify(health, null, 2)}</pre> : !err ? <p>Checking…</p> : null}
    </div>
  );
}
