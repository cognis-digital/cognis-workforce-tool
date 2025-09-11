#!/bin/bash
set -e

REPO_NAME="gitingest-full-npx"
ZIP_NAME="${REPO_NAME}.zip"

echo ">>> Cleaning old repo..."
rm -rf $REPO_NAME $ZIP_NAME

echo ">>> Creating repo structure..."
mkdir -p $REPO_NAME/{backend,frontend,python,tests,.github/workflows}

# ------------------------------
# Backend (TypeScript, Node.js)
# ------------------------------
cat > $REPO_NAME/backend/server.ts <<'EOF'
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

    py.stdin.write(text);
    py.stdin.end();

    py.stdout.on("data", chunk => data += chunk.toString());
    py.stderr.on("data", chunk => error += chunk.toString());

    py.on("close", code => {
      if (code !== 0 || error) reject(new Error(error || `Python exited with code ${code}`));
      else resolve(JSON.parse(data).embedding);
    });
  });
}

app.post("/ingest", async (req, res) => {
  const { text } = req.body;
  try {
    const embedding = await getEmbedding(text);
    await client.upsert("repo_embeddings", {
      points: [{ id: Date.now(), vector: embedding, payload: { text } }]
    });
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/query", async (req, res) => {
  const { text } = req.body;
  try {
    const embedding = await getEmbedding(text);
    const results = await client.search("repo_embeddings", {
      vector: embedding,
      limit: 5
    });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));
EOF

cat > $REPO_NAME/backend/package.json <<'EOF'
{
  "name": "gitingest-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node server.ts",
    "npx-run-all": "node run_all.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "@qdrant/js-client-rest": "^1.7.0",
    "concurrently": "^8.2.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "ts-node": "^10.9.1",
    "@types/express": "^4.17.21"
  }
}
EOF

cat > $REPO_NAME/backend/tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true
  }
}
EOF

# ------------------------------
# NPX Wrapper
# ------------------------------
cat > $REPO_NAME/backend/run_all.js <<'EOF'
const concurrently = require("concurrently");
const path = require("path");

const pythonVenv = path.join(__dirname, "../python/.venv");

const commands = [
  // Python venv
  `bash -c "if [ ! -d '${pythonVenv}' ]; then python3 -m venv ../python/.venv && source ../python/.venv/bin/activate && pip install -r ../python/requirements.txt; fi"`,
  // Qdrant
  "docker-compose -f ../docker-compose.yml up -d",
  // Node backend
  "ts-node server.ts",
  // Streamlit frontend
  "streamlit run ../frontend/app.py"
];

concurrently(commands, { killOthers: ["failure", "success"], restartTries: 0 })
  .then(() => console.log("All services exited"))
  .catch(err => console.error("Error starting services", err));
EOF

# ------------------------------
# Python Embedding Helper
# ------------------------------
cat > $REPO_NAME/python/embed.py <<'EOF'
import sys, json
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

def embed(text: str):
    return model.encode(text).tolist()

if __name__ == "__main__":
    text = sys.stdin.read().strip()
    embedding = embed(text)
    print(json.dumps({"embedding": embedding}))
EOF

cat > $REPO_NAME/python/requirements.txt <<'EOF'
sentence-transformers==2.2.2
EOF

cat > $REPO_NAME/python/setup_venv.sh <<'EOF'
#!/bin/bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
echo "Python venv ready. Run: source .venv/bin/activate"
EOF
chmod +x $REPO_NAME/python/setup_venv.sh

# ------------------------------
# Streamlit UI
# ------------------------------
cat > $REPO_NAME/frontend/app.py <<'EOF'
import streamlit as st
import requests

st.title("Gitingest Full Prod NPX Wrapper")

query = st.text_input("Enter query text:")

if st.button("Search"):
    results = requests.post(
        "http://localhost:3001/query",
        json={"text": query}
    ).json()
    st.json(results)
EOF

# ------------------------------
# Docker Compose
# ------------------------------
cat > $REPO_NAME/docker-compose.yml <<'EOF'
version: "3.9"
services:
  qdrant:
    image: qdrant/qdrant:v1.12.0
    container_name: qdrant
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

volumes:
  qdrant_data:
EOF

# ------------------------------
# CI workflow
# ------------------------------
cat > $REPO_NAME/.github/workflows/ci.yml <<'EOF'
name: CI
on: [push, pull_request]
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install deps
        run: cd backend && npm install
      - name: Run tests
        run: cd backend && npm test
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.10"
      - name: Install Python deps
        run: |
          cd python
          python -m pip install -r requirements.txt
EOF

# ------------------------------
# Tests
# ------------------------------
cat > $REPO_NAME/tests/backend.test.ts <<'EOF'
describe("Backend API", () => {
  it("placeholder test", () => {
    expect(true).toBe(true);
  });
});
EOF

# ------------------------------
# Zip the repo
# ------------------------------
echo ">>> Creating ZIP..."
zip -r $ZIP_NAME $REPO_NAME > /dev/null
echo ">>> Done. Repo packaged as $ZIP_NAME"
echo ">>> Run 'cd $REPO_NAME/backend && npm install && npx run_all' to start everything."
