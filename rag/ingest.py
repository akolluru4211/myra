"""Build Myra's knowledge index from (1) your public website pages and (2) your website code repo.

    python rag/ingest.py                 # uses rag/sources.json
    python rag/ingest.py --only code     # or --only web

Output: rag/index/chunks.jsonl and rag/index/tfidf.joblib (searchable index).
Re-run whenever the website or code changes.

What this does NOT read: your users' personal browsing history, logins, cookies or private chats.
Only pages anyone can open, and files in the repo you point it at.
"""
import argparse, json, os, re, time, urllib.parse, urllib.robotparser
from collections import deque

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(HERE)
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

def redact(text):
    for pat, rep in SECRET_PATTERNS:
        text = pat.sub(rep, text)
    return text

def chunk_words(text, size, overlap):
    words = text.split()
    if not words:
        return []
    step = max(1, size - overlap)
    return [" ".join(words[i:i + size]) for i in range(0, len(words), step) if words[i:i + size]]

def chunk_code(text, size, overlap):
    """Keep line structure for code; chunk by lines (about `size` words each)."""
    lines, out, cur, n = text.splitlines(), [], [], 0
    for ln in lines:
        w = len(ln.split()) or 1
        if n + w > size and cur:
            out.append("\n".join(cur))
            keep = cur[-3:] if overlap else []
            cur, n = list(keep), sum(len(x.split()) or 1 for x in keep)
        cur.append(ln); n += w
    if cur:
        out.append("\n".join(cur))
    return out

def crawl(cfg, log):
    import requests
    from bs4 import BeautifulSoup
    allowed = set(cfg["allowed_domains"])
    q = deque(cfg["start_urls"]); seen = set(); pages = []
    robots = {}
    def ok_robots(url):
        if not cfg.get("respect_robots_txt", True):
            return True
        p = urllib.parse.urlparse(url); base = f"{p.scheme}://{p.netloc}"
        if base not in robots:
            rp = urllib.robotparser.RobotFileParser(); rp.set_url(base + "/robots.txt")
            try: rp.read()
            except Exception: rp = None
            robots[base] = rp
        return robots[base].can_fetch("MyraBot", url) if robots[base] else True
    sess = requests.Session(); sess.headers["User-Agent"] = "MyraBot/1.0 (EdWorld Co knowledge indexer)"
    while q and len(pages) < cfg["max_pages"]:
        url = q.popleft().split("#")[0]
        if url in seen: continue
        seen.add(url)
        parsed = urllib.parse.urlparse(url)
        host = parsed.hostname or parsed.netloc
        if (host not in allowed and parsed.netloc not in allowed) or any(s in url for s in cfg.get("skip_url_contains", [])) or not ok_robots(url):
            continue
        try:
            r = sess.get(url, timeout=15)
        except Exception as e:
            log(f"  skip {url}: {e}"); continue
        if r.status_code != 200 or "text/html" not in r.headers.get("content-type", ""):
            continue
        soup = BeautifulSoup(r.text, "html.parser")
        for t in soup(["script", "style", "nav", "footer", "noscript", "form", "svg"]):
            t.decompose()
        title = (soup.title.string or "").strip() if soup.title else url
        text = re.sub(r"\s+", " ", soup.get_text(" ", strip=True))
        if len(text.split()) >= 15:
            pages.append({"source": url, "kind": "web", "title": title, "text": text})
            log(f"  page {len(pages)}: {url}")
        for a in soup.find_all("a", href=True):
            nxt = urllib.parse.urljoin(url, a["href"]).split("#")[0]
            if nxt.startswith("http") and nxt not in seen:
                q.append(nxt)
        time.sleep(cfg.get("delay_seconds", 0.1))
    return pages

def read_code(cfg, log):
    exts, skip_dirs, skip_files = set(cfg["extensions"]), set(cfg["skip_dirs"]), set(cfg["skip_files"])
    files = []
    for raw_path in cfg["paths"]:
        target = raw_path if os.path.isabs(raw_path) else os.path.normpath(os.path.join(REPO_ROOT, raw_path))
        if not os.path.exists(target):
            target = os.path.normpath(os.path.join(HERE, raw_path))
        if not os.path.exists(target):
            log(f"  code path not found: {raw_path}")
            continue

        if os.path.isfile(target):
            try:
                txt = open(target, encoding="utf-8").read()
                files.append({"source": os.path.relpath(target, REPO_ROOT), "kind": "code", "title": os.path.basename(target), "text": txt})
            except Exception as e:
                log(f"  failed reading {target}: {e}")
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
                    txt = open(p, encoding="utf-8").read()
                    files.append({"source": os.path.relpath(p, REPO_ROOT), "kind": "code", "title": n, "text": txt})
                except Exception:
                    continue
    log(f"  code files: {len(files)}")
    return files

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default=os.path.join(HERE, "sources.json"))
    ap.add_argument("--only", choices=["web", "code"])
    ap.add_argument("--out", default=os.path.join(HERE, "index"))
    a = ap.parse_args()
    cfg = json.load(open(a.config, encoding="utf-8"))
    log = print
    docs = []
    if a.only in (None, "web"):
        log("Crawling website..."); docs += crawl(cfg["web"], log)
    if a.only in (None, "code"):
        log("Reading code..."); docs += read_code(cfg["code"], log)
    chunks = []
    for d in docs:
        text = redact(d["text"])
        parts = (chunk_code if d["kind"] == "code" else chunk_words)(text, cfg["chunk_words"], cfg["chunk_overlap_words"])
        for i, c in enumerate(parts):
            chunks.append({"id": f"{d['kind']}:{d['source']}#{i}", "kind": d["kind"], "source": d["source"], "title": d["title"], "text": c})
    if not chunks:
        raise SystemExit("Nothing to index. Check rag/sources.json (URLs, domains, code paths).")
    os.makedirs(a.out, exist_ok=True)
    with open(os.path.join(a.out, "chunks.jsonl"), "w", encoding="utf-8") as f:
        for c in chunks: f.write(json.dumps(c, ensure_ascii=False) + "\n")
    from sklearn.feature_extraction.text import TfidfVectorizer
    import joblib
    vec = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, stop_words="english", token_pattern=r"(?u)\b[\w.-]{2,}\b")
    mat = vec.fit_transform([c["title"] + " " + c["text"] for c in chunks])
    joblib.dump({"vec": vec, "mat": mat}, os.path.join(a.out, "tfidf.joblib"))
    n_web = sum(c["kind"] == "web" for c in chunks)
    log(f"Indexed {len(chunks)} chunks ({n_web} web, {len(chunks) - n_web} code) -> {a.out}")

if __name__ == "__main__":
    main()
