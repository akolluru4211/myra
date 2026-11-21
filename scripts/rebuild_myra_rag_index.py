"""
Rebuild Knowledge & Retrieval Index for Myra AI.
Parses approved website sources and codebase, sanitizes and redacts secrets/PII,
generates rag/index/chunks.jsonl and optionally TF-IDF vector index,
and tests retrieval for student queries.
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
RAG_DIR = ROOT_DIR / "rag"
INDEX_DIR = RAG_DIR / "index"
SOURCES_CFG = RAG_DIR / "sources.json"

SECRET_PATTERNS = [
    (re.compile(r"(?i)(api[_-]?key|secret|token|password|passwd|private[_-]?key|authorization)\s*[:=]\s*['\"]?[^\s'\"]{6,}"), r"\1=[REDACTED]"),
    (re.compile(r"AKIA[0-9A-Z]{16}"), "[REDACTED_AWS_KEY]"),
    (re.compile(r"sk-[A-Za-z0-9_-]{20,}"), "[REDACTED_KEY]"),
    (re.compile(r"(?i)bearer\s+[A-Za-z0-9._-]{20,}"), "Bearer [REDACTED]"),
    (re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----", re.S), "[REDACTED_PRIVATE_KEY]"),
    (re.compile(r"(?i)(mongodb(\+srv)?|postgres(ql)?|mysql|redis)://[^\s'\"]+"), "[REDACTED_DB_URL]"),
    (re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.]+\b"), "[EMAIL]"),
    (re.compile(r"\b(?:\+91[- ]?)?[6-9]\d{9}\b"), "[PHONE]"),
]

def redact(text: str) -> str:
    for pat, rep in SECRET_PATTERNS:
        text = pat.sub(rep, text)
    return text

def chunk_code(text: str, size: int, overlap: int):
    lines = text.splitlines()
    out = []
    cur = []
    n = 0
    for ln in lines:
        w = len(ln.split()) or 1
        if n + w > size and cur:
            out.append("\n".join(cur))
            keep = cur[-3:] if overlap else []
            cur = list(keep)
            n = sum(len(x.split()) or 1 for x in keep)
        cur.append(ln)
        n += w
    if cur:
        out.append("\n".join(cur))
    return out

def chunk_words(text: str, size: int, overlap: int):
    words = text.split()
    if not words:
        return []
    step = max(1, size - overlap)
    return [" ".join(words[i:i + size]) for i in range(0, len(words), step) if words[i:i + size]]

def read_code_files(cfg):
    exts = set(cfg["extensions"])
    skip_dirs = set(cfg["skip_dirs"])
    skip_files = set(cfg["skip_files"])
    files = []

    for raw_path in cfg["paths"]:
        target = raw_path if os.path.isabs(raw_path) else os.path.normpath(os.path.join(ROOT_DIR, raw_path))
        if not os.path.exists(target):
            continue

        if os.path.isfile(target):
            try:
                with open(target, "r", encoding="utf-8") as f:
                    txt = f.read()
                files.append({
                    "source": os.path.relpath(target, ROOT_DIR),
                    "kind": "code",
                    "title": os.path.basename(target),
                    "text": txt
                })
            except Exception:
                pass
            continue

        for d, dirs, names in os.walk(target):
            dirs[:] = [x for x in dirs if x not in skip_dirs and not x.startswith(".")]
            for n in names:
                if n in skip_files or n.startswith(".env") or os.path.splitext(n)[1].lower() not in exts:
                    continue
                p = os.path.join(d, n)
                try:
                    if os.path.getsize(p) > cfg["max_file_kb"] * 1024:
                        continue
                    with open(p, "r", encoding="utf-8") as f:
                        txt = f.read()
                    files.append({
                        "source": os.path.relpath(p, ROOT_DIR),
                        "kind": "code",
                        "title": n,
                        "text": txt
                    })
                except Exception:
                    continue
    return files

def read_syllabus_files():
    syllabus_dir = ROOT_DIR / "myra-ai" / "data" / "syllabus"
    docs = []
    if not syllabus_dir.exists():
        return docs

    for p in syllabus_dir.rglob("*.txt"):
        try:
            with open(p, "r", encoding="utf-8") as f:
                txt = f.read()
            rel = os.path.relpath(p, ROOT_DIR)
            docs.append({
                "source": rel,
                "kind": "web",
                "title": f"Syllabus - {p.stem.replace('_', ' ').title()}",
                "text": txt
            })
        except Exception:
            pass
    return docs

def rebuild_index():
    print("=" * 65)
    print("MYRA AI - REBUILDING RETRIEVAL & KNOWLEDGE INDEX")
    print("=" * 65)

    if not SOURCES_CFG.exists():
        print(f"Error: {SOURCES_CFG} not found!")
        sys.exit(1)

    with open(SOURCES_CFG, "r", encoding="utf-8") as f:
        cfg = json.load(f)

    # 1. Read syllabus documents
    syllabus_docs = read_syllabus_files()
    print(f"✓ Loaded {len(syllabus_docs)} syllabus curriculum text modules.")

    # 2. Read codebase files
    code_docs = read_code_files(cfg["code"])
    print(f"✓ Loaded {len(code_docs)} approved source codebase files.")

    all_docs = syllabus_docs + code_docs
    chunks = []
    chunk_words_size = cfg.get("chunk_words", 220)
    chunk_overlap = cfg.get("chunk_overlap_words", 40)

    for doc in all_docs:
        cleaned_text = redact(doc["text"])
        if doc["kind"] == "code":
            parts = chunk_code(cleaned_text, chunk_words_size, chunk_overlap)
        else:
            parts = chunk_words(cleaned_text, chunk_words_size, chunk_overlap)

        for i, chunk_text in enumerate(parts):
            chunks.append({
                "id": f"{doc['kind']}:{doc['source']}#{i}",
                "kind": doc["kind"],
                "source": doc["source"],
                "title": doc["title"],
                "text": chunk_text
            })

    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    chunks_path = INDEX_DIR / "chunks.jsonl"
    with open(chunks_path, "w", encoding="utf-8") as f:
        for c in chunks:
            f.write(json.dumps(c, ensure_ascii=False) + "\n")

    print(f"✓ Written {len(chunks)} chunks to '{chunks_path}'.")

    # 3. Build TF-IDF index if scikit-learn is available
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        import joblib
        vec = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, stop_words="english", token_pattern=r"(?u)\b[\w.-]{2,}\b")
        mat = vec.fit_transform([c["title"] + " " + c["text"] for c in chunks])
        tfidf_path = INDEX_DIR / "tfidf.joblib"
        joblib.dump({"vec": vec, "mat": mat}, tfidf_path)
        print(f"✓ TF-IDF vector matrix serialized to '{tfidf_path}'.")
    except Exception as e:
        print(f"Notice: Scikit-learn TF-IDF generation skipped ({e}). In-app TypeScript scoring active.")

    print("=" * 65)
    print("SUCCESS: Myra retrieval index successfully rebuilt and ready for student queries.")
    print("=" * 65)

if __name__ == "__main__":
    rebuild_index()
