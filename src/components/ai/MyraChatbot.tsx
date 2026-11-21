"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { 
  Sparkles, 
  X, 
  ArrowUp,
  RotateCcw, 
  Minimize2, 
  Maximize2, 
  ArrowUpRight, 
  Globe, 
  Copy, 
  Check, 
  Paperclip,
  Camera,
  Bot,
  User as UserIcon,
  Loader2,
  FileText,
  Code2,
  Layers,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import MyraActionCard from "@/components/ai/MyraActionCard";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sourceUrl?: string;
  sourceTitle?: string;
  actionProposal?: any;
}

const CHATGPT_SUGGESTIONS = [
  {
    title: "Optimize resume bullets",
    subtitle: "Add measurable impact & strong action verbs",
    prompt: "Help me rewrite my resume bullet points using action verbs and measurable metrics for maximum ATS scoring.",
  },
  {
    title: "Practice mock interview",
    subtitle: "STAR method behavioral & technical drill",
    prompt: "Can you conduct a 1-on-1 mock interview with me for a Software Engineering role? Start with the first question.",
  },
  {
    title: "Explain DSA concepts",
    subtitle: "Break down graph algorithms & DP step-by-step",
    prompt: "Explain Dynamic Programming versus Greedy algorithms with clear intuition, step-by-step logic, and edge cases.",
  },
  {
    title: "System design architecture",
    subtitle: "Design scalable distributed microservices",
    prompt: "Walk me through how to design a high-concurrency real-time URL shortener with caching, database sharding, and rate limiting.",
  },
];

