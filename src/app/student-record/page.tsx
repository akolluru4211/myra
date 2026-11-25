"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AuthGuard from "@/components/auth/AuthGuard";
import {
  GraduationCap,
  Calendar,
  BookOpen,
  Award,
  FolderGit2,
  Briefcase,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  Paperclip,
  Upload,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ChevronRight,
  X,
  Mail,
} from "lucide-react";

type RecordTab = "marks" | "events" | "study_notes" | "certificates" | "projects" | "applications";

export default function StudentRecordPage() {
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as RecordTab) || "marks";
  const [activeTab, setActiveTab] = useState<RecordTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  // Data states
  const [marks, setMarks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [addMarkOpen, setAddMarkOpen] = useState(false);
  const [markSubject, setMarkSubject] = useState("");
  const [markAssessment, setMarkAssessment] = useState("");
  const [markScore, setMarkScore] = useState<number | string>("");
  const [markMax, setMarkMax] = useState<number | string>(100);
  const [markSemester, setMarkSemester] = useState("");
  const [markSaving, setMarkSaving] = useState(false);

  const [addEventOpen, setAddEventOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState<string>("workshop");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventTz, setEventTz] = useState("Asia/Kolkata");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventSaving, setEventSaving] = useState(false);

  const [addCertOpen, setAddCertOpen] = useState(false);
  const [certTitle, setCertTitle] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [certDate, setCertDate] = useState("");
  const [certUrl, setCertUrl] = useState("");
  const [certSaving, setCertSaving] = useState(false);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "marks") {
        const res = await fetch("/api/edmail/records/marks");
        const data = await res.json();
        if (data.marks) setMarks(data.marks);
      } else if (activeTab === "events") {
        const res = await fetch("/api/edmail/records/events");
        const data = await res.json();
        if (data.events) setEvents(data.events);
      } else if (activeTab === "study_notes") {
        const res = await fetch("/api/edmail/documents?category=study_material");
        const data = await res.json();
        if (data.documents) setNotes(data.documents);
      } else if (activeTab === "certificates") {
        const res = await fetch("/api/student-record/certificates");
        const data = await res.json();
        if (data.certificates) setCertificates(data.certificates);
      } else if (activeTab === "projects") {
        const res = await fetch("/api/student-record/projects");
        const data = await res.json();
        if (data.projects) setProjects(data.projects);
      } else if (activeTab === "applications") {
        const res = await fetch("/api/student-record/applications");
        const data = await res.json();
        if (data.applications) setApplications(data.applications);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Handlers
  const handleCreateMark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!markSubject || markScore === "") return;
    setMarkSaving(true);
    try {
      const res = await fetch("/api/edmail/records/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: markSubject,
          assessmentName: markAssessment || "Term Exam",
          score: Number(markScore),
          maxMarks: Number(markMax) || 100,
          termOrSemester: markSemester,
          source: "student_entered",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMarks((prev) => [data.mark, ...prev]);
        setAddMarkOpen(false);
        setMarkSubject("");
        setMarkAssessment("");
        setMarkScore("");
      }
    } catch {
      alert("Failed to save mark");
    } finally {
      setMarkSaving(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventStart) return;
    setEventSaving(true);
    try {
      const res = await fetch("/api/edmail/records/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventTitle,
          eventType,
          startTime: new Date(eventStart).toISOString(),
          endTime: eventEnd ? new Date(eventEnd).toISOString() : null,
          timezone: eventTz,
          locationOrLink: eventLocation,
          description: eventDesc,
          source: "manual",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) => [data.event, ...prev]);
        setAddEventOpen(false);
        setEventTitle("");
        setEventStart("");
      }
    } catch {
      alert("Failed to save event");
    } finally {
      setEventSaving(false);
    }
  };

  const handleCreateCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certTitle || !certIssuer) return;
    setCertSaving(true);
    try {
      const res = await fetch("/api/student-record/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: certTitle,
          issuer: certIssuer,
          issueDate: certDate,
          verificationUrl: certUrl,
          source: "upload",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCertificates((prev) => [data.certificate, ...prev]);
        setAddCertOpen(false);
        setCertTitle("");
        setCertIssuer("");
      }
    } catch {
      alert("Failed to save certificate");
    } finally {
      setCertSaving(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-blue-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 tracking-tight font-display">Student Record</span>
                <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-blue-200">
                  Private Vault
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/edmail"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#EFF6FF] hover:bg-indigo-100 text-indigo-700 flex items-center gap-1.5 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Open EdMail</span>
            </Link>
            <Link
              href="/dashboard"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-blue-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </header>

        {/* Workspace Hub */}
        <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 flex flex-col space-y-6">
          {/* Hero Banner */}
          <div className="bg-white rounded-3xl border border-blue-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 font-display">My Academic Organizer</h1>
              <p className="text-xs sm:text-sm text-slate-600">
                Your private student vault for marks, schedules, notes, and credentials. Save items with 1-click directly from EdMail.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeTab === "marks" && (
                <button
                  onClick={() => setAddMarkOpen(true)}
                  className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Marks</span>
                </button>
              )}
              {activeTab === "events" && (
                <button
                  onClick={() => setAddEventOpen(true)}
                  className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Event</span>
                </button>
              )}
              {activeTab === "certificates" && (
                <button
                  onClick={() => setAddCertOpen(true)}
                  className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Certificate</span>
                </button>
              )}
            </div>
          </div>

          {/* 6 Labeled Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-blue-200 overflow-x-auto">
            {[
              { id: "marks", label: "Marks & Grades", icon: GraduationCap },
              { id: "events", label: "Events & Calendar", icon: Calendar },
              { id: "study_notes", label: "Study Files", icon: BookOpen },
              { id: "certificates", label: "Certificates", icon: Award },
              { id: "projects", label: "Projects", icon: FolderGit2 },
              { id: "applications", label: "Applications", icon: Briefcase },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as RecordTab)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 bg-white rounded-3xl border border-blue-200 p-6 shadow-xs">
            {loading ? (
              <div className="py-16 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                <span className="text-xs text-slate-500">Loading records...</span>
              </div>
            ) : (
              <>
                {/* 1. MARKS TAB */}
                {activeTab === "marks" && (
                  <div className="space-y-4">
                    {marks.length === 0 ? (
                      <div className="py-12 text-center space-y-2">
                        <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
                        <h3 className="text-sm font-bold text-slate-800">No marks recorded yet</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Add exam results manually or save mark sheets directly from EdMail attachments.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {marks.map((m) => (
                          <div key={m.id} className="py-3.5 flex items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">{m.subject}</span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    m.is_verified
                                      ? "bg-[#EFF6FF] text-[#1E40AF] border-blue-200"
                                      : "bg-slate-100 text-slate-600 border-blue-200"
                                  }`}
                                >
                                  {m.is_verified ? "Institution-verified" : "Student-entered"}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500">
                                {m.assessment_name} {m.term_or_semester ? `• ${m.term_or_semester}` : ""}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-base font-black text-slate-900 font-display">
                                {m.score} / {m.max_marks}
                              </div>
                              <div className="text-xs font-bold text-indigo-600">Grade: {m.grade || "A"}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. EVENTS TAB */}
                {activeTab === "events" && (
                  <div className="space-y-4">
                    {events.length === 0 ? (
                      <div className="py-12 text-center space-y-2">
                        <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                        <h3 className="text-sm font-bold text-slate-800">No events scheduled</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Schedule classes, workshops, and competitions or save invitations from EdMail.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {events.map((ev) => (
                          <div key={ev.id} className="py-3.5 flex items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">{ev.title}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-indigo-700 border border-blue-200 uppercase">
                                  {ev.event_type}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-3">
                                <span>{new Date(ev.start_time).toLocaleString()} ({ev.timezone || "Asia/Kolkata"})</span>
                                {ev.location_or_link && (
                                  <span className="truncate max-w-xs text-slate-400">📍 {ev.location_or_link}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <a
                                href={`/api/edmail/records/events?id=${ev.id}&export=ics`}
                                download={`${ev.title.replace(/[^a-z0-9]/gi, "_")}.ics`}
                                className="px-2.5 py-1.5 rounded-xl border border-blue-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1 transition-colors"
                                title="Download .ics calendar event"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>.ics</span>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. STUDY FILES TAB */}
                {activeTab === "study_notes" && (
                  <div className="space-y-4">
                    {notes.length === 0 ? (
                      <div className="py-12 text-center space-y-2">
                        <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                        <h3 className="text-sm font-bold text-slate-800">No study files saved</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Organize course notes, lecture PDFs, and assignments securely.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notes.map((n) => (
                          <div key={n.id} className="py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-indigo-600 flex items-center justify-center">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900">{n.title}</div>
                                <div className="text-[10px] text-slate-400">{n.filename} • {(n.byte_size / 1024).toFixed(1)} KB</div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {n.category}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. CERTIFICATES TAB */}
                {activeTab === "certificates" && (
                  <div className="space-y-4">
                    {certificates.length === 0 ? (
                      <div className="py-12 text-center space-y-2">
                        <Award className="w-10 h-10 text-slate-300 mx-auto" />
                        <h3 className="text-sm font-bold text-slate-800">No certificates stored</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Upload course completions or save verified certificates directly from EdMail.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {certificates.map((c) => (
                          <div key={c.id} className="py-3.5 flex items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">{c.title}</span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    c.is_verified
                                      ? "bg-[#EFF6FF] text-[#1E40AF] border-blue-200"
                                      : "bg-slate-100 text-slate-600 border-blue-200"
                                  }`}
                                >
                                  {c.is_verified ? "Institution Verified" : "Personal Copy"}
                                </span>
                                {c.is_published && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-indigo-700 border border-blue-200">
                                    In Portfolio
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500">
                                Issued by {c.issuer} {c.issue_date ? `• ${c.issue_date}` : ""}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
                                  const newStatus = !c.is_published;
                                  try {
                                    const res = await fetch("/api/student-record/portfolio", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        itemType: "certificate",
                                        itemId: c.id,
                                        isPublished: newStatus,
                                      }),
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setCertificates((prev) =>
                                        prev.map((item) => (item.id === c.id ? { ...item, is_published: newStatus } : item))
                                      );
                                    }
                                  } catch {}
                                }}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                                  c.is_published
                                    ? "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                                    : "bg-[#EFF6FF] text-indigo-700 border-blue-200 hover:bg-indigo-100"
                                }`}
                              >
                                {c.is_published ? "Revoke Link" : "Include in portfolio"}
                              </button>
                              {c.verification_url && (
                                <a
                                  href={c.verification_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-xl text-indigo-600 hover:bg-[#EFF6FF]"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. PROJECTS TAB */}
                {activeTab === "projects" && (
                  <div className="space-y-4">
                    {projects.length === 0 ? (
                      <div className="py-12 text-center space-y-2">
                        <FolderGit2 className="w-10 h-10 text-slate-300 mx-auto" />
                        <h3 className="text-sm font-bold text-slate-800">No projects added</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Track your portfolio projects, tech stacks, and GitHub repositories.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {projects.map((p) => (
                          <div key={p.id} className="py-3.5 flex items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">{p.title}</span>
                                {p.is_published && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1E40AF] border border-blue-200">
                                    Published in Portfolio
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500">{p.description}</div>
                              <div className="flex items-center gap-1.5 pt-1">
                                {p.tech_stack?.map((t: string, i: number) => (
                                  <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
                                  const newStatus = !p.is_published;
                                  try {
                                    const res = await fetch("/api/student-record/portfolio", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        itemType: "project",
                                        itemId: p.id,
                                        isPublished: newStatus,
                                      }),
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setProjects((prev) =>
                                        prev.map((item) => (item.id === p.id ? { ...item, is_published: newStatus } : item))
                                      );
                                    }
                                  } catch {}
                                }}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                                  p.is_published
                                    ? "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                                    : "bg-[#EFF6FF] text-[#1E40AF] border-blue-200 hover:bg-emerald-100"
                                }`}
                              >
                                {p.is_published ? "Revoke Link" : "Include in portfolio"}
                              </button>
                              {p.github_url && (
                                <a
                                  href={p.github_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 6. APPLICATIONS TAB */}
                {activeTab === "applications" && (
                  <div className="space-y-4">
                    {applications.length === 0 ? (
                      <div className="py-12 text-center space-y-2">
                        <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
                        <h3 className="text-sm font-bold text-slate-800">No applications tracked</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Keep track of jobs and internships you applied to across companies.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {applications.map((app) => (
                          <div key={app.id} className="py-3.5 flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="text-sm font-bold text-slate-900">{app.role_title}</div>
                              <div className="text-xs text-slate-500">{app.company} • Applied {app.applied_date}</div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                              {app.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* MODAL: ADD MARK */}
        {addMarkOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl border border-blue-200 p-6 max-w-md w-full shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 font-display">Add Assessment Result</h3>
                <button onClick={() => setAddMarkOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateMark} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">Subject</label>
                  <input
                    type="text"
                    required
                    value={markSubject}
                    onChange={(e) => setMarkSubject(e.target.value)}
                    placeholder="e.g. Data Structures"
                    className="w-full mt-1 px-3 py-2 text-xs border border-blue-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">Assessment Name</label>
                  <input
                    type="text"
                    value={markAssessment}
                    onChange={(e) => setMarkAssessment(e.target.value)}
                    placeholder="e.g. Midterm Examination"
                    className="w-full mt-1 px-3 py-2 text-xs border border-blue-200 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">Score</label>
                    <input
                      type="number"
                      required
                      value={markScore}
                      onChange={(e) => setMarkScore(e.target.value)}
                      placeholder="85"
                      className="w-full mt-1 px-3 py-2 text-xs border border-blue-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">Maximum Marks</label>
                    <input
                      type="number"
                      value={markMax}
                      onChange={(e) => setMarkMax(e.target.value)}
                      placeholder="100"
                      className="w-full mt-1 px-3 py-2 text-xs border border-blue-200 rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">Semester / Term</label>
                  <input
                    type="text"
                    value={markSemester}
                    onChange={(e) => setMarkSemester(e.target.value)}
                    placeholder="Semester 4"
                    className="w-full mt-1 px-3 py-2 text-xs border border-blue-200 rounded-xl"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddMarkOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={markSaving}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                  >
                    {markSaving ? "Saving..." : "Save Marks"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD EVENT */}
        {addEventOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl border border-blue-200 p-6 max-w-md w-full shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 font-display">Schedule Academic Event</h3>
                <button onClick={() => setAddEventOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">Event Title</label>
                  <input
                    type="text"
                    required
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="e.g. AI & ML Workshop"
                    className="w-full mt-1 px-3 py-2 text-xs border border-blue-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs border border-blue-200 rounded-xl bg-white"
                  >
                    <option value="workshop">Workshop</option>
                    <option value="class">Class</option>
                    <option value="exam">Exam</option>
                    <option value="competition">Competition</option>
                    <option value="deadline">Deadline</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs border border-blue-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">Location / Meeting Link</label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full mt-1 px-3 py-2 text-xs border border-blue-200 rounded-xl"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddEventOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={eventSaving}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                  >
                    {eventSaving ? "Saving..." : "Save Event"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD CERTIFICATE */}
        {addCertOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl border border-blue-200 p-6 max-w-md w-full shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 font-display">Add Certificate Record</h3>
                <button onClick={() => setAddCertOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCert} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">Certificate Title</label>
                  <input
                    type="text"
                    required
                    value={certTitle}
                    onChange={(e) => setCertTitle(e.target.value)}
                    placeholder="e.g. AWS Cloud Practitioner"
                    className="w-full mt-1 px-3 py-2 text-xs border border-blue-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">Issuer</label>
                  <input
                    type="text"
                    required
                    value={certIssuer}
                    onChange={(e) => setCertIssuer(e.target.value)}
                    placeholder="e.g. Amazon Web Services"
                    className="w-full mt-1 px-3 py-2 text-xs border border-blue-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">Verification URL</label>
                  <input
                    type="url"
                    value={certUrl}
                    onChange={(e) => setCertUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full mt-1 px-3 py-2 text-xs border border-blue-200 rounded-xl"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddCertOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={certSaving}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                  >
                    {certSaving ? "Saving..." : "Save Certificate"}
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
