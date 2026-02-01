import express from "express";
import cors from "cors";
import "dotenv/config";
import { prisma } from "./db";
import { toJsonSafe } from "./serialize";
import { uploadHandler, uploadMiddleware } from "./routes/upload";


const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/records", async (_req, res) => {
  const rows = await prisma.usageRecord.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  res.json(toJsonSafe(rows));
});

app.post("/records", async (req, res) => {
  const { id, mnc, bytes_used, dmcc, cellid, ip } = req.body ?? {};

  if (typeof id !== "number" || typeof bytes_used !== "number") {
    return res.status(400).json({
      message: "id and bytes_used are required and must be numbers",
    });
  }

  const created = await prisma.usageRecord.create({
    data: {
      id,
      mnc: typeof mnc === "number" ? mnc : null,
      bytesUsed: bytes_used,
      dmcc: typeof dmcc === "string" ? dmcc : null,
      cellid: typeof cellid === "number" ? BigInt(cellid) : null,
      ip: typeof ip === "string" ? ip : null,
    },
  });

  // BigInt doesn't JSON-serialize by default, so normalize for now:
  res.status(201).json({
    ...created,
    cellid: created.cellid?.toString() ?? null,
  });
});

app.post("/upload", uploadMiddleware, uploadHandler);

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
