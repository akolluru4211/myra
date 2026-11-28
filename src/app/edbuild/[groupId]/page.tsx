"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Users,
  Send,
  Image as ImageIcon,
  Video,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Award,
  ArrowLeft,
  Copy,
  Check,
  User,
  AlertCircle,
  FileCode,
  Globe,
  Upload,
  Play,
  MessageSquare,
  LayoutList,
  GitBranch,
  Plus,
  ChevronRight,
  CircleDot,
  Code2
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth-context";

interface GroupMember {
  user_id: string;
  name: string;
  avatar_url?: string;
  role: "LEADER" | "MEMBER";
  email: string;
  username?: string;
  isOnline?: boolean;
}

interface GroupMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  message_type: "text" | "image" | "video" | "system";
  content?: string;
  media_url?: string;
  created_at: string;
}

interface GroupData {
  id: string;
  name: string;
  access_type: "public" | "private";
  join_key?: string;
  team_size: number;
  current_members_count: number;
  leader_id: string;
  leader_name: string;
  leader_email: string;
  problem_statement: string;
  status: "OPEN" | "FULL" | "IN_PROGRESS" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  submission_repo_url?: string;
  submission_live_url?: string;
  submission_notes?: string;
  submitted_at?: string;
}

interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  assigneeName: string;
  priority: "P0" | "P1" | "P2";
  status: "BACKLOG" | "IN_PROGRESS" | "REVIEW" | "DONE";
}

const STARTER_REPOSITORIES = [
  {
    name: "Next.js 15 Full-Stack SaaS Template",
    tag: "Full-Stack",
    repo: "https://github.com/edworld-co/starter-nextjs-saas",
    cloneCmd: "git clone https://github.com/edworld-co/starter-nextjs-saas.git",
    desc: "Production-ready template with Tailwind CSS, Supabase Auth SSR, Server Actions, and Postgres schema migrations.",
    stack: ["Next.js 15", "TypeScript", "Tailwind CSS", "Supabase"],
  },
  {
    name: "FastAPI High-Concurrency Microservice",
    tag: "Backend & Systems",
    repo: "https://github.com/edworld-co/starter-fastapi-service",
    cloneCmd: "git clone https://github.com/edworld-co/starter-fastapi-service.git",
    desc: "Asynchronous Python microservice with Pydantic v2, PostgreSQL connection pooling, Dockerfile, and pytest suite.",
    stack: ["FastAPI", "Python 3.12", "PostgreSQL", "Docker"],
  },
  {
    name: "React Native Cross-Platform App",
    tag: "Mobile",
    repo: "https://github.com/edworld-co/starter-react-native-expo",
    cloneCmd: "git clone https://github.com/edworld-co/starter-react-native-expo.git",
    desc: "Universal mobile skeleton built on Expo Router, NativeWind, gesture handlers, and biometrics auth.",
    stack: ["React Native", "Expo 52", "NativeWind", "Zustand"],
  },
  {
    name: "Myra AI Agent & RAG Pipeline Skeleton",
    tag: "AI & ML",
    repo: "https://github.com/edworld-co/starter-rag-agent",
    cloneCmd: "git clone https://github.com/edworld-co/starter-rag-agent.git",
    desc: "Autonomous conversational agent harness with Gemini Flash, vector search retrieval, and tool-use schema.",
    stack: ["Gemini API", "Python", "pgvector", "LangGraph"],
  },
];

