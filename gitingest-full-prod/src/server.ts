import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { QdrantClient } from "@qdrant/js-client-rest";
import fs from "fs";

const app = express();
app.use(bodyParser.json({ limit: "20mb" }));
app.use(cors());

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const client = new QdrantClient({ url: QDRANT_URL });

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.post("/query", async (req, res) => {
  const { query, top } = req.body;
  if (!query) return res.status(400).json({ error: "query required" });

  try {
    const tmpIn = "/tmp/gitingest_query.txt";
    const tmpOut = "/tmp/gitingest_query_vec.json";
    fs.writeFileSync(tmpIn, query, "utf-8");

    require("child_process").execSync(
      `python3 python/embed_and_return.py ${tmpIn} ${tmpOut}`,
      { stdio: "inherit" }
    );
    const vec = JSON.parse(fs.readFileSync(tmpOut, "utf-8"))[0];
    const result = await client.search("cross_repo_code", {
      vector: vec,
      limit: top || 5,
    });
    res.json({ hits: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

app.post("/ingest", async (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl) return res.status(400).json({ error: "repoUrl required" });

  try {
    require("child_process").execSync(
      `ts-node src/ingest.ts ${repoUrl}`,
      { stdio: "inherit" }
    );
    res.json({ status: "started" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
