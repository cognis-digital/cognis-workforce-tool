import express from "express";
import { spawn } from "child_process";
import { QdrantClient } from "@qdrant/js-client-rest";

const app = express();
const port = 3001;
app.use(express.json());
const client = new QdrantClient({ url: "http://localhost:6333" });

async function getEmbedding(text: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const py = spawn("python3", ["../python/embed.py"]);
    let data = "", error = "";
    py.stdin.write(text); py.stdin.end();
    py.stdout.on("data", (c) => data += c.toString());
    py.stderr.on("data", (c) => error += c.toString());
    py.on("close", (code) => {
      if (code !== 0 || error) reject(new Error(error || `Python exited with code ${code}`));
      else resolve(JSON.parse(data).embedding);
    });
  });
}

app.post("/ingest", async (req, res) => {
  try {
    const embedding = await getEmbedding(req.body.text);
    await client.upsert("repo_embeddings", { points: [{ id: Date.now(), vector: embedding, payload: { text: req.body.text } }]});
    res.json({ status: "ok" });
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

app.post("/query", async (req, res) => {
  try {
    const embedding = await getEmbedding(req.body.text);
    const results = await client.search("repo_embeddings", { vector: embedding, limit: 5 });
    res.json(results);
  } catch (err) { res.status(500).json({ error: (err as Error).message }); }
});

app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));
