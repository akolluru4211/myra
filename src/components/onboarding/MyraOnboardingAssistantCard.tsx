"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { 
  Sparkles, 
  Send, 
  Bot, 
  User as UserIcon, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle,
  RotateCcw
} from "lucide-react";

interface Message {
  id: string;
  role: "assistant" | "user";
  text: string;
  time: string;
}

interface MyraOnboardingAssistantCardProps {
  studentName?: string;
  onApplyField?: (field: string, value: any) => void;
  className?: string;
}

export default function MyraOnboardingAssistantCard({
  studentName,
  onApplyField,
  className = "",
}: MyraOnboardingAssistantCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialGreeting = studentName
    ? `Hi ${studentName.split(" ")[0]}! 👋 Welcome to EdWorld Co. I'm here to help you get set up and make a plan that fits your goals. It'll only take about 10 minutes. First, what brings you to EdWorld (career goal, new skill, exam prep)?`
    : `Hi there! 👋 Welcome to EdWorld Co. I'm here to help you get set up and make a plan that fits your goals. It'll only take about 10 minutes. First, what's your name, and what brings you to EdWorld?`;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-msg",
      role: "assistant",
      text: initialGreeting,
      time: "Just now",
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const quickChipsByStage: Record<number, string[]> = {
    1: ["Full-Stack Developer", "AI & Machine Learning", "College Placements", "Upskilling"],
    2: ["Complete beginner", "Intermediate (some coding)", "8-10 hours/week", "Hands-on projects"],
    3: ["Software Engineering Track", "DSA & Algorithms", "AI Engineer Track", "System Design"],
    4: ["Set up GitHub", "Install VS Code", "How do squads work?", "Go to dashboard"],
    5: ["Mon/Wed/Fri (45m)", "1 hour every evening", "Weekend deep work"],
    6: ["Tell me about certificates", "How do I get a mentor?", "Ready to begin! 🚀"],
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: "user",
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const res = await fetch("/api/ai/myra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          mode: "onboarding",
          profile: {
            name: studentName,
          },
          onboardingContext: {
            stage: currentStage,
          },
          history: historyPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok || typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("Myra could not continue onboarding.");
      }
      const reply = data.reply;

      // Increment stage gradually if conversation moves forward
      if (currentStage < 6) {
        setCurrentStage((prev) => Math.min(6, prev + 1));
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ast-${Date.now()}`,
          role: "assistant",
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ast-err-${Date.now()}`,
          role: "assistant",
          text: "I'm having a little trouble connecting right now, but please continue filling out your profile! You can reach us anytime at support@edworld.co.",
          time: "Just now",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const stageLabels = [
    "Welcome",
    "Discovery",
    "Path Recommendation",
    "Platform Setup",
    "Learning Plan",
    "Ready to Launch",
  ];

  return (
    <div
      className={`rounded-3xl border border-white/10 bg-[#0C101A] shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
        isOpen ? "h-[540px]" : "h-16"
      } ${className}`}
    >
      {/* Header bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 py-3.5 bg-[#0F1422] border-b border-white/10 text-white flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-slate-800">
            <Image
              src="/images/myra-avatar.png"
              alt="Myra Onboarding Assistant"
              fill
              className="object-cover object-top"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-white font-display">Myra Onboarding Copilot</span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-mono font-semibold flex items-center gap-1 border border-white/15">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Stage {currentStage} of 6: {stageLabels[currentStage - 1]}
            </p>
          </div>
        </div>

        <button 
          type="button" 
          aria-label={isOpen ? "Collapse assistant" : "Expand assistant"}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </button>
      </div>

      {/* Progress pill strip */}
      {isOpen && (
        <div className="px-5 py-2.5 bg-[#080B11] border-b border-white/10 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-mono font-medium">Personalized 10-Min Setup</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                title={`Stage ${s}: ${stageLabels[s - 1]}`}
                className={`h-1.5 rounded-full transition-all ${
                  s === currentStage
                    ? "w-5 bg-white"
                    : s < currentStage
                    ? "w-2.5 bg-slate-400"
                    : "w-2.5 bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages Body */}
      {isOpen && (
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-[#0C101A]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 mt-0.5 border border-white/20">
                  <Image
                    src="/images/myra-avatar.png"
                    alt="Myra"
                    fill
                    className="object-cover object-top"
                  />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed whitespace-pre-line ${
                  m.role === "user"
                    ? "bg-white text-slate-950 font-medium rounded-br-xs"
                    : "bg-[#0F1422] text-slate-100 border border-white/10 rounded-bl-xs"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 justify-start items-center text-slate-400 text-xs pl-8">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Myra is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Quick Chips & Input Bar */}
      {isOpen && (
        <div className="p-3 bg-[#0F1422] border-t border-white/10 space-y-2">
          {/* Quick Option Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(quickChipsByStage[currentStage] || quickChipsByStage[1]).map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleSend(chip)}
                className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 text-white border border-white/10 transition-colors cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Text Input Row */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Myra or type your answer..."
              disabled={loading}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-[#0C101A] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-white/30 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 rounded-xl bg-white text-slate-950 hover:bg-slate-200 disabled:opacity-40 transition-colors shrink-0 cursor-pointer"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
