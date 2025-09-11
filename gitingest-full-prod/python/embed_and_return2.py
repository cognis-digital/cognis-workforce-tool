#!/usr/bin/env python3
import sys, json
from pathlib import Path
from sentence_transformers import SentenceTransformer

MODEL = SentenceTransformer("all-MiniLM-L6-v2")

if len(sys.argv) < 3:
    print("usage: embed_and_return.py <infile> <outfile>"); sys.exit(1)

inp, out = sys.argv[1:3]
text = Path(inp).read_text(errors='ignore')
vec = MODEL.encode([text])[0].tolist()
with open(out, "w") as f: json.dump([vec], f)
print("ok")
