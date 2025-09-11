#!/usr/bin/env python3
import sys, json
from pathlib import Path
from sentence_transformers import SentenceTransformer

MODEL = SentenceTransformer("all-MiniLM-L6-v2")

def read_files(root):
    p = Path(root)
    if p.is_file():
        return [(p.name, p.read_text(errors='ignore'))]
    items = []
    for f in p.rglob('*'):
        if f.is_file():
            try: items.append((str(f.relative_to(p)), f.read_text(errors='ignore')))
            except: items.append((str(f.relative_to(p)), ""))
    return items

def chunk_text(text, max_words=600, overlap=100):
    words = text.split()
    if len(words) <= max_words: return [text]
    chunks, i = [], 0
    while i < len(words):
        chunks.append(" ".join(words[i:i+max_words]))
        i += max_words - overlap
    return chunks

def main():
    if len(sys.argv) < 3:
        print("usage: embed_all_files.py <root> <out.json>"); sys.exit(1)
    root, out = sys.argv[1:3]
    repo = sys.argv[3] if len(sys.argv) > 3 else "repo"
    entries = []
    for fname, txt in read_files(root):
        for i, ch in enumerate(chunk_text(txt or "")):
            entries.append({
                "id": f"{repo}::{fname}::chunk{i}",
                "text": ch,
                "meta": {"repo": repo, "path": fname, "chunk": i}
            })
    texts = [e["text"] for e in entries]
    embs = MODEL.encode(texts, convert_to_numpy=True)
    for i, e in enumerate(entries): e["embedding"] = embs[i].tolist()
    with open(out, "w") as fh: json.dump(entries, fh)
    print(f"Wrote {len(entries)} entries")
if __name__ == "__main__": main()
