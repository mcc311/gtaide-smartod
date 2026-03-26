"""RAG module: hybrid search with BM25 + embedding (RRF fusion)."""

import json
import logging
from collections import defaultdict
from pathlib import Path

import os

import numpy as np
import jieba
from dotenv import load_dotenv
from openai import OpenAI
from rank_bm25 import BM25Okapi

load_dotenv()

logger = logging.getLogger(__name__)

_DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "gtaide_data"
DATA_PATHS = [
    _DATA_DIR / "datasets_from_NCHC" / "od_doc_v2.jsonl",
    _DATA_DIR / "gazette" / "gazette_docs.jsonl",
]

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
EMBED_MODEL = "qwen/qwen3-embedding-8b"

_openai = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

# In-memory indices
_documents: list[dict] = []
_corpus_tokens: list[list[str]] = []
_bm25: BM25Okapi | None = None
_embeddings: np.ndarray | None = None  # shape: (n_docs, dim)
_loaded = False
_embeddings_loaded = False


def _tokenize(text: str) -> list[str]:
    return list(jieba.cut(text))


def _get_embedding(text: str) -> np.ndarray:
    """Get embedding from OpenRouter."""
    resp = _openai.embeddings.create(model=EMBED_MODEL, input=text)
    return np.array(resp.data[0].embedding, dtype=np.float32)


def _get_embeddings_batch(texts: list[str], batch_size: int = 256) -> np.ndarray:
    """Get embeddings in batches via OpenRouter."""
    all_embs = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        resp = _openai.embeddings.create(model=EMBED_MODEL, input=batch)
        for item in resp.data:
            all_embs.append(item.embedding)
        done = min(i + batch_size, len(texts))
        if done % 1024 == 0 or done == len(texts):
            logger.info(f"  Embedded {done}/{len(texts)} documents")
    return np.array(all_embs, dtype=np.float32)


def _search_text(doc: dict) -> str:
    """Build searchable text for a document (capped for indexing)."""
    return " ".join([
        doc.get("type", ""),
        doc.get("organ", ""),
        doc.get("text", "")[:500],
    ])


