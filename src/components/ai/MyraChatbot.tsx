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
import { validateChatLink } from "@/lib/ai/link-validator";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sourceUrl?: string;
  sourceTitle?: string;
  actionProposal?: any;
  webSearchStatus?: "completed" | "no_results" | "disabled";
  status?: "sent" | "error" | "auth_required" | "quota_exceeded";
  errorData?: {
    limit?: number;
    currentCount?: number;
    resetTime?: string;
    canRetry?: boolean;
    failedPrompt?: string;
  };
}

// Global page session ID to distinguish browser page reloads from same-session modal close/reopen
let pageLoadSessionId = "";
if (typeof window !== "undefined") {
  if (!(window as any).__myra_page_session_id) {
    (window as any).__myra_page_session_id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  pageLoadSessionId = (window as any).__myra_page_session_id;
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
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  // Image / OCR state
  const [ocrImagePreview, setOcrImagePreview] = useState<string | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentChatSessionIdRef = useRef<number>(1);
  const previousUserIdRef = useRef<string | undefined>(user?.uid);

  // Helper to get session storage key for current user
  const getTranscriptStorageKey = (uid?: string) => `myra_session_transcript_${uid || "guest"}`;

  // Helper to generate the default welcome message
  const getDefaultGreeting = (): ChatMessage => ({
    id: "initial-welcome",
    role: "assistant",
    content: profile?.name
      ? `Hello ${profile.name}! I am Myra, your AI study companion on EdWorld. Tell me your goal (for example JEE, NEET, CUET, boards, semester exams, GATE, CAT, placements), how many months you have, and how many hours a day you can study. I'll build your timetable and roadmap.`
      : "Hello! I am Myra, your AI study companion on EdWorld. Tell me your goal (for example JEE, NEET, CUET, boards, semester exams, GATE, CAT, placements), how many months you have, and how many hours a day you can study. I'll build your timetable and roadmap.",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });

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

  // Manage transcript lifecycle across page load, account switch, and panel close/reopen
  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentUid = user?.uid;
    const sessionTokenKey = `myra_page_load_token_${currentUid || "guest"}`;
    const transcriptKey = getTranscriptStorageKey(currentUid);

    // If account switched, abort pending requests and clear previous account's temporary transcript
    if (previousUserIdRef.current !== currentUid) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      currentChatSessionIdRef.current += 1;
      setIsLoading(false);
      try {
        sessionStorage.removeItem(getTranscriptStorageKey(previousUserIdRef.current));
        sessionStorage.removeItem(`myra_page_load_token_${previousUserIdRef.current || "guest"}`);
      } catch {}
      previousUserIdRef.current = currentUid;
    }

    // Check if this is a fresh page refresh / new browser load
    const storedPageSession = sessionStorage.getItem(sessionTokenKey);
    if (!storedPageSession || storedPageSession !== pageLoadSessionId) {
      // Fresh page refresh -> clear transcript for this session
      try {
        sessionStorage.setItem(sessionTokenKey, pageLoadSessionId);
        sessionStorage.removeItem(transcriptKey);
      } catch {}
      setMessages([getDefaultGreeting()]);
    } else {
      // Same browser tab / session -> restore preserved transcript across close/reopen
      try {
        const saved = sessionStorage.getItem(transcriptKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            return;
          }
        }
      } catch {}
      setMessages([getDefaultGreeting()]);
    }
  }, [user?.uid, profile?.name]);

  // Persist messages to sessionStorage for same-tab panel close/reopen
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (messages.length > 0) {
      try {
        sessionStorage.setItem(getTranscriptStorageKey(user?.uid), JSON.stringify(messages));
      } catch {}
    }
  }, [messages, user?.uid]);

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
    // Abort any in-flight reply
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Invalidate conversation session so any late promises are discarded
    currentChatSessionIdRef.current += 1;
    setIsLoading(false);
    setOcrError(null);
    setOcrImagePreview(null);
    setInput("");

    const initialGreeting = getDefaultGreeting();
    setMessages([initialGreeting]);

    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(
          getTranscriptStorageKey(user?.uid),
          JSON.stringify([initialGreeting])
        );
      } catch {}
    }
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

    // Abort any existing in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestSessionId = currentChatSessionIdRef.current;
    const requestUserId = user?.uid;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => {
      // If this is a retry of a previous failed prompt, we can remove the previous failed assistant error or keep it
      return [...prev, userMessage];
    });
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
        signal: controller.signal,
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
          webSearch: webSearchEnabled,
        }),
      });

      // Ignore late response if user started a New Chat or switched accounts
      if (
        requestSessionId !== currentChatSessionIdRef.current ||
        requestUserId !== user?.uid
      ) {
        return;
      }

      const data = await res.json().catch(() => ({}));

      // 1. Handle Unauthenticated / Session Expired (401)
      if (res.status === 401) {
        // Restore user's draft input so nothing is lost
        setInput(textToSend.trim());
        const assistantMessage: ChatMessage = {
          id: `assistant-auth-${Date.now()}`,
          role: "assistant",
          content: data.message || "Please sign in to chat with Myra. Your draft has been saved.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "auth_required",
          errorData: {
            failedPrompt: textToSend.trim(),
          },
        };
        setMessages((prev) => [...prev, assistantMessage]);
        return;
      }

      // 2. Handle Quota / Rate Limit Exceeded (429)
      if (res.status === 429) {
        const assistantMessage: ChatMessage = {
          id: `assistant-quota-${Date.now()}`,
          role: "assistant",
          content: data.message || "You've reached your daily limit of queries with Myra on the Free plan. Upgrade to Pro for unlimited AI guidance.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "quota_exceeded",
          errorData: {
            limit: data.limit || 25,
            currentCount: data.currentCount || 25,
            resetTime: data.resetTime,
            failedPrompt: textToSend.trim(),
          },
        };
        setMessages((prev) => [...prev, assistantMessage]);
        return;
      }

      // 3. Handle Service Unavailable / Temporary Errors (503 / 500 / other errors)
      if (!res.ok) {
        // Restore user draft on recoverable error
        setInput(textToSend.trim());
        const errorMessage = data.message || data.error || "Temporary service error. Please try again.";
        const assistantMessage: ChatMessage = {
          id: `assistant-err-${Date.now()}`,
          role: "assistant",
          content: errorMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "error",
          errorData: {
            canRetry: true,
            failedPrompt: textToSend.trim(),
          },
        };
        setMessages((prev) => [...prev, assistantMessage]);
        return;
      }

      const reply = data.reply || data.response;
      if (typeof reply !== "string" || !reply.trim()) {
        throw new Error("Myra returned an empty response.");
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "sent",
        actionProposal: data.actionProposal || null,
        sourceUrl: data.sourceUrl || null,
        sourceTitle: data.sourceTitle || null,
        webSearchStatus: data.webSearchStatus || (webSearchEnabled ? "no_results" : "disabled"),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // Aborted cleanly by user action (New Chat or session change)
        return;
      }
      // Check if session was reset while request was in-flight
      if (
        requestSessionId !== currentChatSessionIdRef.current ||
        requestUserId !== user?.uid
      ) {
        return;
      }

      // Restore user draft so nothing is lost
      setInput(textToSend.trim());
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I ran into a network error. Your message draft has been preserved — click Retry below or resend.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "error",
          errorData: {
            canRetry: true,
            failedPrompt: textToSend.trim(),
          },
        },
      ]);
    } finally {
      if (currentChatSessionIdRef.current === requestSessionId) {
        setIsLoading(false);
      }
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
        const [, rawLabel, rawHref] = linkMatch;
        const validation = validateChatLink(rawHref, rawLabel);

        // If link is invalid or disallowed, render as plain text
        if (!validation.isValid || !validation.sanitizedUrl) {
          return (
            <span key={pIdx} className="text-slate-300 font-mono text-xs">
              {rawLabel || rawHref}
            </span>
          );
        }

        // Validated External HTTPS URL
        if (validation.isExternal) {
          return (
            <a
              key={pIdx}
              href={validation.sanitizedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 rounded-lg bg-blue-50 text-blue-700 hover:text-blue-900 border border-blue-200 font-semibold text-xs transition-colors"
              title={`External link: ${validation.sanitizedUrl}`}
            >
              <span>{validation.displayLabel}</span>
              <span className="text-[10px] text-blue-500 font-normal">[ext]</span>
              <ArrowUpRight className="w-3 h-3 text-blue-600" />
            </a>
          );
        }

        // Validated Internal App Path
        return (
          <Link
            key={pIdx}
            href={validation.sanitizedUrl}
            className="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 rounded-lg bg-blue-50 text-blue-700 hover:text-blue-900 border border-blue-200 font-semibold text-xs transition-colors"
          >
            <span>{validation.displayLabel}</span>
            <ArrowUpRight className="w-3 h-3 text-blue-600" />
          </Link>
        );
      }

      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return (
          <strong key={pIdx} className="font-bold text-black">
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
          <code key={pIdx} className="px-1.5 py-0.5 mx-0.5 rounded-md bg-[#1B202E] font-mono text-xs text-indigo-300 border border-blue-200">
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
          <h4 key={`h3-${blockKey}-${i}`} className="font-bold text-black text-sm sm:text-base mt-3.5 mb-1 font-display tracking-tight">
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
            <span className="font-bold text-black text-xs mt-0.5 shrink-0 w-4 font-mono">{numMatch[2]}.</span>
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
          <div key={`code-${sIdx}`} className="my-3 rounded-2xl bg-[#090C14] text-slate-100 overflow-hidden border border-blue-200 shadow-lg font-mono">
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#121624] border-b border-blue-200 text-[10px] text-slate-600">
              <span className="uppercase tracking-wider font-bold">{seg.lang || "code"}</span>
              <button
                onClick={() => handleCopyCode(seg.content, sIdx)}
                className="flex items-center gap-1 hover:text-black transition-colors cursor-pointer text-[11px]"
                title="Copy code"
              >
                {copiedSnippetIndex === sIdx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
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
    <div className="fixed inset-x-2 bottom-3 sm:inset-x-auto sm:bottom-6 sm:right-6 lg:bottom-6 lg:right-6 z-50 font-sans pointer-events-none flex justify-center sm:justify-end pb-[env(safe-area-inset-bottom,0px)]">
      {/* Floating Trigger Button on Desktop only (hidden on mobile where labeled bottom-nav tab is used, avoiding covering page buttons) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="hidden lg:flex pointer-events-auto items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#0C101A] hover:bg-[#121624] text-black border border-white/15 shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer group select-none"
          aria-label="Open Myra AI Chat"
        >
          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-blue-300 shrink-0">
            <Image
              src="/images/myra-avatar.png"
              alt="Myra AI"
              fill
              className="object-cover"
            />
          </div>
          <span className="text-xs font-bold text-black tracking-wide font-display">Ask Myra</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      )}

      {/* ChatGPT Aesthetic Floating Modal */}
      {isOpen && (
        <div
          className={`pointer-events-auto relative bg-[#0C101A] text-black border border-blue-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${
            isExpanded
              ? "w-full max-w-[calc(100vw-1rem)] sm:w-[680px] h-[calc(100dvh-2rem)] max-h-[880px]"
              : "w-full max-w-[calc(100vw-1rem)] sm:w-[440px] h-[calc(100dvh-4rem)] sm:h-[640px] max-h-[88dvh]"
          }`}
        >
          {/* ChatGPT Sleek Minimalist Header */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-blue-200 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative w-7 h-7 rounded-full overflow-hidden border border-blue-300 bg-[#EFF6FF] shrink-0">
                <Image
                  src="/images/myra-avatar.png"
                  alt="Myra"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-black font-display">Myra</h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#DBEAFE] text-slate-300">
                    Study &amp; Career Mentor
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" title="Online" />
                </div>
                <span className="text-[10px] text-slate-600">
                  Class 12 • College • Placements • Higher-Ed
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-600">
              <button
                onClick={handleClearChat}
                title="New chat"
                className="p-1.5 hover:text-black hover:bg-[#DBEAFE] rounded-xl transition-colors cursor-pointer"
                aria-label="New chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse view" : "Expand view"}
                className="p-1.5 hover:text-black hover:bg-[#DBEAFE] rounded-xl transition-colors cursor-pointer hidden sm:block"
                aria-label="Toggle expand"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 hover:text-black hover:bg-[#DBEAFE] rounded-xl transition-colors cursor-pointer"
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
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-300 mx-auto shadow-lg relative">
                    <Image
                      src="/images/myra-avatar.png"
                      alt="Myra AI"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black font-display text-black tracking-tight">
                    What can I help with today?
                  </h2>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto">
                    Ask questions about mock interviews, DSA algorithms, ATS resumes, or career paths.
                  </p>
                </div>

                {/* 2x2 Clean Suggestion Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                  {CHATGPT_SUGGESTIONS.map((card, cIdx) => (
                    <button
                      key={cIdx}
                      onClick={() => handleSend(card.prompt)}
                      className="p-3.5 rounded-2xl bg-[#0F1422] hover:bg-[#141B2D] border border-blue-200 hover:border-white/25 transition-all text-left group cursor-pointer shadow-sm"
                    >
                      <div className="font-bold text-xs text-black group-hover:text-indigo-300 transition-colors">
                        {card.title}
                      </div>
                      <div className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
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
                    <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/15 bg-[#EFF6FF] shrink-0 mt-0.5">
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
                        ? "bg-[#2F2F2F] text-black rounded-3xl px-4 py-2.5 max-w-[85%] shadow-sm"
                        : msg.status === "auth_required"
                        ? "bg-[#EFF6FF] border border-blue-300 text-black rounded-2xl rounded-tl-xs px-4 py-3 max-w-[92%] sm:max-w-[88%]"
                        : msg.status === "quota_exceeded"
                        ? "bg-[#EFF6FF] border border-blue-300 text-black rounded-2xl rounded-tl-xs px-4 py-3 max-w-[92%] sm:max-w-[88%]"
                        : msg.status === "error"
                        ? "bg-[#EFF6FF] border border-blue-300 text-black rounded-2xl rounded-tl-xs px-4 py-3 max-w-[92%] sm:max-w-[88%]"
                        : "bg-[#141824] border border-blue-200 text-slate-100 rounded-2xl rounded-tl-xs px-4 py-3 max-w-[92%] sm:max-w-[88%]"
                    }`}
                  >
                    <div className="break-words">
                      {renderFormattedContent(msg.content)}
                    </div>

                    {/* Auth Required State */}
                    {msg.status === "auth_required" && (
                      <div className="mt-3 pt-3 border-t border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-700">
                          Sign in to save your progress and continue chatting.
                        </span>
                        <Link
                          href={`/login?redirectUrl=${encodeURIComponent(pathname || "/dashboard")}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs transition-colors shadow-sm"
                        >
                          <span>Sign in</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}

                    {/* Quota Exceeded State */}
                    {msg.status === "quota_exceeded" && (
                      <div className="mt-3 pt-3 border-t border-blue-200 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-700">
                          <span>Daily Free Limit: {msg.errorData?.limit || 25} queries</span>
                          {msg.errorData?.resetTime && (
                            <span className="text-slate-500">
                              Resets: {new Date(msg.errorData.resetTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <Link
                            href="/pricing"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs transition-colors shadow-sm"
                          >
                            <span>Upgrade to Pro</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Temporary Error with Retry State */}
                    {msg.status === "error" && msg.errorData?.canRetry && msg.errorData.failedPrompt && (
                      <div className="mt-3 pt-3 border-t border-blue-200 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-700">Temporary network or service issue</span>
                        <button
                          type="button"
                          onClick={() => handleSend(msg.errorData?.failedPrompt)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#DBEAFE] hover:bg-[#BFDBFE] text-black font-medium text-xs transition-colors cursor-pointer border border-blue-200"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                      </div>
                    )}

                    {msg.actionProposal && (
                      <div className="mt-3">
                        <MyraActionCard
                          proposal={msg.actionProposal}
                          userId={user?.uid}
                        />
                      </div>
                    )}

                    {/* Web Search Citation / Source Link */}
                    {msg.sourceUrl && (() => {
                      const linkCheck = validateChatLink(msg.sourceUrl, msg.sourceTitle || msg.sourceUrl);
                      if (!linkCheck.isValid || !linkCheck.sanitizedUrl) {
                        return (
                          <div className="mt-2.5 pt-2 border-t border-blue-200 text-[10px] text-slate-500 flex items-center gap-1.5 font-mono">
                            <Globe className="w-3 h-3 text-slate-400" />
                            <span className="truncate">Source (unverified link): {linkCheck.displayLabel}</span>
                          </div>
                        );
                      }

                      return (
                        <div className="mt-2.5 pt-2 border-t border-blue-200 text-[10px] text-slate-700 flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Globe className="w-3 h-3 text-blue-600 shrink-0" />
                            <span className="text-slate-500 shrink-0 font-medium">Source:</span>
                            <a
                              href={linkCheck.sanitizedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline truncate font-medium inline-flex items-center gap-0.5"
                              title={linkCheck.sanitizedUrl}
                            >
                              <span>{linkCheck.displayLabel}</span>
                              <span className="text-[9px] text-slate-400 no-underline">[ext]</span>
                              <ArrowUpRight className="w-2.5 h-2.5" />
                            </a>
                          </div>
                          <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium shrink-0">
                            Verified Citation
                          </span>
                        </div>
                      );
                    })()}

                    {/* Web Search Completed with No Results */}
                    {msg.webSearchStatus === "no_results" && !msg.sourceUrl && (
                      <div className="mt-2 pt-2 border-t border-blue-200 text-[10px] text-amber-700 bg-amber-50/60 px-2 py-1 rounded-md flex items-center gap-1.5">
                        <Globe className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Web search executed, but no external sources were found. Answer provided from internal knowledge.</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* ChatGPT 3-Dot Typing Animation */}
            {isLoading && (
              <div className="flex gap-3 items-center">
                <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/15 bg-[#EFF6FF] shrink-0">
                  <Image
                    src="/images/myra-avatar.png"
                    alt="Myra"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="bg-[#0F1422] border border-blue-200 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-1.5 shadow-sm">
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
            <div className="px-4 py-2 bg-white border-t border-blue-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative w-7 h-7 rounded-lg border border-blue-300 overflow-hidden shrink-0">
                  <img src={ocrImagePreview} alt="OCR capture" className="w-full h-full object-cover" />
                </div>
                <span className="text-[11px] text-slate-300 truncate font-mono">
                  {isOcrProcessing ? "Extracting text..." : "Image attached"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOcrImagePreview(null)}
                className="text-slate-600 hover:text-black p-1 rounded-lg"
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
          <div className="p-3 bg-white border-t border-blue-200 shrink-0 space-y-2">
            {/* Search the Web Toggle & Privacy Note */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1 text-[11px]">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={webSearchEnabled}
                  onChange={(e) => setWebSearchEnabled(e.target.checked)}
                  disabled={isLoading}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600 relative"></div>
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <Globe className={`w-3.5 h-3.5 ${webSearchEnabled ? "text-blue-600" : "text-slate-400"}`} />
                  Search the web
                </span>
              </label>

              {webSearchEnabled ? (
                <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                  Search terms or public URLs will be sent to external provider.
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">
                  Off by default. Answers generated from Myra knowledge.
                </span>
              )}
            </div>

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
                {isOcrProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPaste={handlePaste}
                placeholder={isOcrProcessing ? "Extracting text from image..." : "Message Myra..."}
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
                    : "bg-[#DBEAFE] text-slate-500 cursor-not-allowed"
                }`}
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                ) : (
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            </form>

            <div className="flex flex-col gap-1 text-[10px] text-center text-slate-500 mt-2 font-normal">
              <p className="text-slate-600 font-medium">
                This chat clears when you refresh. Myra may remember learning preferences separately.
              </p>
              <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px]">
                <span>Manage learning data:</span>
                <Link
                  href="/settings/memory"
                  onClick={() => setIsOpen(false)}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Myra memory settings →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
