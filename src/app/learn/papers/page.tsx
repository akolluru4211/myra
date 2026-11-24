"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  ArrowLeft, 
  ExternalLink, 
  Sparkles, 
  Search, 
  Filter, 
  BookOpen, 
  Layers, 
  ShieldCheck,
  Send,
  Loader2,
  CheckCircle2
} from "lucide-react";
import EdworldLogo from "@/components/ui/EdworldLogo";

export default function ResearchPaperLibraryPage() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Ask Myra About Paper Drawer / Modal
  const [activePaper, setActivePaper] = useState<any>(null);
  const [myraQuestion, setMyraQuestion] = useState("");
  const [myraLoading, setMyraLoading] = useState(false);
  const [myraAnswer, setMyraAnswer] = useState<any>(null);

  useEffect(() => {
    async function loadPapers() {
      try {
        setLoading(true);
        const res = await fetch("/api/edlearn/papers");
        const data = await res.json();
        if (data.success && Array.isArray(data.papers)) {
          setPapers(data.papers);
        }
      } catch (err) {
        console.warn("Failed to load papers:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPapers();
  }, []);

  const handleAskMyra = async () => {
    if (!activePaper || !myraQuestion.trim()) return;
    try {
      setMyraLoading(true);
      setMyraAnswer(null);

      const res = await fetch("/api/edlearn/papers/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperId: activePaper.id,
          question: myraQuestion,
        }),
      });

      const data = await res.json();
      setMyraAnswer(data);
    } catch (err) {
      console.warn("Error asking Myra about paper:", err);
    } finally {
      setMyraLoading(false);
    }
  };

  const filteredPapers = papers.filter((p) => {
    const matchesCourse = selectedCourse === "all" || p.courseSlugs.includes(selectedCourse.toLowerCase());
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.authors.some((a: string) => a.toLowerCase().includes(q)) ||
      p.topics.some((t: string) => t.toLowerCase().includes(q)) ||
      p.whatYouCanLearn.toLowerCase().includes(q);
    return matchesCourse && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-blue-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/learn" className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-base font-black font-display text-slate-900">
                EdLearn Research Library
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-blue-200 font-mono">
                Peer-Reviewed Foundations
              </span>
            </div>
          </div>

          <Link
            href="/learn"
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
          >
            Back to Courses
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white space-y-3 shadow-md">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
              Direct Literature Grounding
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
            Connect Practical Engineering Code to Authoritative Computer Science Literature
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Explore seminal research papers that power the algorithms, relational databases, and quantitative heuristics taught across EdLearn. Ask Myra to explain terminology, summarize key sections, or tie papers to code.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-3 border border-blue-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Papers" },
              { id: "dsa", label: "DSA Literature" },
              { id: "sql", label: "SQL & Relational" },
              { id: "aptitude", label: "Decision & Probability" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCourse(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCourse === tab.id
                    ? "bg-[#2563EB] text-white shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-blue-200/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, author, or topic..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-blue-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Papers List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center text-slate-400 font-mono text-xs">
              Loading peer-reviewed literature collection...
            </div>
          ) : filteredPapers.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No papers found matching criteria.
            </div>
          ) : (
            filteredPapers.map((paper) => (
              <div
                key={paper.id}
                className="bg-white rounded-3xl border border-blue-200/80 p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-blue-200">
                        {paper.venue}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{paper.year}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        License: {paper.license}
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-black font-display text-slate-900 leading-snug">
                      {paper.title}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      By {paper.authors.join(", ")}
                    </p>
                  </div>

                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-blue-200 text-slate-600 transition-colors shrink-0"
                    title="Open Authoritative Source Repository"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Practical Takeaway */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-blue-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                    What You Can Learn:
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    {paper.whatYouCanLearn}
                  </p>
                </div>

                {/* Topics & Ask Myra Action */}
                <div className="pt-2 border-t border-blue-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {paper.topics.map((t: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActivePaper(paper);
                      setMyraAnswer(null);
                      setMyraQuestion(`Can you explain how this paper connects to my ${paper.courseSlugs[0]?.toUpperCase()} practice?`);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Ask Myra About This Paper</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Ask Myra Modal */}
      {activePaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-blue-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-black font-display text-slate-900">
                  Ask Myra: {activePaper.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePaper(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Ask about terminology, section summaries, or mathematical models. Myra grounds all answers in the cited publication.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">Your Question:</label>
              <textarea
                value={myraQuestion}
                onChange={(e) => setMyraQuestion(e.target.value)}
                rows={3}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-blue-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {myraAnswer && (
              <div className="p-3.5 rounded-xl bg-[#EFF6FF]/60 border border-blue-200 text-xs text-indigo-950 space-y-2">
                <div className="font-bold text-[#2563EB] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Myra Grounded Explanation:</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{myraAnswer.answer}</p>
                {myraAnswer.citation && (
                  <div className="pt-2 border-t border-blue-200/50 text-[11px] font-mono text-slate-500 space-y-0.5">
                    <div>
                      Source: <strong>{myraAnswer.citation.paperTitle}</strong> (Section: {myraAnswer.citation.section}, Page {myraAnswer.citation.page})
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActivePaper(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Done
              </button>

              <button
                type="button"
                onClick={handleAskMyra}
                disabled={myraLoading}
                className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold flex items-center gap-1.5"
              >
                {myraLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{myraLoading ? "Consulting Source..." : "Ask Myra"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