export default function MyraChatbot() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [copiedSnippetIndex, setCopiedSnippetIndex] = useState<number | null>(null);

  // Image / OCR state
  const [ocrImagePreview, setOcrImagePreview] = useState<string | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Initialize greeting with context awareness
  useEffect(() => {
    const initialGreeting: ChatMessage = {
      id: "initial-welcome",
      role: "assistant",
      content: profile?.name
        ? `Hello ${profile.name}! I am Myra, your AI study companion on EdWorld. Tell me your goal (for example JEE, NEET, CUET, boards, semester exams, GATE, CAT, placements), how many months you have, and how many hours a day you can study. I'll build your timetable and roadmap.`
        : "Hello! I am Myra, your AI study companion on EdWorld. Tell me your goal (for example JEE, NEET, CUET, boards, semester exams, GATE, CAT, placements), how many months you have, and how many hours a day you can study. I'll build your timetable and roadmap.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([initialGreeting]);
  }, [profile?.name]);

  // Listen for open-myra-copilot / close-myra-copilot triggers from header or navigation
  useEffect(() => {
    const handleOpenCopilot = (e: any) => {
      setIsOpen(true);
      if (e?.detail?.prompt) {
        setInput(e.detail.prompt);
      }
    };
    const handleCloseCopilot = () => {
      setIsOpen(false);
    };
    window.addEventListener("open-myra-copilot", handleOpenCopilot as EventListener);
    window.addEventListener("close-myra-copilot", handleCloseCopilot as EventListener);
    return () => {
      window.removeEventListener("open-myra-copilot", handleOpenCopilot as EventListener);
      window.removeEventListener("close-myra-copilot", handleCloseCopilot as EventListener);
    };
  }, []);

  const handleClearChat = () => {
    const initialGreeting: ChatMessage = {
      id: "initial-welcome",
      role: "assistant",
      content: profile?.name
        ? `Hello ${profile.name}! I am Myra, your AI study companion on EdWorld. Tell me your goal (for example JEE, NEET, CUET, boards, semester exams, GATE, CAT, placements), how many months you have, and how many hours a day you can study. I'll build your timetable and roadmap.`
        : "Hello! I am Myra, your AI study companion on EdWorld. Tell me your goal (for example JEE, NEET, CUET, boards, semester exams, GATE, CAT, placements), how many months you have, and how many hours a day you can study. I'll build your timetable and roadmap.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([initialGreeting]);
  };

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetIndex(idx);
    setTimeout(() => setCopiedSnippetIndex(null), 2000);
  };

  // OCR upload handler
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setOcrError("Please upload a valid image file.");
      return;
    }
    setOcrError(null);
    setIsOcrProcessing(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Url = e.target?.result as string;
      setOcrImagePreview(base64Url);

      try {
        const res = await fetch("/api/ai/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Url }),
        });
        const data = await res.json();
        if (data.success && data.text) {
          setInput((prev) => (prev ? `${prev}\n${data.text}` : data.text));
        } else {
          setOcrError(data.error || "Could not extract text from this image.");
        }
      } catch (err: any) {
        setOcrError("Failed to process image OCR. Please try again.");
      } finally {
        setIsOcrProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            handleImageUpload(file);
            break;
          }
        }
      }
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInput("");
    setOcrImagePreview(null);
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/myra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          userId: user?.uid,
          profile: {
            name: profile?.name || user?.name || "Student",
            targetRole: profile?.targetRole || "Software Engineer",
            interests: profile?.interests || [],
            careerStage: profile?.careerStage || "STUDENT",
          },
          history: historyPayload,
          pathname,
        }),
      });

      const data = await res.json();
      const reply = res.ok ? data.reply || data.response : data.reply || data.error;
      if (typeof reply !== "string" || !reply.trim()) {
        throw new Error("Myra returned an empty response.");
      }
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionProposal: res.ok ? data.actionProposal || null : null,
        sourceUrl: data.sourceUrl || null,
        sourceTitle: data.sourceTitle || null,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I ran into a network error. Please try asking again in a moment.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Markdown & Token Rendering
  // ---------------------------------------------------------------------------

  const renderInlineTokens = (text: string) => {
    const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, pIdx) => {
      if (!part) return null;

      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        return (
          <Link
            key={pIdx}
            href={href}
            className="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:text-white border border-indigo-500/30 font-semibold text-xs transition-colors"
          >
            <span>{label}</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        );
      }

      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return (
          <strong key={pIdx} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }

      if (part.startsWith("*") && part.endsWith("*") && part.length >= 2 && !part.slice(1, -1).includes("*")) {
        return (
          <em key={pIdx} className="italic text-slate-200">
            {part.slice(1, -1)}
          </em>
        );
      }

      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return (
          <code key={pIdx} className="px-1.5 py-0.5 mx-0.5 rounded-md bg-[#1B202E] font-mono text-xs text-indigo-300 border border-white/10">
            {part.slice(1, -1)}
          </code>
        );
      }

      return <span key={pIdx}>{part}</span>;
    });
  };

  const renderTextBlock = (rawText: string, blockKey: string | number) => {
    const lines = rawText.split(/\r?\n/);
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith("### ")) {
        elements.push(
          <h4 key={`h3-${blockKey}-${i}`} className="font-bold text-white text-sm sm:text-base mt-3.5 mb-1 font-display tracking-tight">
            {renderInlineTokens(line.replace(/^###\s+/, ""))}
          </h4>
        );
        i++;
        continue;
      }

      if (line.startsWith("#### ")) {
        elements.push(
          <h5 key={`h4-${blockKey}-${i}`} className="font-bold text-slate-200 text-xs sm:text-sm mt-2.5 mb-0.5 font-display">
            {renderInlineTokens(line.replace(/^####\s+/, ""))}
          </h5>
        );
        i++;
        continue;
      }

      const bulletMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
      if (bulletMatch) {
        elements.push(
          <div key={`bullet-${blockKey}-${i}`} className="flex items-start gap-2.5 my-1 text-xs sm:text-sm leading-relaxed text-slate-200 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
            <span className="flex-1">{renderInlineTokens(bulletMatch[2])}</span>
          </div>
        );
        i++;
        continue;
      }

      const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (numMatch) {
        elements.push(
          <div key={`num-${blockKey}-${i}`} className="flex items-start gap-2.5 my-1 text-xs sm:text-sm leading-relaxed text-slate-200 pl-1">
            <span className="font-bold text-white text-xs mt-0.5 shrink-0 w-4 font-mono">{numMatch[2]}.</span>
            <span className="flex-1">{renderInlineTokens(numMatch[3])}</span>
          </div>
        );
        i++;
        continue;
      }

      if (!line.trim()) {
        elements.push(<div key={`sp-${blockKey}-${i}`} className="h-2" />);
        i++;
        continue;
      }

      elements.push(
        <p key={`p-${blockKey}-${i}`} className="my-1 text-xs sm:text-sm leading-relaxed text-slate-200">
          {renderInlineTokens(line)}
        </p>
      );
      i++;
    }

    return elements;
  };

  const renderFormattedContent = (content: string) => {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const segments: Array<{ type: "code" | "text"; content: string; lang?: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content || "")) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: "text", content: (content || "").slice(lastIndex, match.index) });
      }
      segments.push({ type: "code", lang: match[1] || "code", content: match[2].trim() });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < (content || "").length) {
      segments.push({ type: "text", content: (content || "").slice(lastIndex) });
    }

    return segments.map((seg, sIdx) => {
      if (seg.type === "code") {
        return (
          <div key={`code-${sIdx}`} className="my-3 rounded-2xl bg-[#090C14] text-slate-100 overflow-hidden border border-white/10 shadow-lg font-mono">
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#121624] border-b border-white/10 text-[10px] text-slate-400">
              <span className="uppercase tracking-wider font-bold">{seg.lang || "code"}</span>
              <button
                onClick={() => handleCopyCode(seg.content, sIdx)}
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-[11px]"
                title="Copy code"
              >
                {copiedSnippetIndex === sIdx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy code</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 text-xs overflow-x-auto leading-relaxed text-slate-200">
              <code>{seg.content}</code>
            </pre>
          </div>
        );
      }
      return <div key={`txt-${sIdx}`}>{renderTextBlock(seg.content, sIdx)}</div>;
    });
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* Floating Trigger Button (when closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#0C101A] hover:bg-[#121624] text-white border border-white/15 shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          aria-label="Open Myra AI Chat"
        >
          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/20 shrink-0">
            <Image
              src="/images/myra-avatar.png"
              alt="Myra AI"
              fill
              className="object-cover"
            />
          </div>
          <span className="text-xs font-bold text-white tracking-wide font-display">Ask Myra</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}

      {/* ChatGPT Aesthetic Floating Modal */}
      {isOpen && (
        <div
          className={`relative bg-[#0C101A] text-white border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${
            isExpanded
              ? "w-[calc(100vw-2rem)] sm:w-[680px] h-[calc(100dvh-4rem)] max-h-[880px]"
              : "w-[calc(100vw-1.5rem)] sm:w-[440px] h-[calc(100dvh-5rem)] sm:h-[640px] max-h-[82dvh]"
          }`}
        >
          {/* ChatGPT Sleek Minimalist Header */}
          <div className="bg-[#080B11] px-4 py-3 flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/20 bg-white/5 shrink-0">
                <Image
                  src="/images/myra-avatar.png"
                  alt="Myra"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-white font-display">Myra</h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/10 text-slate-300">
                    Study &amp; Career Mentor
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" title="Online" />
                </div>
                <span className="text-[10px] text-slate-400">
                  Class 12 • College • Placements • Higher-Ed
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={handleClearChat}
                title="New chat"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                aria-label="New chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse view" : "Expand view"}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer hidden sm:block"
                aria-label="Toggle expand"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ChatGPT Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#0C101A]">
            {/* Empty State: ChatGPT Prompt Grid */}
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center px-2 py-6 space-y-6">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 mx-auto shadow-lg relative">
                    <Image
                      src="/images/myra-avatar.png"
                      alt="Myra AI"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight">
                    What can I help with today?
                  </h2>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Ask questions about mock interviews, DSA algorithms, ATS resumes, or career paths.
                  </p>
                </div>

                {/* 2x2 Clean Suggestion Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                  {CHATGPT_SUGGESTIONS.map((card, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => handleSend(card.prompt)}
                      className="p-3.5 rounded-2xl bg-[#0F1422] hover:bg-[#141B2D] border border-white/10 hover:border-white/25 transition-all text-left group cursor-pointer shadow-sm"
                    >
                      <div className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors">
                        {card.title}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {card.subtitle}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/15 bg-white/5 shrink-0 mt-0.5">
                      <Image
                        src="/images/myra-avatar.png"
                        alt="Myra"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div
                    className={`text-xs sm:text-[13px] leading-relaxed font-sans ${
                      msg.role === "user"
                        ? "bg-[#2F2F2F] text-white rounded-3xl px-4 py-2.5 max-w-[85%] shadow-sm"
                        : "bg-[#141824] border border-white/10 text-slate-100 rounded-2xl rounded-tl-xs px-4 py-3 max-w-[92%] sm:max-w-[88%]"
                    }`}
                  >
                    <div className="break-words">
                      {renderFormattedContent(msg.content)}
                    </div>

                    {msg.actionProposal && (
                      <div className="mt-3">
                        <MyraActionCard
                          proposal={msg.actionProposal}
                          userId={user?.uid}
                        />
                      </div>
                    )}

                    {msg.sourceUrl && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] text-slate-400 flex items-center gap-1.5">
                        <Globe className="w-3 h-3 text-emerald-400" />
                        <span className="truncate">Source: {msg.sourceTitle || msg.sourceUrl}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* ChatGPT 3-Dot Typing Animation */}
            {isLoading && (
              <div className="flex gap-3 items-center">
                <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/15 bg-white/5 shrink-0">
                  <Image
                    src="/images/myra-avatar.png"
                    alt="Myra"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="bg-[#0F1422] border border-white/10 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* OCR / Image Preview Attachment Strip */}
          {ocrImagePreview && (
            <div className="px-4 py-2 bg-[#080B11] border-t border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative w-7 h-7 rounded-lg border border-white/20 overflow-hidden shrink-0">
                  <img src={ocrImagePreview} alt="OCR capture" className="w-full h-full object-cover" />
                </div>
                <span className="text-[11px] text-slate-300 truncate font-mono">
                  {isOcrProcessing ? "Extracting text..." : "Image attached"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOcrImagePreview(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {ocrError && (
            <div className="px-4 py-1.5 text-[11px] text-rose-400 bg-rose-950/40 border-t border-rose-500/20">
              {ocrError}
            </div>
          )}

          {/* Hidden Inputs for File & Camera Attachments */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
              e.target.value = "";
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
              e.target.value = "";
            }}
          />

          {/* ChatGPT Floating Pill Input Capsule */}
          <div className="p-3 bg-[#080B11] border-t border-white/10 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative flex items-center bg-[#1A1F2C] border border-white/15 focus-within:border-white/30 rounded-3xl px-3 py-1.5 transition-all shadow-inner"
            >
              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isOcrProcessing || isLoading}
                title="Attach image or screenshot"
                className="p-1.5 text-slate-400 hover:text-white rounded-xl transition-colors shrink-0 cursor-pointer disabled:opacity-40"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPaste={handlePaste}
                placeholder="Message Myra..."
                disabled={isLoading || isOcrProcessing}
                className="flex-1 bg-transparent border-0 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none px-2.5 py-1 disabled:opacity-50 font-normal"
              />

              {/* Circular ArrowUp Send Button */}
              <button
                type="submit"
                disabled={!input.trim() || isLoading || isOcrProcessing}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 shadow-md ${
                  input.trim() && !isLoading && !isOcrProcessing
                    ? "bg-white text-slate-950 hover:bg-slate-200 cursor-pointer"
                    : "bg-white/10 text-slate-500 cursor-not-allowed"
                }`}
                aria-label="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>

            <p className="text-[10px] text-center text-slate-500 mt-2 font-normal">
              Myra can make mistakes. Verify important career and code info.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
