"""Build embedding cache for NCHC documents via OpenRouter. Run standalone with progress bar."""

import json
import os
import time
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(Path(__file__).resolve().parent / "backend" / ".env")

_BASE = Path(__file__).resolve().parent
DATA_PATH = _BASE / "gtaide_data" / "datasets_from_NCHC" / "od_doc_v2.jsonl"
CACHE_PATH = _BASE / "gtaide_data" / "datasets_from_NCHC" / "embeddings_cache.npy"
EMBED_MODEL = "qwen/qwen3-embedding-8b"
BATCH_SIZE = 128

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY", ""),
)


def load_docs():
    docs = []
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                doc = json.loads(line)
                if len(doc.get("text", "")) > 20:
                    docs.append(doc)
            except json.JSONDecodeError:
                continue
    return docs


def search_text(doc: dict) -> str:
    return " ".join([
        doc.get("type", ""),
        doc.get("organ", ""),
        doc.get("text", "")[:500],
    ])


def main():
    print(f"Loading documents from {DATA_PATH}...")
    docs = load_docs()
    total = len(docs)
    print(f"Loaded {total} documents")
    print(f"Model: {EMBED_MODEL} via OpenRouter")
    print(f"Batch size: {BATCH_SIZE}")
    print()

    texts = [search_text(doc) for doc in docs]

    all_embeddings = []
    start = time.time()

    for i in range(0, total, BATCH_SIZE):
        batch = texts[i:i + BATCH_SIZE]
        resp = client.embeddings.create(model=EMBED_MODEL, input=batch)
        for item in resp.data:
            all_embeddings.append(item.embedding)

        done = min(i + BATCH_SIZE, total)
        elapsed = time.time() - start
        speed = done / elapsed
        eta = (total - done) / speed if speed > 0 else 0

        print(
            f"  [{done}/{total}] "
            f"{done*100/total:.1f}% "
            f"{speed:.1f} docs/s "
            f"ETA {int(eta//60)}m{int(eta%60):02d}s",
            flush=True,
        )

    print()
    elapsed = time.time() - start
    print(f"Done in {elapsed/60:.1f} minutes ({total/elapsed:.1f} docs/s)")

    embeddings = np.array(all_embeddings, dtype=np.float32)
    print(f"Shape: {embeddings.shape}")

    np.save(CACHE_PATH, embeddings)
    print(f"Saved to {CACHE_PATH} ({CACHE_PATH.stat().st_size / 1e9:.2f} GB)")


if __name__ == "__main__":
    main()
