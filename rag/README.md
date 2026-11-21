# Myra knowledge pipeline: learn from your website and code

This lets Myra answer from your real website pages and your website's code, without retraining. When the site or app changes, re-run one command and Myra knows.

## Setup (5 minutes)
1. `pip install -r rag/requirements.txt`
2. Edit `rag/sources.json`: your website URL and domain, and the path to your code repo.
3. `python rag/ingest.py` builds the index in `rag/index/`.
4. Try it: `python rag/ask_myra.py "How do I create a study plan?"` shows the sources found and the exact prompt Myra would get.
5. Connect a model: add `--llm anthropic` (needs `ANTHROPIC_API_KEY`) or `--llm ollama`, or call `answer()` from your own backend.

Re-run step 3 after every website or code change (a nightly scheduled job works well).

## What it reads
- **Website:** public pages on your own domain only. Skips login, account, cart and admin pages, follows robots.txt, waits between requests.
- **Code:** the repo you point at. Skips `.env`, lock files, `node_modules`, build folders and files over 200 KB.
- **Not included:** your users' personal browsing history, cookies, logins or private chats. Do not feed those in. They are personal data and would breach student privacy.

## Safety built in
- Secrets are masked before indexing: API keys, tokens, passwords, private keys, database URLs, emails and phone numbers.
- Myra is told to use code only to understand the app, and never show code, file names, keys or internal URLs to students.
- Page text is treated as information, not instructions (guards against prompt injection from web content).
- Because emails and phones are masked, put your real support contact in the prompt (`[SUPPORT CONTACT]`), not in the crawled pages.

## Limits
- Search is keyword-based (TF-IDF). It works well for button names and feature words. For better meaning-matching later, swap in embeddings (for example `sentence-transformers` with FAISS or Chroma).
- Tested here on a local sample site and sample repo only, not your real site. Check `rag/ask_myra.py` output on 20 real student questions before launch.
- Pages that need JavaScript to show their text are not captured by this simple crawler.
