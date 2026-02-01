import express from "express";
import cors from "cors";
import "dotenv/config";
import { uploadErrorHandler, uploadHandler, uploadMiddleware } from "./routes/upload";
import { getRecordsHandler, createRecordHandler } from "./routes/records";
import swaggerUi from "swagger-ui-express";
import { openapi } from "./openapi";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/records", getRecordsHandler);
app.post("/records", createRecordHandler);
app.post("/upload", uploadMiddleware, uploadHandler);
app.use(uploadErrorHandler);

app.get("/openapi.json", (_req, res) => {
  res.json(openapi);
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