export default function EdBuildWorkspacePage() {

  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const groupId = (params?.groupId as string) || "";

  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Message input state
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showMediaInput, setShowMediaInput] = useState<"image" | "video" | null>(null);
  const [mediaUrlInput, setMediaUrlInput] = useState("");

  // Submission state
  const [repoUrl, setRepoUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const [copiedKey, setCopiedKey] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<"chat" | "kanban" | "repos">("chat");

  // Kanban Sprint Board state
  const [tasks, setTasks] = useState<KanbanTask[]>([
    {
      id: "task-1",
      title: "System Architecture & Schema Design",
      description: "Define entity-relationship diagram and Postgres schemas with foreign keys.",
      assigneeName: "Team Leader",
      priority: "P0",
      status: "IN_PROGRESS",
    },
    {
      id: "task-2",
      title: "Core API Route Endpoints",
      description: "Implement authenticated REST endpoints with Zod payload validation.",
      assigneeName: "Contributor",
      priority: "P1",
      status: "BACKLOG",
    },
    {
      id: "task-3",
      title: "Frontend Bento Layout & State",
      description: "Assemble responsive interface components using Tailwind and Radix primitives.",
      assigneeName: "Contributor",
      priority: "P1",
      status: "BACKLOG",
    },
    {
      id: "task-4",
      title: "Integration Tests & GitHub CI",
      description: "Validate end-to-end user flows and verify zero lint or build errors.",
      assigneeName: "Team Leader",
      priority: "P2",
      status: "REVIEW",
    },
  ]);

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"P0" | "P1" | "P2">("P1");
  const [copiedRepoIndex, setCopiedRepoIndex] = useState<number | null>(null);

  const handleAdvanceTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const nextStatus =
          t.status === "BACKLOG"
            ? "IN_PROGRESS"
            : t.status === "IN_PROGRESS"
            ? "REVIEW"
            : t.status === "REVIEW"
            ? "DONE"
            : "BACKLOG";
        return { ...t, status: nextStatus };
      })
    );
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: KanbanTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || undefined,
      assigneeName: newTaskAssignee.trim() || profile?.name || "Teammate",
      priority: newTaskPriority,
      status: "BACKLOG",
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTaskTitle("");
    setNewTaskDesc("");
    setShowAddTaskModal(false);
  };

  const handleCopyRepo = (cmd: string, idx: number) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(cmd);
      setCopiedRepoIndex(idx);
      setTimeout(() => setCopiedRepoIndex(null), 2500);
    }
  };

  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      alert("File size exceeds 12MB limit. Please choose a smaller file or provide a link.");
      return;
    }

    const isVideo = file.type.startsWith("video/");
    setShowMediaInput(isVideo ? "video" : "image");

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setMediaUrlInput(result);
    };
    reader.readAsDataURL(file);
  };

  const isLeader = user?.uid === group?.leader_id || members.some((m) => m.user_id === user?.uid && m.role === "LEADER");

  const loadGroupDetails = async () => {
    try {
      const res = await fetch(`/api/edbuild/groups/${groupId}`);
      const data = await res.json();
      if (data.success) {
        setGroup(data.group);
        setMembers(data.members || []);
        setMessages(data.messages || []);
        setCertificates(data.certificates || []);
        if (data.group.submission_repo_url) setRepoUrl(data.group.submission_repo_url);
        if (data.group.submission_live_url) setLiveUrl(data.group.submission_live_url);
        if (data.group.submission_notes) setNotes(data.group.submission_notes);
      }
    } catch (err) {
      console.warn("Failed to load group details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      loadGroupDetails();
      const interval = setInterval(loadGroupDetails, 5000); // Poll for live chat updates
      return () => clearInterval(interval);
    }
  }, [groupId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Send message handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() && !mediaUrlInput.trim()) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/edbuild/groups/${groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: user?.uid,
          sender_name: profile?.name || user?.name || "Teammate",
          sender_avatar: (profile as any)?.avatar_url || (profile as any)?.photo_url,
          message_type: showMediaInput ? showMediaInput : "text",
          content: messageText.trim(),
          media_url: mediaUrlInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setMessageText("");
        setMediaUrlInput("");
        setShowMediaInput(null);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Submit project handler
  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setIsSubmittingProject(true);
    try {
      const res = await fetch(`/api/edbuild/groups/${groupId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.uid,
          submission_repo_url: repoUrl,
          submission_live_url: liveUrl,
          submission_notes: notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmissionSuccess(true);
        loadGroupDetails();
      } else {
        alert(data.error || "Failed to submit project");
      }
    } catch (err: any) {
      alert(err.message || "Network error");
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleCopyKey = () => {
    if (group?.join_key && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(group.join_key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  // Find user's certificate if approved
  const myCertificate = certificates.find((c) => c.user_id === user?.uid);

  return (
    <AuthGuard>
      <div className="w-full text-white font-sans space-y-6 animate-in fade-in duration-200">
        
        {/* Top Navigation Bar */}
        <header className="tactile-chassis bg-[#0C101A] border border-white/10 rounded-2xl sticky top-18 sm:top-20 z-30 px-4 sm:px-6 py-3 shadow-xl text-white">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <Link
              href="/edbuild"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to EdBuild Hub</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono border ${
                group?.status === "APPROVED"
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                  : group?.status === "PENDING_REVIEW"
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                  : "bg-blue-500/10 text-blue-300 border-blue-500/20"
              }`}>
                {group?.status || "OPEN"}
              </span>

              {group?.access_type === "private" && group.join_key && (
                <button
                  onClick={handleCopyKey}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0F1422] border border-white/10 text-xs font-mono font-semibold text-white hover:border-white/25 transition-colors cursor-pointer"
                  title="Copy Join Key"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{group.join_key}</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Workspace Grid */}
        <div className="w-full space-y-6">
          
          {/* APPROVED CERTIFICATE HERO BANNER */}
          {group?.status === "APPROVED" && (
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-display">
                    Official Project Verification Accepted!
                  </h2>
                  <p className="text-xs text-emerald-300 mt-0.5 font-normal">
                    Your team submission for <strong>{group.name}</strong> was reviewed and approved. Official Certificates of Completion have been generated.
                  </p>
                </div>
              </div>

              {myCertificate ? (
                <Link
                  href={`/verify/${myCertificate.certificate_code}`}
                  className="bg-white hover:bg-slate-200 text-slate-950 text-xs font-bold py-2.5 px-4 rounded-xl shadow-md inline-flex items-center gap-2 shrink-0 transition-all cursor-pointer"
                >
                  <Award className="w-4 h-4 text-slate-950" />
                  <span>View &amp; Download My Certificate</span>
                </Link>
              ) : (
                <span className="text-xs font-medium text-emerald-300">
                  Certificates dispatched to all registered member emails!
                </span>
              )}
            </div>
          )}

          {/* Project Header Info */}
          <section className="edworld-blue-card tactile-chassis  rounded-2xl border border-white/10 p-5 sm:p-6 shadow-xl space-y-2 text-white">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-white">{group?.access_type === "private" ? "Private Squad" : "Public Squad"}</span>
              <span>&bull;</span>
              <span>Team Size: {members.length} / {group?.team_size}</span>
              {members.length >= (group?.team_size || 0) && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Room Full
                </span>
              )}
              <span>&bull;</span>
              <span>Team Leader: <strong className="text-white">{group?.leader_name}</strong></span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-display">
              {group?.name || "Loading Workspace..."}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {group?.problem_statement}
            </p>

            {/* Live Teammate Presence Avatars */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400">Live Presence:</span>
                <div className="flex items-center -space-x-1.5">
                  {members.map((m) => (
                    <div
                      key={m.user_id}
                      className="relative group cursor-pointer"
                      title={`${m.name} (${m.role === "LEADER" ? "Leader" : "Contributor"}) • Online`}
                    >
                      {m.avatar_url ? (
                        <img
                          src={m.avatar_url}
                          alt={m.name}
                          className="w-7 h-7 rounded-full object-cover border-2 border-[#0C101A] ring-1 ring-white/20"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] font-bold border-2 border-[#0C101A] ring-1 ring-white/20">
                          {m.name.charAt(0)}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-[#0C101A]" />
                    </div>
                  ))}
                </div>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1 ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {members.length} Squad Active
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("kanban");
                    setShowAddTaskModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-950" />
                  <span>New Sprint Task</span>
                </button>
              </div>
            </div>
          </section>

          {/* Two-Column Workspace Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT / CENTER: WORKSPACE HUB (8 cols) */}
            <div className="lg:col-span-8 space-y-3">
              
              {/* Workspace Navigation Tabs */}
              <div className="flex items-center gap-1 p-1 bg-[#0C101A] border border-white/10 rounded-2xl shadow-xl">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "chat" ? "bg-white text-slate-950 shadow-md font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Discussion &amp; Media</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === "chat" ? "bg-slate-200 text-slate-950" : "bg-white/10 text-slate-300"
                  }`}>
                    {messages.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("kanban")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "kanban" ? "bg-white text-slate-950 shadow-md font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>Sprint Kanban Board</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === "kanban" ? "bg-slate-200 text-slate-950" : "bg-white/10 text-slate-300"
                  }`}>
                    {tasks.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("repos")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "repos" ? "bg-white text-slate-950 shadow-md font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Starter Repositories</span>
                </button>
              </div>

              {/* TAB 1: CHAT & MEDIA CHANNEL */}
              {activeTab === "chat" && (
                <div className="bg-[#0C101A] rounded-2xl border border-white/10 shadow-xl flex flex-col h-[650px] overflow-hidden animate-in fade-in duration-150">
                  {/* Chat Header */}
                  <div className="p-3.5 sm:p-4 border-b border-white/10 bg-[#0F1422] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-white font-display">Team Chat &amp; Media Channel</span>
                      <span className="text-[11px] text-slate-400">({messages.length} messages)</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Share text, photos &amp; video demos</span>
                  </div>

                  {/* Chat Messages Stream */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#080B11]">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-400 space-y-2">
                        <Users className="w-8 h-8 text-slate-600" />
                        <p className="text-white font-semibold">No messages yet in this team workspace.</p>
                        <p className="text-[11px] text-slate-400">Say hi to your teammates to start collaborating!</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.sender_id === user?.uid;
                        const isSystem = msg.message_type === "system";

                        if (isSystem) {
                          return (
                            <div key={msg.id} className="p-2.5 rounded-lg bg-[#0F1422] border border-white/10 text-center text-[11px] text-slate-400 font-medium leading-relaxed">
                              {msg.content}
                            </div>
                          );
                        }

                        return (
                          <div
                            key={msg.id}
                            className={`flex items-start gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                          >
                            {/* Avatar */}
                            {msg.sender_avatar ? (
                              <img
                                src={msg.sender_avatar}
                                alt=""
                                className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/10"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-white text-slate-950 flex items-center justify-center text-xs font-bold shrink-0">
                                {msg.sender_name.charAt(0)}
                              </div>
                            )}

                            {/* Message Bubble */}
                            <div className={`max-w-[80%] space-y-1 ${isMe ? "items-end" : "items-start"}`}>
                              <div className={`flex items-center gap-1.5 text-[10px] text-slate-400 ${isMe ? "justify-end" : "justify-start"}`}>
                                <span className="font-semibold text-white">{msg.sender_name}</span>
                                <span>&bull;</span>
                                <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>

                              <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                isMe
                                  ? "bg-indigo-600 text-white rounded-tr-xs"
                                  : "bg-[#0F1422] text-slate-200 border border-white/10 rounded-tl-xs"
                              }`}>
                                {/* Text Content */}
                                {msg.content && <p className="whitespace-pre-line">{msg.content}</p>}

                                {/* Photo / Image Media */}
                                {msg.message_type === "image" && msg.media_url && (
                                  <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
                                    <img
                                      src={msg.media_url}
                                      alt="Shared photo"
                                      className="max-h-60 w-auto object-contain rounded"
                                    />
                                  </div>
                                )}

                                {/* Video Media */}
                                {msg.message_type === "video" && msg.media_url && (
                                  <div className="mt-2 rounded-lg overflow-hidden border border-white/10 max-w-sm">
                                    {msg.media_url.endsWith(".mp4") || msg.media_url.endsWith(".webm") ? (
                                      <video controls className="w-full rounded">
                                        <source src={msg.media_url} />
                                      </video>
                                    ) : (
                                      <a
                                        href={msg.media_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-3 bg-white/5 rounded flex items-center gap-2 text-xs font-semibold hover:underline text-cyan-300"
                                      >
                                        <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                                        <span>Watch Shared Video Demo</span>
                                        <ExternalLink className="w-3 h-3 ml-auto text-slate-400" />
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Hidden file input for native camera/gallery upload */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={showMediaInput === "video" ? "video/*" : "image/*"}
                    className="hidden"
                    onChange={handleLocalFileSelect}
                  />

                  {/* Media URL / Upload Input Drawer if opened */}
                  {showMediaInput && (
                    <div className="p-3 bg-[#0F1422] border-t border-white/10 flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/15 border border-white/15 text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{showMediaInput === "image" ? "Upload Photo" : "Upload Video"}</span>
                        </button>
                        <span className="text-[11px] text-slate-400">or paste URL:</span>
                      </div>

                      <input
                        type="url"
                        placeholder={showMediaInput === "image" ? "https://.../photo.png" : "https://.../demo.mp4"}
                        value={mediaUrlInput.startsWith("data:") ? "[Local file selected]" : mediaUrlInput}
                        onChange={(e) => setMediaUrlInput(e.target.value)}
                        disabled={mediaUrlInput.startsWith("data:")}
                        className="flex-1 min-w-[200px] px-2.5 py-1.5 text-xs bg-[#080B11] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                      />

                      {mediaUrlInput && (
                        <div className="flex items-center gap-1.5">
                          {mediaUrlInput.startsWith("data:image") ? (
                            <img src={mediaUrlInput} alt="" className="w-7 h-7 rounded object-cover border border-white/10" />
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-semibold">Ready to send</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setMediaUrlInput("")}
                            className="text-xs text-rose-400 hover:underline px-1 cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setShowMediaInput(null);
                          setMediaUrlInput("");
                        }}
                        className="text-xs text-slate-400 hover:text-white px-2 py-1 ml-auto cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Chat Input Bar */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-[#0C101A] flex items-center gap-2">
                    {/* Photo Button */}
                    <button
                      type="button"
                      onClick={() => setShowMediaInput(showMediaInput === "image" ? null : "image")}
                      title="Send Photo"
                      className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                        showMediaInput === "image" ? "bg-white/15 border-white/30 text-white" : "bg-[#0F1422] border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>

                    {/* Video Button */}
                    <button
                      type="button"
                      onClick={() => setShowMediaInput(showMediaInput === "video" ? null : "video")}
                      title="Send Video Demo"
                      className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                        showMediaInput === "video" ? "bg-white/15 border-white/30 text-white" : "bg-[#0F1422] border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      <Video className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      placeholder="Type a message to your team..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-[#0F1422] border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-white/30"
                    />

                    <button
                      type="submit"
                      disabled={isSending || (!messageText.trim() && !mediaUrlInput.trim())}
                      className="p-2 rounded-lg bg-white hover:bg-slate-200 text-slate-950 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

          {/* TAB 2: KANBAN SPRINT BOARD */}
          {activeTab === "kanban" && (
            <div className="edworld-blue-card rounded-2xl border border-white/10 shadow-xl p-5 space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
                    <LayoutList className="w-4 h-4 text-cyan-400" />
                    <span>Interactive Squad Sprint Board</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-normal">
                    Track deliverables across sprint phases. Advance tasks as team milestones are completed.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddTaskModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Milestone Task</span>
                </button>
              </div>

              {/* 4 Kanban Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE"] as const).map((colStatus) => {
                  const colTasks = tasks.filter((t) => t.status === colStatus);
                  const colTitles = {
                    BACKLOG: "Backlog",
                    IN_PROGRESS: "In Progress",
                    REVIEW: "Code Review",
                    DONE: "Completed",
                  };
                  const colBadges = {
                    BACKLOG: "bg-white/10 text-slate-300",
                    IN_PROGRESS: "bg-indigo-500/20 text-indigo-300",
                    REVIEW: "bg-amber-500/20 text-amber-300",
                    DONE: "bg-emerald-500/20 text-emerald-300",
                  };

                  return (
                    <div key={colStatus} className="edworld-blue-card border border-white/10 rounded-2xl p-3 flex flex-col space-y-3 min-h-[380px]">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <span className="text-xs font-bold text-white">
                          {colTitles[colStatus]}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${colBadges[colStatus]}`}>
                          {colTasks.length}
                        </span>
                      </div>

                      <div className="space-y-2.5 flex-1">
                        {colTasks.length === 0 ? (
                          <div className="h-28 flex items-center justify-center text-center text-[11px] text-slate-500 border border-dashed border-white/10 rounded-xl">
                            No tasks
                          </div>
                        ) : (
                          colTasks.map((task) => (
                            <div
                              key={task.id}
                              className="bg-[#0C101A] border border-white/10 rounded-xl p-3.5 shadow-sm space-y-2 hover:border-white/25 transition-all"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black ${
                                  task.priority === "P0"
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                    : task.priority === "P1"
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                }`}>
                                  {task.priority}
                                </span>
                                <span className="text-[10px] font-medium text-slate-400 truncate max-w-[100px]">
                                  {task.assigneeName}
                                </span>
                              </div>

                              <h4 className="text-xs font-bold text-white leading-snug">
                                {task.title}
                              </h4>

                              {task.description && (
                                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                                <span className="text-[10px] text-slate-500 font-mono">
                                  #{task.id.slice(-4)}
                                </span>
                                <button
                                  onClick={() => handleAdvanceTask(task.id)}
                                  className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-0.5 cursor-pointer"
                                  title="Advance task to next milestone"
                                >
                                  <span>Advance</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: STARTER REPOSITORIES */}
          {activeTab === "repos" && (
            <div className="edworld-blue-card rounded-2xl border border-white/10 shadow-xl p-5 space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
                  <GitBranch className="w-4 h-4 text-cyan-400" />
                  <span>Verified GitHub Starter Repositories</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-normal">
                  Kickstart your team&apos;s project architecture using verified starter skeletons pre-configured with linting, testing, and modern stacks.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {STARTER_REPOSITORIES.map((repo, idx) => {
                  const isCopied = copiedRepoIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#0F1422] border border-white/10 flex flex-col justify-between space-y-3 hover:border-white/25 transition-all shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0C101A] text-cyan-300 border border-white/10">
                            {repo.tag}
                          </span>
                          <a
                            href={repo.repo}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-white inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                          >
                            <span>GitHub</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        <h3 className="text-sm font-bold text-white leading-snug">
                          {repo.name}
                        </h3>

                        <p className="text-xs text-slate-300 leading-relaxed font-normal">
                          {repo.desc}
                        </p>

                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {repo.stack.map((stk, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 rounded text-[10px] bg-[#0C101A] border border-white/10 text-slate-300 font-mono"
                            >
                              {stk}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/10">
                        <button
                          onClick={() => handleCopyRepo(repo.cloneCmd, idx)}
                          className="w-full py-2 px-3 rounded-xl bg-[#0C101A] hover:bg-white/10 text-white text-xs font-mono font-bold border border-white/10 transition-all flex items-center justify-between cursor-pointer"
                        >
                          <span className="truncate mr-2 text-[11px]">{repo.cloneCmd}</span>
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
            <div className="lg:col-span-4 space-y-5">
              
              {/* Team Members Panel */}
              <div className="edworld-blue-card rounded-2xl border border-white/10 p-4 sm:p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-display">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Team Roster ({members.length}/{group?.team_size})</span>
                  </h3>
                </div>

                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.user_id}
                      className="p-2.5 rounded-xl bg-[#0F1422] border border-white/10 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/10"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-white text-slate-950 flex items-center justify-center text-xs font-bold shrink-0">
                            {member.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate">
                            {member.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {member.role === "LEADER" ? "Team Leader" : "Contributor"}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/u/${member.user_id}/portfolio`}
                        title="View Public Portfolio"
                        className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline shrink-0 inline-flex items-center gap-1"
                      >
                        <span>Portfolio</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Submission Panel */}
              <div className="edworld-blue-card rounded-2xl border border-white/10 p-4 sm:p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-display">
                    <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Project Completion &amp; Review</span>
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    group?.status === "APPROVED" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/10 text-slate-300 border border-white/10"
                  }`}>
                    {group?.status}
                  </span>
                </div>

                {group?.status === "APPROVED" ? (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 space-y-2">
                    <p className="font-semibold flex items-center gap-1.5 text-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Project Approved &amp; Certified!</span>
                    </p>
                    <p className="text-[11px] text-emerald-300/90 leading-relaxed font-normal">
                      The EdWorld Co. evaluation team accepted your project. Verified certificates have been issued.
                    </p>
                    {myCertificate && (
                      <Link
                        href={`/verify/${myCertificate.certificate_code}`}
                        className="w-full mt-2 py-1.5 px-3 bg-white hover:bg-slate-200 text-slate-950 text-xs font-bold rounded-lg inline-flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>View My Certificate</span>
                      </Link>
                    )}
                  </div>
                ) : group?.status === "PENDING_REVIEW" ? (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300 space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5 text-amber-200">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Pending Evaluation Review</span>
                    </p>
                    <p className="text-[11px] text-amber-300/90 leading-relaxed font-normal">
                      Your project link was submitted to the review board. You will receive an email notification when certificates are issued.
                    </p>
                    {group.submission_repo_url && (
                      <a
                        href={group.submission_repo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-mono text-cyan-300 hover:underline block truncate mt-1"
                      >
                        Repo: {group.submission_repo_url}
                      </a>
                    )}
                  </div>
                ) : isLeader ? (
                  /* Leader Submission Form */
                  <form onSubmit={handleSubmitProject} className="space-y-3 pt-1">
                    <p className="text-xs text-slate-400 font-normal">
                      As Team Leader, when your squad completes the project, submit your repository and live demo for official verification.
                    </p>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-white">GitHub Repository URL *</label>
                      <input
                        type="url"
                        required
                        placeholder="https://github.com/..."
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-[#0F1422] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-white">Live Demo / Video URL</label>
                      <input
                        type="url"
                        placeholder="https://... or YouTube/Loom link"
                        value={liveUrl}
                        onChange={(e) => setLiveUrl(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-[#0F1422] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-white">Completion Summary</label>
                      <textarea
                        rows={2}
                        placeholder="Key features built and tested..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-[#0F1422] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingProject || !repoUrl.trim()}
                      className="w-full py-2 px-3 rounded-lg bg-white hover:bg-slate-200 text-slate-950 text-xs font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingProject ? "Submitting for Review..." : "Submit Project for Review"}
                    </button>
                  </form>
                ) : (
                  <p className="text-xs text-slate-400 font-normal">
                    Only the designated Team Leader (<strong>{group?.leader_name}</strong>) can submit the final repository link for review.
                  </p>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* ADD SPRINT TASK MODAL */}
        {showAddTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
            <div 
              className="bg-[#0C101A] border border-white/15 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white font-display">New Milestone Task</h3>
                  <p className="text-xs text-slate-400 font-normal">Add a squad deliverable to the Kanban sprint board.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-white">Task Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Implement OAuth authentication flow"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0F1422] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-white/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-white">Description / Acceptance Criteria</label>
                  <textarea
                    rows={3}
                    placeholder="Deliverables and verification criteria..."
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0F1422] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-white/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-white">Assignee</label>
                    <select
                      value={newTaskAssignee}
                      onChange={(e) => setNewTaskAssignee(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0F1422] border border-white/10 text-white focus:outline-none focus:border-white/30 cursor-pointer"
                    >
                      <option value="" className="bg-[#0C101A] text-white">Select teammate...</option>
                      {members.map((m) => (
                        <option key={m.user_id} value={m.name} className="bg-[#0C101A] text-white">
                          {m.name} ({m.role === "LEADER" ? "Leader" : "Member"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-white">Priority</label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0F1422] border border-white/10 text-white focus:outline-none focus:border-white/30 cursor-pointer"
                    >
                      <option value="P0" className="bg-[#0C101A] text-white">P0 - Blocker / Critical</option>
                      <option value="P1" className="bg-[#0C101A] text-white">P1 - High Priority</option>
                      <option value="P2" className="bg-[#0C101A] text-white">P2 - Normal</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTaskModal(false)}
                    className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 font-bold hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-bold shadow-sm transition-all cursor-pointer"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AuthGuard>
  );
}