def load_index():
    """Load documents from all data sources and build BM25 index."""
    global _documents, _corpus_tokens, _bm25, _loaded

    if _loaded:
        return

    docs = []
    for data_path in DATA_PATHS:
        if not data_path.exists():
            logger.warning(f"Data not found at {data_path}, skipping")
            continue

        logger.info(f"Loading documents from {data_path}...")
        count = 0
        with open(data_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    doc = json.loads(line)
                    text = doc.get("text", "")
                    if len(text) > 20:
                        docs.append(doc)
                        count += 1
                except json.JSONDecodeError:
                    continue
        logger.info(f"  Loaded {count} documents from {data_path.name}")

    _documents = docs
    logger.info(f"Loaded {len(_documents)} documents, building BM25 index...")

    _corpus_tokens = [_tokenize(_search_text(doc)) for doc in _documents]
    _bm25 = BM25Okapi(_corpus_tokens)
    _loaded = True
    logger.info("BM25 index built successfully")


def load_embeddings():
    """Build embedding index. Separate from BM25 since it takes longer."""
    global _embeddings, _embeddings_loaded

    if _embeddings_loaded:
        return

    if not _loaded:
        load_index()

    if not _documents:
        _embeddings_loaded = True
        return

    cache_path = _DATA_DIR / "embeddings_cache.npy"

    if cache_path.exists():
        logger.info(f"Loading cached embeddings from {cache_path}")
        _embeddings = np.load(cache_path)
        if len(_embeddings) == len(_documents):
            _embeddings_loaded = True
            logger.info(f"Loaded {len(_embeddings)} cached embeddings")
            return
        else:
            logger.warning("Cache size mismatch, rebuilding...")

    logger.info(f"Building embedding index for {len(_documents)} documents (this may take a while)...")
    texts = [_search_text(doc) for doc in _documents]
    _embeddings = _get_embeddings_batch(texts)
    _embeddings_loaded = True

    # Cache to disk
    np.save(cache_path, _embeddings)
    logger.info(f"Embedding index built and cached ({_embeddings.shape})")


def _bm25_search(query: str, top_k: int = 50) -> list[tuple[int, float]]:
    """BM25 search, returns list of (doc_index, score)."""
    if _bm25 is None:
        return []
    query_tokens = _tokenize(query)
    scores = _bm25.get_scores(query_tokens)
    top_indices = np.argsort(scores)[::-1][:top_k]
    return [(int(i), float(scores[i])) for i in top_indices if scores[i] > 0]


def _embedding_search(query: str, top_k: int = 50) -> list[tuple[int, float]]:
    """Embedding cosine similarity search, returns list of (doc_index, score)."""
    if _embeddings is None or len(_embeddings) == 0:
        return []
    q_emb = _get_embedding(query)
    # Cosine similarity
    norms = np.linalg.norm(_embeddings, axis=1) * np.linalg.norm(q_emb)
    norms = np.where(norms == 0, 1, norms)
    sims = np.dot(_embeddings, q_emb) / norms
    top_indices = np.argsort(sims)[::-1][:top_k]
    return [(int(i), float(sims[i])) for i in top_indices]


def _rrf_fusion(
    rankings: list[list[int]],
    k: int = 60,
    top_n: int = 10,
) -> list[int]:
    """Reciprocal Rank Fusion. Returns sorted doc indices."""
    scores: dict[int, float] = defaultdict(float)
    for ranked_list in rankings:
        for rank, doc_idx in enumerate(ranked_list, start=1):
            scores[doc_idx] += 1.0 / (k + rank)
    sorted_indices = sorted(scores, key=scores.get, reverse=True)
    return sorted_indices[:top_n]


def retrieve(query: str, doc_type: str = "", top_k: int = 5) -> list[dict]:
    """Hybrid retrieve: BM25 + embedding with RRF fusion.

    If doc_type is specified, results are filtered to only include that type.
    Falls back to BM25-only if embeddings aren't loaded yet.
    """
    if not _loaded:
        load_index()

    if not _documents:
        return []

    # Build type filter index if needed
    if doc_type:
        allowed_indices = {i for i, d in enumerate(_documents) if d.get("type", "") == doc_type}
    else:
        allowed_indices = None

    # BM25 ranking
    bm25_results = _bm25_search(query, top_k=200)
    bm25_ranked = [idx for idx, _ in bm25_results
                   if allowed_indices is None or idx in allowed_indices]

    # Embedding ranking (if available)
    if _embeddings_loaded and _embeddings is not None:
        emb_results = _embedding_search(query, top_k=200)
        emb_ranked = [idx for idx, _ in emb_results
                      if allowed_indices is None or idx in allowed_indices]

        # RRF fusion
        fused = _rrf_fusion([bm25_ranked[:50], emb_ranked[:50]], k=60, top_n=top_k)
    else:
        # Fallback to BM25 only
        fused = bm25_ranked[:top_k]

    results = []
    for idx in fused:
        if idx >= len(_documents):
            continue
        doc = _documents[idx]
        results.append({
            "type": doc.get("type", ""),
            "organ": doc.get("organ", ""),
            "text": doc.get("text", ""),
            "header": doc.get("header", ""),
            "footer": doc.get("footer", ""),
        })

    return results


def format_examples(docs: list[dict], max_chars: int = 2000) -> list[str]:
    """Format retrieved docs as text examples for LLM context."""
    examples = []
    for doc in docs:
        text = doc.get("text", "")
        if len(text) > max_chars:
            text = text[:max_chars] + "..."
        organ = doc.get("organ", "")
        doc_type = doc.get("type", "")
        header = f"[{organ}　{doc_type}]\n" if organ else ""
        examples.append(f"{header}{text}")
    return examples
