"""20 Real Student Question Evaluation Suite for Myra RAG Knowledge Retrieval.

Tests retrieval relevance across all core EdWorld features and verifies
that no confidential secrets (API keys, passwords, database URLs) leak into context.
"""
import os, sys, json

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

HERE = os.path.dirname(os.path.abspath(__file__))
RAG_DIR = os.path.dirname(HERE)
sys.path.insert(0, RAG_DIR)

from ask_myra import load_index, retrieve, build_messages

STUDENT_QUESTIONS = [
    {
        "id": 1,
        "question": "How do I create a study plan?",
        "expected_keywords": ["study", "plan", "timetable", "schedule", "hour"],
        "target_feature": "Personalized Timetable",
    },
    {
        "id": 2,
        "question": "How does the Focus Lock timer work?",
        "expected_keywords": ["focus", "lock", "session", "timer", "cooldown"],
        "target_feature": "Focus Lock Studio",
    },
    {
        "id": 3,
        "question": "Can I block YouTube during my study session?",
        "expected_keywords": ["block", "blacklist", "domain", "distraction", "focus"],
        "target_feature": "Distraction Blocker",
    },
    {
        "id": 4,
        "question": "How do I join an EdBuild project squad?",
        "expected_keywords": ["edbuild", "squad", "room", "key", "project"],
        "target_feature": "EdBuild Squads",
    },
    {
        "id": 5,
        "question": "How do I score my resume against a job description?",
        "expected_keywords": ["resume", "ats", "score", "match", "jd"],
        "target_feature": "ATS Resume Studio",
    },
    {
        "id": 6,
        "question": "How do I practice coding problems in the DSA arena?",
        "expected_keywords": ["dsa", "problem", "solve", "code", "run"],
        "target_feature": "Practice & DSA Arena",
    },
    {
        "id": 7,
        "question": "How do I start a mock interview?",
        "expected_keywords": ["interview", "mock", "simulator", "score", "rubric"],
        "target_feature": "AI Mock Interview Studio",
    },
    {
        "id": 8,
        "question": "How do I check if a job offer is a scam?",
        "expected_keywords": ["scam", "offer", "check", "flag", "risk"],
        "target_feature": "Placement Scam Checker",
    },
    {
        "id": 9,
        "question": "How do I view my daily study streak?",
        "expected_keywords": ["streak", "progress", "xp", "flame", "dashboard"],
        "target_feature": "Student Progress Widget",
    },
    {
        "id": 10,
        "question": "Where can I find formula cheat sheets?",
        "expected_keywords": ["learn", "course", "note", "formula", "blueprint"],
        "target_feature": "Interactive Courses & Blueprints",
    },
    {
        "id": 11,
        "question": "How do I change my target career role?",
        "expected_keywords": ["profile", "role", "target", "save", "settings"],
        "target_feature": "Profile & Settings",
    },
    {
        "id": 12,
        "question": "What should I do if my audio doesn't work during an interview?",
        "expected_keywords": ["mic", "audio", "permission", "browser", "interview"],
        "target_feature": "AI Mock Interview Studio",
    },
    {
        "id": 13,
        "question": "How do I share a private key for an EdBuild room?",
        "expected_keywords": ["key", "private", "squad", "room", "edbuild"],
        "target_feature": "EdBuild Workspaces",
    },
    {
        "id": 14,
        "question": "What are the stages in the 1-year career roadmap?",
        "expected_keywords": ["roadmap", "horizon", "year", "phase", "milestone"],
        "target_feature": "AI Career Roadmap",
    },
    {
        "id": 15,
        "question": "How do I contact student support if I have a payment issue?",
        "expected_keywords": ["support", "contact", "edworld"],
        "target_feature": "Support Contact",
    },
    {
        "id": 16,
        "question": "Can I export my resume as a PDF?",
        "expected_keywords": ["resume", "export", "pdf", "download"],
        "target_feature": "ATS Resume Studio",
    },
    {
        "id": 17,
        "question": "What is the Emergency Unlock in Focus Lock?",
        "expected_keywords": ["emergency", "unlock", "cooldown", "focus", "lock"],
        "target_feature": "Focus Lock Studio",
    },
    {
        "id": 18,
        "question": "How do I run code in the DSA problem arena?",
        "expected_keywords": ["code", "run", "test", "case", "dsa"],
        "target_feature": "Practice & DSA Arena",
    },
    {
        "id": 19,
        "question": "What red flags does the scam checker look for?",
        "expected_keywords": ["scam", "flag", "deposit", "fee", "risk"],
        "target_feature": "Placement Scam Checker",
    },
    {
        "id": 20,
        "question": "How do I earn XP on my student dashboard?",
        "expected_keywords": ["xp", "streak", "progress", "project", "dashboard"],
        "target_feature": "Student Progress Widget",
    },
]

def main():
    print("=" * 70)
    print("Myra RAG Retrieval Evaluation — 20 Student Questions Benchmark")
    print("=" * 70)

    try:
        index = load_index(os.path.join(RAG_DIR, "index"))
    except Exception as e:
        print(f"Error loading index: {e}")
        sys.exit(1)

    passed = 0
    total = len(STUDENT_QUESTIONS)

    for item in STUDENT_QUESTIONS:
        hits = retrieve(item["question"], index, k=6)
        if not hits:
            print(f"❌ [{item['id']:02d}] {item['question']} -> No hits returned")
            continue

        top_score, top_chunk = hits[0]
        context_blob = " ".join((c["title"] + " " + c["text"]).lower() for _, c in hits)

        # Keyword verification
        matched_kw = [kw for kw in item["expected_keywords"] if kw in context_blob]
        relevance_ok = len(matched_kw) >= 1

        # Secret leak verification
        leak = any(secret in context_blob for secret in ["postgres://", "mongodb://", "sk-proj-", "aws_secret"])

        if relevance_ok and not leak:
            passed += 1
            print(f"✔ [{item['id']:02d}] {item['question']}")
            print(f"     Target: {item['target_feature']} | Top hit: [{top_chunk['kind']}] {top_chunk['source']} (score: {top_score:.2f})")
            print(f"     Matched cues: {', '.join(matched_kw[:3])}")
        else:
            print(f"✖ [{item['id']:02d}] {item['question']}")
            print(f"     Target: {item['target_feature']} | Top hit: {top_chunk['source']} (score: {top_score:.2f})")
            if leak:
                print(f"     ALERT: Secret detected in context!")

    print("=" * 70)
    print(f"Evaluation Results: {passed}/{total} Passed ({passed/total*100:.1f}%)")
    print("=" * 70)

    if passed < total * 0.8:
        sys.exit(1)

if __name__ == "__main__":
    main()
