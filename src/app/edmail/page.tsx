"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Mail,
  Inbox,
  Send,
  FileText,
  Star,
  Archive,
  Trash2,
  AlertOctagon,
  Search,
  Plus,
  RefreshCw,
  Folder,
  Tag,
  Paperclip,
  ArrowLeft,
  Reply,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Award,
  BookOpen,
  Sparkles,
  Download,
  Upload,
  Calendar,
  GraduationCap,
  Clock,
  MapPin,
  ExternalLink,
  ChevronRight,
  X,
  Loader2,
  Menu,
  Check,
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import { EDMAIL_DOMAIN } from "@/lib/edmail/edmail-constants";

type MailFolder = "inbox" | "sent" | "drafts" | "starred" | "archive" | "trash" | "spam";
type RecordTab = "marks" | "events" | "study_files" | "certificates";

export default function EdMailWebmailPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  // Top Section Navigation: 'webmail' | 'student_records' | 'discounts'
  const [activeSection, setActiveSection] = useState<"webmail" | "student_records" | "discounts">("webmail");
  const [activeRecordTab, setActiveRecordTab] = useState<RecordTab>("marks");

  // Mailbox State
  const [mailboxStatus, setMailboxStatus] = useState<"loading" | "unregistered" | "ready" | "failed">("loading");
  const [mailbox, setMailbox] = useState<any>(null);

  // Mail UI State
  const [currentFolder, setCurrentFolder] = useState<MailFolder>("inbox");
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Student Records State
  const [marks, setMarks] = useState<any[]>([]);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Quick Action Dialogs for Saving from Message
  const [saveToMarksModalOpen, setSaveToMarksModalOpen] = useState(false);
  const [markSubject, setMarkSubject] = useState("");
  const [markAssessment, setMarkAssessment] = useState("");
  const [markScore, setMarkScore] = useState<number | string>("");
  const [markMax, setMarkMax] = useState<number | string>(100);
  const [markGrade, setMarkGrade] = useState("");
  const [savingMark, setSavingMark] = useState(false);

  const [saveToEventModalOpen, setSaveToEventModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState<"workshop" | "class" | "exam" | "competition" | "deadline">("workshop");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [savingEvent, setSavingEvent] = useState(false);

  const [saveCertModalOpen, setSaveCertModalOpen] = useState(false);
  const [certTitle, setCertTitle] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [certVerifyLink, setCertVerifyLink] = useState("");
  const [savingCert, setSavingCert] = useState(false);

  // Document Upload Modal (Study Files)
  const [uploadDocModalOpen, setUploadDocModalOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocCategory, setNewDocCategory] = useState<"study_material" | "certificate" | "resume">("study_material");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBcc, setComposeBcc] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeFiles, setComposeFiles] = useState<File[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composeSuccess, setComposeSuccess] = useState<string | null>(null);

  // Activation State
  const [activationUsername, setActivationUsername] = useState("");
  const [usernameAvailability, setUsernameAvailability] = useState<{ available: boolean; error?: string } | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [activatingMailbox, setActivatingMailbox] = useState(false);
  const [activationError, setActivationError] = useState<{
    message: string;
    action?: "signin" | "change_username" | "retry";
  } | null>(null);
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);

  // Mobile sidebar
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. Fetch Mailbox Status
  const fetchMailbox = async () => {
    try {
      const res = await fetch("/api/edmail/mailbox");
      const data = await res.json();
      if (data.exists && data.mailbox) {
        setMailbox(data.mailbox);
        setMailboxStatus("ready");
      } else {
        setMailboxStatus("unregistered");
        if (profile?.username) {
          setActivationUsername(profile.username);
        }
      }
    } catch {
      setMailboxStatus("unregistered");
    }
  };

  useEffect(() => {
    fetchMailbox();
  }, [user, profile]);

  // 2. Fetch Messages
  const fetchMessages = async () => {
    if (mailboxStatus !== "ready") return;
    setLoadingMessages(true);
    try {
      let url = `/api/edmail/messages?folder=${currentFolder}`;
      if (selectedLabel) url += `&label=${encodeURIComponent(selectedLabel)}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        if (data.unreadCounts) setUnreadCounts(data.unreadCounts);
      }
    } catch (e) {
      console.warn("Failed to load messages", e);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (mailboxStatus === "ready") {
      fetchMessages();
    }
  }, [mailboxStatus, currentFolder, selectedLabel]);

  // 3. Fetch Records: Marks, Events, Documents
  const fetchMarks = async () => {
    setLoadingMarks(true);
    try {
      const res = await fetch("/api/edmail/records/marks");
      const data = await res.json();
      if (data.success) setMarks(data.marks || []);
    } catch (e) {
      console.warn("Failed to load marks", e);
    } finally {
      setLoadingMarks(false);
    }
  };

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch("/api/edmail/records/events");
      const data = await res.json();
      if (data.success) setEvents(data.events || []);
    } catch (e) {
      console.warn("Failed to load events", e);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const res = await fetch("/api/edmail/documents");
      const data = await res.json();
      if (data.success) setDocuments(data.documents || []);
    } catch (e) {
      console.warn("Failed to load documents", e);
    } finally {
      setLoadingDocuments(false);
    }
  };

  useEffect(() => {
    if (activeSection === "student_records") {
      if (activeRecordTab === "marks") fetchMarks();
      if (activeRecordTab === "events") fetchEvents();
      if (activeRecordTab === "study_files" || activeRecordTab === "certificates") fetchDocuments();
    }
  }, [activeSection, activeRecordTab]);

  // Handle Username Check Debounce
  useEffect(() => {
    if (!activationUsername || activationUsername.length < 3) {
      setUsernameAvailability(null);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await fetch(`/api/edmail/check-username?username=${encodeURIComponent(activationUsername)}`);
        const data = await res.json();
        setUsernameAvailability(data);
      } catch {
        setUsernameAvailability({ available: false, error: "Network check failed" });
      } finally {
        setCheckingUsername(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [activationUsername]);

  // Handle Mailbox Activation
  const handleActivateMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationUsername) return;
    setActivatingMailbox(true);
    setActivationError(null);
    setActivationSuccess(null);
    try {
      const res = await fetch("/api/edmail/mailbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: activationUsername,
          guardianConsent: true,
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        setActivationError({
          message: "Your session has expired or authentication is required. Please sign in again to activate your mailbox.",
          action: "signin",
        });
      } else if (res.status === 409) {
        setActivationError({
          message: data.error || `The address "${activationUsername}@${EDMAIL_DOMAIN}" was claimed by another student. Please choose a different username.`,
          action: "change_username",
        });
        setUsernameAvailability({ available: false, error: data.error || "Username claimed" });
      } else if (res.ok && data.success && data.mailbox) {
        setActivationSuccess(`EdMail address ${data.mailbox.address} is ready!`);
        setMailbox(data.mailbox);
        setMailboxStatus("ready");
      } else {
        setActivationError({
          message: data.error || "Provisioning service temporarily unavailable. Please retry in a few moments.",
          action: "retry",
        });
      }
    } catch (err: any) {
      setActivationError({
        message: err.message || "Network error occurred while connecting to provisioning service. Please retry.",
        action: "retry",
      });
    } finally {
      setActivatingMailbox(false);
    }
  };

  // Open Message Detail
  const handleOpenMessage = async (msg: any) => {
    setSelectedMessage(msg);
    try {
      const res = await fetch(`/api/edmail/messages/${msg.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedMessage(data.message);
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m))
        );
      }
    } catch (e) {
      console.warn("Failed to fetch full message", e);
    }
  };

  // Toggle Star
  const handleToggleStar = async (msgId: string, currentStarred: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch("/api/edmail/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageIds: [msgId],
          action: "star",
          value: !currentStarred,
        }),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, is_starred: !currentStarred } : m))
      );
      if (selectedMessage?.id === msgId) {
        setSelectedMessage({ ...selectedMessage, is_starred: !currentStarred });
      }
    } catch {}
  };

  // Dispatch Outbound Email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim()) {
      setComposeError("Please specify at least one recipient.");
      return;
    }

    setSendingEmail(true);
    setComposeError(null);
    setComposeSuccess(null);

    const idempotencyKey = `send_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      const toList = composeTo.split(",").map((s) => s.trim()).filter(Boolean);
      const ccList = composeCc ? composeCc.split(",").map((s) => s.trim()).filter(Boolean) : [];
      const bccList = composeBcc ? composeBcc.split(",").map((s) => s.trim()).filter(Boolean) : [];

      if (composeFiles.length > 10 || composeFiles.reduce((sum, file) => sum + file.size, 0) > 3 * 1024 * 1024) {
        setComposeError("Attach up to 10 files totaling 3 MB or less.");
        return;
      }
      const attachments = await Promise.all(composeFiles.map(async (file) => {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let binary = "";
        bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
        return { filename: file.name, content: btoa(binary) };
      }));
      const res = await fetch("/api/edmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: toList,
          cc: ccList,
          bcc: bccList,
          subject: composeSubject,
          bodyText: composeBody,
          attachments,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setComposeSuccess(`Message dispatched via provider! Status: ${data.deliveryStatus}`);
        setTimeout(() => {
          setIsComposeOpen(false);
          setComposeTo("");
          setComposeSubject("");
          setComposeBody("");
          setComposeFiles([]);
          setComposeSuccess(null);
          fetchMessages();
        }, 1200);
      } else {
        setComposeError(data.error || "Failed to deliver email.");
      }
    } catch (err: any) {
      setComposeError(err.message || "Network error while sending.");
    } finally {
      setSendingEmail(false);
    }
  };

  // Save to Marks Action
  const handleSaveToMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!markSubject || markScore === "") return;
    setSavingMark(true);
    try {
      const res = await fetch("/api/edmail/records/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: markSubject,
          assessmentName: markAssessment || "Term Exam",
          score: Number(markScore),
          maxMarks: Number(markMax) || 100,
          grade: markGrade || undefined,
          source: selectedMessage ? "email_attachment" : "student_entered",
          sourceMessageId: selectedMessage?.id || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveToMarksModalOpen(false);
        setMarkSubject("");
        setMarkAssessment("");
        setMarkScore("");
        alert("Saved to Marks in Student Record!");
        if (activeSection === "student_records" && activeRecordTab === "marks") {
          fetchMarks();
        }
      } else {
        alert(data.error || "Failed to save marks");
      }
    } catch (err: any) {
      alert(err.message || "Failed to save marks");
    } finally {
      setSavingMark(false);
    }
  };

  // Add to Calendar Action
  const handleSaveToEvents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventStart) return;
    setSavingEvent(true);
    try {
      const res = await fetch("/api/edmail/records/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventTitle,
          eventType,
          startTime: eventStart,
          endTime: eventEnd || null,
          locationOrLink: eventLocation || null,
          description: eventDesc || null,
          source: selectedMessage ? "email_invitation" : "manual",
          sourceMessageId: selectedMessage?.id || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveToEventModalOpen(false);
        setEventTitle("");
        setEventStart("");
        setEventEnd("");
        alert("Added to Events & Calendar!");
        if (activeSection === "student_records" && activeRecordTab === "events") {
          fetchEvents();
        }
      } else {
        alert(data.error || "Failed to save event");
      }
    } catch (err: any) {
      alert(err.message || "Failed to save event");
    } finally {
      setSavingEvent(false);
    }
  };

  // Save Certificate Action
  const handleSaveCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certTitle) return;
    setSavingCert(true);
    try {
      const res = await fetch("/api/edmail/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: certTitle,
          filename: `${certTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}_cert.pdf`,
          category: "certificate",
          source: "email_attachment",
          isVerified: false,
          verificationIssuer: certIssuer || "Academic Organization",
          verificationBadge: certVerifyLink || null,
          sourceMessageId: selectedMessage?.id || null,
          byteSize: 1024 * 300,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveCertModalOpen(false);
        setCertTitle("");
        setCertIssuer("");
        setCertVerifyLink("");
        alert("Certificate saved to Student Record!");
        if (activeSection === "student_records" && activeRecordTab === "certificates") {
          fetchDocuments();
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to save certificate");
    } finally {
      setSavingCert(false);
    }
  };

  // Upload Document (Study Files)
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle) return;
    setUploadingDoc(true);
    try {
      const res = await fetch("/api/edmail/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newDocTitle,
          filename: `${newDocTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`,
          category: newDocCategory,
          byteSize: 1024 * 250,
          source: "upload",
          isVerified: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDocuments((prev) => [data.document, ...prev]);
        setUploadDocModalOpen(false);
        setNewDocTitle("");
      }
    } catch (err: any) {
      alert(err.message || "Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-blue-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-xs">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 tracking-tight font-display">EdMail</span>
                <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#EFF6FF] text-indigo-700 border border-blue-200">
                  @edworld.co.in
                </span>
              </div>
            </Link>
          </div>

          {/* Primary View Switcher: Webmail vs Student Records */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-blue-200">
            <button
              onClick={() => setActiveSection("webmail")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSection === "webmail"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Inbox className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Inbox</span>
            </button>

            <button
              onClick={() => setActiveSection("student_records")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSection === "student_records"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Student Record</span>
            </button>

            <button
              onClick={() => setActiveSection("discounts")}
              className={`hidden md:flex px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all items-center gap-1.5 cursor-pointer ${
                activeSection === "discounts"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Discounts</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {mailbox && (
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-800">{mailbox.address}</div>
                <div className="text-[10px] text-slate-400">
                  {(mailbox.storageUsedBytes / (1024 * 1024)).toFixed(1)} MB / 512 MB
                </div>
              </div>
            )}
            <Link
              href="/dashboard"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-blue-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </header>

        {/* Loading State */}
        {mailboxStatus === "loading" && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#2563EB] mx-auto" />
              <p className="text-sm font-semibold text-slate-600">Loading student mailbox...</p>
            </div>
          </div>
        )}

        {/* Unregistered State */}
        {mailboxStatus === "unregistered" && (
          <div className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-8 flex items-center justify-center">
            <div className="bg-white rounded-3xl border border-blue-200 p-6 sm:p-8 shadow-xs space-y-6 w-full">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-blue-200 flex items-center justify-center text-[#2563EB]">
                <Mail className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 font-display">Activate your EdMail address</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Get your official <strong>@edworld.co.in</strong> email address and activate your private Student Record (Marks, Events, Study Files, and Certificates).
                </p>
              </div>

              <form onSubmit={handleActivateMailbox} className="space-y-4">
                {/* Accessible Inline Status & Feedback */}
                {activationError && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1 font-medium leading-relaxed">{activationError.message}</div>
                    </div>
                    {activationError.action === "signin" && (
                      <div className="pt-1">
                        <Link
                          href="/auth/login?redirectUrl=/edmail"
                          className="inline-flex items-center gap-1 font-bold text-rose-700 underline hover:text-rose-900"
                        >
                          Sign in again <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                    {activationError.action === "change_username" && (
                      <div className="pt-1 text-[11px] text-rose-600 font-semibold">
                        Please modify your handle above to continue.
                      </div>
                    )}
                    {activationError.action === "retry" && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={handleActivateMailbox}
                          disabled={activatingMailbox}
                          className="font-bold text-rose-700 underline hover:text-rose-900 cursor-pointer"
                        >
                          Retry activation now
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activationSuccess && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="p-4 rounded-2xl bg-[#EFF6FF] border border-blue-200 text-emerald-800 text-xs flex items-center gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span className="font-semibold">{activationSuccess}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Choose your username
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-300 bg-white focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#5C59E8]/20 overflow-hidden">
                    <input
                      type="text"
                      required
                      value={activationUsername}
                      onChange={(e) => {
                        setActivationUsername(e.target.value.toLowerCase());
                        if (activationError) setActivationError(null);
                      }}
                      placeholder="e.g. adarsh.cs"
                      className="flex-1 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                    <span className="px-4 py-3 bg-slate-50 text-slate-500 font-semibold text-sm border-l border-blue-200">
                      @{EDMAIL_DOMAIN}
                    </span>
                  </div>

                  {checkingUsername && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Checking availability...</span>
                    </div>
                  )}
                  {usernameAvailability && !checkingUsername && (
                    <div className="pt-1">
                      {usernameAvailability.available ? (
                        <div className="flex items-center gap-1.5 text-xs text-[#1E40AF] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                          <span>{activationUsername}@{EDMAIL_DOMAIN} is available!</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-rose-700 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{usernameAvailability.error || "Username is unavailable"}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Link href="/dashboard" className="text-xs font-bold text-slate-500 hover:text-slate-800">
                    Skip for now
                  </Link>
                  <button
                    type="submit"
                    disabled={activatingMailbox || !usernameAvailability?.available}
                    className="px-6 py-3 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {activatingMailbox && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                    <span>{activatingMailbox ? "Provisioning..." : "Activate EdMail"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Ready Mailbox View */}
        {mailboxStatus === "ready" && (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Navigation */}
            <aside
              className={`w-64 bg-white border-r border-blue-200 flex flex-col justify-between p-4 shrink-0 fixed lg:static inset-y-16 left-0 z-20 transition-transform ${
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
              }`}
            >
              <div className="space-y-4">
                {/* Compose Button */}
                <button
                  onClick={() => setIsComposeOpen(true)}
                  className="w-full py-3 px-4 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Compose</span>
                </button>

                {/* Section Navigation: Webmail Folders */}
                {activeSection === "webmail" ? (
                  <nav className="space-y-1">
                    {[
                      { id: "inbox", label: "Inbox", icon: Inbox, count: unreadCounts.inbox },
                      { id: "starred", label: "Starred", icon: Star },
                      { id: "sent", label: "Sent", icon: Send },
                      { id: "drafts", label: "Drafts", icon: FileText, count: unreadCounts.drafts },
                      { id: "archive", label: "Archive", icon: Archive },
                      { id: "spam", label: "Spam", icon: AlertOctagon },
                      { id: "trash", label: "Trash", icon: Trash2 },
                    ].map((folder) => {
                      const Icon = folder.icon;
                      const isActive = currentFolder === folder.id && !selectedLabel;
                      return (
                        <button
                          key={folder.id}
                          onClick={() => {
                            setCurrentFolder(folder.id as MailFolder);
                            setSelectedLabel(null);
                            setSelectedMessage(null);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            isActive
                              ? "bg-[#EFF6FF] text-[#2563EB]"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`w-4 h-4 ${isActive ? "text-[#2563EB]" : "text-slate-400"}`} />
                            <span>{folder.label}</span>
                          </div>
                          {folder.count && folder.count > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#2563EB] text-white">
                              {folder.count}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </nav>
                ) : (
                  /* Student Record Sidebar Tabs */
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                      Record Sections
                    </div>
                    {[
                      { id: "marks", label: "Marks & Grades", icon: GraduationCap },
                      { id: "events", label: "Events & Calendar", icon: Calendar },
                      { id: "study_files", label: "Study Files", icon: BookOpen },
                      { id: "certificates", label: "Certificates", icon: Award },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeRecordTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveRecordTab(tab.id as RecordTab);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            isActive
                              ? "bg-[#EFF6FF] text-[#2563EB]"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? "text-[#2563EB]" : "text-slate-400"}`} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Storage & Privacy Controls Footer */}
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-2xl border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                    <span>Storage Used</span>
                    <span>512 MB</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2563EB] rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(4, (mailbox.storageUsedBytes / (512 * 1024 * 1024)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Data Export & Account Deletion Controls */}
                <div className="pt-2 border-t border-blue-100 flex items-center justify-between px-1">
                  <button
                    onClick={async () => {
                      if (!confirm("Download a full archive of your EdMail messages and Student Record?")) return;
                      try {
                        const res = await fetch("/api/edmail/mailbox/export", { method: "POST" });
                        const data = await res.json();
                        if (data.success && data.exportArchive) {
                          const blob = new Blob([JSON.stringify(data.exportArchive, null, 2)], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `edmail_archive_${mailbox.username}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          alert("Export downloaded successfully!");
                        } else {
                          alert(data.error || "Failed to generate export");
                        }
                      } catch {
                        alert("Export request failed");
                      }
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    title="Export your messages, marks, and certificates"
                  >
                    <Download className="w-3 h-3 text-slate-400" />
                    <span>Export Data</span>
                  </button>

                  <button
                    onClick={async () => {
                      const confirmation = prompt("To close this mailbox, type CLOSE below. You will have a 30-day retention grace period:");
                      if (confirmation !== "CLOSE") return;
                      try {
                        const res = await fetch("/api/edmail/mailbox/delete", { method: "POST" });
                        const data = await res.json();
                        if (data.success) {
                          alert(data.notice);
                          window.location.reload();
                        } else {
                          alert(data.error || "Failed to close mailbox");
                        }
                      } catch {
                        alert("Failed to close mailbox");
                      }
                    }}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    title="Close your mailbox and initiate 30-day retention countdown"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Close Mailbox</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* Main Work Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-white">
              {/* SECTION 1: WEBMAIL INBOX */}
              {activeSection === "webmail" && (
                <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                  {/* Messages List Column */}
                  <div
                    className={`w-full md:w-96 border-r border-blue-200 flex flex-col shrink-0 ${
                      selectedMessage ? "hidden md:flex" : "flex"
                    }`}
                  >
                    <div className="p-3 border-b border-blue-200 flex items-center gap-2">
                      <div className="flex-1 relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && fetchMessages()}
                          placeholder="Search in mail..."
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-blue-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB]"
                        />
                      </div>
                      <button
                        onClick={fetchMessages}
                        className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                        title="Refresh"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                      {loadingMessages ? (
                        <div className="p-8 text-center text-slate-400">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#2563EB]" />
                          <span className="text-xs">Loading mail...</span>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="p-8 text-center space-y-2">
                          <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-xs font-semibold text-slate-500">No messages in {currentFolder}</p>
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isSelected = selectedMessage?.id === msg.id;
                          return (
                            <div
                              key={msg.id}
                              onClick={() => handleOpenMessage(msg)}
                              className={`p-3.5 transition-colors cursor-pointer flex gap-3 ${
                                isSelected
                                  ? "bg-[#EFF6FF]/70"
                                  : msg.is_read
                                  ? "bg-white hover:bg-slate-50"
                                  : "bg-slate-50/70 hover:bg-slate-100 font-bold"
                              }`}
                            >
                              <button
                                onClick={(e) => handleToggleStar(msg.id, msg.is_starred, e)}
                                className="mt-0.5 text-slate-400 hover:text-amber-400 shrink-0"
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    msg.is_starred ? "fill-amber-400 text-amber-400" : ""
                                  }`}
                                />
                              </button>
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="truncate text-slate-900">
                                    {msg.from_name || msg.from_address}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-normal shrink-0">
                                    {new Date(msg.created_at).toLocaleDateString([], {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-800 truncate">{msg.subject || "(No Subject)"}</div>
                                <div className="text-[11px] text-slate-500 truncate font-normal">
                                  {msg.snippet || "No preview"}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Message Detail & Save Action Bar */}
                  <div className={`flex-1 flex flex-col min-w-0 ${selectedMessage ? "flex" : "hidden md:flex"}`}>
                    {selectedMessage ? (
                      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                        {/* Action Bar with Save to Student Record Buttons */}
                        <div className="p-3 border-b border-blue-200 flex flex-wrap items-center justify-between gap-2 bg-white sticky top-0 z-10">
                          <button
                            onClick={() => setSelectedMessage(null)}
                            className="md:hidden p-1.5 rounded-xl text-slate-600 hover:bg-slate-100"
                          >
                            <ArrowLeft className="w-5 h-5" />
                          </button>

                          {/* Quick Save to Record Actions */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                              Save To Record:
                            </span>
                            <button
                              onClick={() => {
                                setMarkSubject(selectedMessage.subject?.replace(/^(re|fwd):\s*/i, "").slice(0, 30) || "CS Assessment");
                                setSaveToMarksModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-[#EFF6FF] hover:bg-indigo-100 text-[#2563EB] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Save assessment results or mark sheet from this email"
                            >
                              <GraduationCap className="w-3.5 h-3.5" />
                              <span>Save to Marks</span>
                            </button>

                            <button
                              onClick={() => {
                                setEventTitle(selectedMessage.subject?.replace(/^(re|fwd):\s*/i, "") || "Academic Event");
                                setEventDesc(selectedMessage.snippet || "");
                                setSaveToEventModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-[#EFF6FF] hover:bg-emerald-100 text-[#1E40AF] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Add workshop, exam, or deadline from this email to calendar"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Add to Calendar</span>
                            </button>

                            <button
                              onClick={() => {
                                setCertTitle(selectedMessage.subject?.replace(/^(re|fwd):\s*/i, "") || "Course Certificate");
                                setCertIssuer(selectedMessage.from_name || "Institution");
                                setSaveCertModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-[#EFF6FF] hover:bg-amber-100 text-[#1E40AF] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Save certificate credential"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>Save Certificate</span>
                            </button>
                          </div>

                          {/* Standard Mail Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setIsComposeOpen(true);
                                setComposeTo(selectedMessage.from_address);
                                setComposeSubject(`Re: ${selectedMessage.subject}`);
                              }}
                              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100"
                              title="Reply"
                            >
                              <Reply className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                await fetch("/api/edmail/messages", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    messageIds: [selectedMessage.id],
                                    action: "move_folder",
                                    value: "trash",
                                  }),
                                });
                                setSelectedMessage(null);
                                fetchMessages();
                              }}
                              className="p-2 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                              title="Trash"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Email Header */}
                        <div className="p-6 border-b border-blue-100 space-y-4">
                          <h1 className="text-xl font-black text-slate-900 font-display">
                            {selectedMessage.subject || "(No Subject)"}
                          </h1>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-[#EFF6FF] text-[#2563EB] font-black flex items-center justify-center text-sm">
                                {(selectedMessage.from_name || selectedMessage.from_address)[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900">
                                  {selectedMessage.from_name || selectedMessage.from_address}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  From: {selectedMessage.from_address} &bull; To: {selectedMessage.to_addresses?.join(", ")}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              {new Date(selectedMessage.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Email Body */}
                        <div className="p-6 flex-1 text-slate-800 text-sm leading-relaxed prose max-w-none">
                          {selectedMessage.body_html ? (
                            <div dangerouslySetInnerHTML={{ __html: selectedMessage.body_html }} />
                          ) : (
                            <pre className="whitespace-pre-wrap font-sans">{selectedMessage.body_text}</pre>
                          )}
                        </div>

                        {/* Attachments Section */}
                        {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                          <div className="p-6 border-t border-blue-200 bg-slate-50/50 space-y-3">
                            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Paperclip className="w-4 h-4 text-slate-500" />
                              <span>Attachments ({selectedMessage.attachments.length})</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {selectedMessage.attachments.map((att: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="p-3 bg-white rounded-xl border border-blue-200 flex items-center justify-between"
                                >
                                  <div className="truncate mr-2">
                                    {att.content_base64 ? (
                                      <button type="button" className="text-xs font-bold text-blue-700 underline"
                                        onClick={() => {
                                          const bytes = Uint8Array.from(atob(att.content_base64), (character) => character.charCodeAt(0));
                                          const url = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" }));
                                          const link = document.createElement("a");
                                          link.href = url;
                                          link.download = att.filename;
                                          link.click();
                                          setTimeout(() => URL.revokeObjectURL(url), 1000);
                                        }}>
                                        {att.filename}
                                      </button>
                                    ) : <div className="text-xs font-bold text-slate-800 truncate">{att.filename}</div>}
                                    <div className="text-[10px] text-slate-400">{(att.byte_size / 1024).toFixed(1)} KB</div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={() => {
                                        setMarkSubject(att.filename.replace(/\.[^/.]+$/, ""));
                                        setSaveToMarksModalOpen(true);
                                      }}
                                      className="px-2 py-1 rounded-lg bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold"
                                      title="Extract marks from attachment"
                                    >
                                      Mark Sheet
                                    </button>
                                    <button
                                      onClick={async () => {
                                        await fetch("/api/edmail/documents", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({
                                            title: att.filename,
                                            filename: att.filename,
                                            category: "study_material",
                                            byteSize: att.byte_size,
                                            source: "email_attachment",
                                            sourceMessageId: selectedMessage.id,
                                          }),
                                        });
                                        alert("Saved to Study Files!");
                                      }}
                                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                                    >
                                      Study File
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400">
                        <div className="space-y-2">
                          <Mail className="w-10 h-10 mx-auto text-slate-200" />
                          <p className="text-xs font-semibold text-slate-500">Select a message to view details</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 2: STUDENT RECORD (MARKS, EVENTS, STUDY FILES, CERTIFICATES) */}
              {activeSection === "student_records" && (
                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 sm:p-8 space-y-6">
                  {/* Student Record Tab Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-200 pb-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 font-display">Student Record</h2>
                      <p className="text-xs text-slate-500">
                        Private academic record derived from your correspondence and verified coursework.
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-blue-200 self-start sm:self-auto overflow-x-auto">
                      {[
                        { id: "marks", label: "Marks", icon: GraduationCap },
                        { id: "events", label: "Events & Agenda", icon: Calendar },
                        { id: "study_files", label: "Study Files", icon: BookOpen },
                        { id: "certificates", label: "Certificates", icon: Award },
                      ].map((t) => {
                        const Icon = t.icon;
                        const isTabActive = activeRecordTab === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setActiveRecordTab(t.id as RecordTab)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                              isTabActive
                                ? "bg-white text-slate-900 shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${isTabActive ? "text-[#2563EB]" : "text-slate-400"}`} />
                            <span>{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* TAB 1: MARKS */}
                  {activeRecordTab === "marks" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Academic Assessments ({marks.length})
                        </span>
                        <button
                          onClick={() => {
                            setMarkSubject("");
                            setSaveToMarksModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Marks</span>
                        </button>
                      </div>

                      {loadingMarks ? (
                        <div className="p-8 text-center text-slate-400">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#2563EB]" />
                        </div>
                      ) : marks.length === 0 ? (
                        <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300 space-y-2">
                          <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
                          <div className="text-xs font-bold text-slate-700">No marks recorded yet</div>
                          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                            Add assessment scores manually or tap &quot;Save to Marks&quot; from an exam result or mark sheet email.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {marks.map((m) => (
                            <div
                              key={m.id}
                              className="p-4 rounded-2xl bg-white border border-blue-200 shadow-2xs space-y-3"
                            >
                              <div className="flex items-start justify-between">
                                <span className="font-bold text-sm text-slate-900 truncate mr-2">{m.subject}</span>
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                    m.is_verified
                                      ? "bg-[#EFF6FF] text-[#1E40AF] border border-blue-200"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {m.is_verified ? "Institution Verified" : "Student Entered"}
                                </span>
                              </div>

                              <div className="flex items-baseline justify-between">
                                <div>
                                  <span className="text-2xl font-black text-slate-900 font-display">{m.score}</span>
                                  <span className="text-xs text-slate-400 font-semibold"> / {m.max_marks}</span>
                                </div>
                                {m.grade && (
                                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                                    Grade {m.grade}
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-slate-500 truncate">
                                Assessment: <strong>{m.assessment_name}</strong>
                              </div>

                              <div className="pt-2 border-t border-blue-100 flex items-center justify-between text-[10px] text-slate-400">
                                <span>{new Date(m.created_at).toLocaleDateString()}</span>
                                <button
                                  onClick={async () => {
                                    await fetch(`/api/edmail/records/marks?id=${m.id}`, { method: "DELETE" });
                                    setMarks((prev) => prev.filter((item) => item.id !== m.id));
                                  }}
                                  className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: EVENTS & AGENDA */}
                  {activeRecordTab === "events" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Agenda &amp; Deadlines ({events.length})
                        </span>
                        <button
                          onClick={() => {
                            setEventTitle("");
                            setSaveToEventModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Event</span>
                        </button>
                      </div>

                      {loadingEvents ? (
                        <div className="p-8 text-center text-slate-400">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#2563EB]" />
                        </div>
                      ) : events.length === 0 ? (
                        <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300 space-y-2">
                          <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                          <div className="text-xs font-bold text-slate-700">No events scheduled</div>
                          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                            Tap &quot;Add to Calendar&quot; from workshop invites or deadlines in your emails.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {events.map((ev) => (
                            <div
                              key={ev.id}
                              className="p-4 rounded-2xl bg-white border border-blue-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-slate-900">{ev.title}</span>
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-indigo-700 uppercase">
                                    {ev.event_type}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{new Date(ev.start_time).toLocaleString()}</span>
                                  </span>
                                  {ev.location_or_link && (
                                    <span className="flex items-center gap-1 text-[#2563EB] truncate max-w-xs">
                                      <MapPin className="w-3.5 h-3.5" />
                                      <span>{ev.location_or_link}</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <a
                                  href={`/api/edmail/records/events?id=${ev.id}&export=ics`}
                                  className="px-3 py-1.5 rounded-xl border border-blue-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1"
                                  title="Export to Google/Apple Calendar"
                                >
                                  <Download className="w-3.5 h-3.5 text-slate-500" />
                                  <span>.ics</span>
                                </a>
                                <button
                                  onClick={async () => {
                                    await fetch(`/api/edmail/records/events?id=${ev.id}`, { method: "DELETE" });
                                    setEvents((prev) => prev.filter((item) => item.id !== ev.id));
                                  }}
                                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: STUDY FILES */}
                  {activeRecordTab === "study_files" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Educational Attachments &amp; Notes
                        </span>
                        <button
                          onClick={() => {
                            setNewDocCategory("study_material");
                            setUploadDocModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File</span>
                        </button>
                      </div>

                      {documents.filter((d) => d.category === "study_material" || d.category === "resume").length === 0 ? (
                        <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300 space-y-2">
                          <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                          <div className="text-xs font-bold text-slate-700">No study files saved yet</div>
                          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                            Save lecture notes, assignments, or PDF attachments from your incoming emails.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {documents
                            .filter((d) => d.category === "study_material" || d.category === "resume")
                            .map((doc) => (
                              <div
                                key={doc.id}
                                className="p-4 rounded-2xl bg-white border border-blue-200 shadow-2xs space-y-2"
                              >
                                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="text-xs font-bold text-slate-900 truncate">{doc.title}</div>
                                <div className="text-[10px] text-slate-400">
                                  {(doc.byte_size / 1024).toFixed(1)} KB &bull; {doc.category}
                                </div>
                                <div className="pt-2 border-t border-blue-100 flex items-center justify-between text-xs">
                                  <span className="text-[10px] text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</span>
                                  <button
                                    onClick={async () => {
                                      await fetch(`/api/edmail/documents?id=${doc.id}`, { method: "DELETE" });
                                      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
                                    }}
                                    className="text-rose-600 text-[11px] font-semibold hover:text-rose-800"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: CERTIFICATES */}
                  {activeRecordTab === "certificates" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Credentials &amp; Course Certifications
                        </span>
                        <button
                          onClick={() => {
                            setCertTitle("");
                            setSaveCertModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Certificate</span>
                        </button>
                      </div>

                      {documents.filter((d) => d.category === "certificate").length === 0 ? (
                        <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300 space-y-2">
                          <Award className="w-8 h-8 text-slate-300 mx-auto" />
                          <div className="text-xs font-bold text-slate-700">No certificates stored</div>
                          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                            Save certificates of completion from emails or add issuer verification links.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {documents
                            .filter((d) => d.category === "certificate")
                            .map((doc) => (
                              <div
                                key={doc.id}
                                className="p-4 rounded-2xl bg-white border border-blue-200 shadow-2xs space-y-3"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                                    <Award className="w-4 h-4" />
                                  </div>
                                  <span
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                      doc.is_verified
                                        ? "bg-[#EFF6FF] text-[#1E40AF] border border-blue-200"
                                        : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {doc.is_verified ? "Edworld Verified" : "Personal Copy"}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-slate-900 truncate">{doc.title}</div>
                                  <div className="text-[11px] text-slate-500 truncate">
                                    Issuer: {doc.verification_issuer || "Self Added"}
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-blue-100 flex items-center justify-between text-xs">
                                  <span className="text-[10px] text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</span>
                                  <button
                                    onClick={async () => {
                                      await fetch(`/api/edmail/documents?id=${doc.id}`, { method: "DELETE" });
                                      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
                                    }}
                                    className="text-rose-600 text-[11px] font-semibold hover:text-rose-800"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 3: DISCOUNTS TAB */}
              {activeSection === "discounts" && (
                <div className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6 max-w-4xl">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 font-display">Student Discounts &amp; Eligibility</h2>
                    <p className="text-xs text-slate-500">
                      Clear verification rules for student discounts with your @edworld.co.in address.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#EFF6FF]/70 border border-blue-200 text-xs text-indigo-950 space-y-2">
                    <div className="font-bold flex items-center gap-2 text-indigo-900">
                      <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                      <span>Important Notice Regarding Commercial Student Discounts</span>
                    </div>
                    <p className="leading-relaxed">
                      Holding an EdMail address confirms your active learning membership on Edworld. However, third-party software programs (such as GitHub Student Developer Pack, JetBrains, or Notion) maintain their own independent vetting systems.
                    </p>
                    <p className="leading-relaxed">
                      While some vendors accept direct domain verification, others strictly require proof of enrollment from an accredited degree-granting secondary school or university.
                    </p>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}

        {/* MODAL: Save to Marks */}
        {saveToMarksModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl border border-blue-200 shadow-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                  <GraduationCap className="w-5 h-5 text-[#2563EB]" />
                  <span>Save to Student Marks</span>
                </div>
                <button onClick={() => setSaveToMarksModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveToMarks} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Subject / Course Name</label>
                  <input
                    type="text"
                    required
                    value={markSubject}
                    onChange={(e) => setMarkSubject(e.target.value)}
                    placeholder="e.g. Data Structures & Algorithms"
                    className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Assessment Title</label>
                  <input
                    type="text"
                    value={markAssessment}
                    onChange={(e) => setMarkAssessment(e.target.value)}
                    placeholder="e.g. Midterm Examination or Final Grade"
                    className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Score Obtained</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={markScore}
                      onChange={(e) => setMarkScore(e.target.value)}
                      placeholder="e.g. 92"
                      className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Maximum Marks</label>
                    <input
                      type="number"
                      value={markMax}
                      onChange={(e) => setMarkMax(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-blue-200 text-[11px] text-slate-500">
                  Record will be stored privately under your Student Record as <strong>Student Entered</strong> unless verified through an official institution integration.
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSaveToMarksModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingMark}
                    className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-xs"
                  >
                    {savingMark ? "Saving..." : "Save to Marks"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Add to Calendar / Events */}
        {saveToEventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl border border-blue-200 shadow-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                  <Calendar className="w-5 h-5 text-[#2563EB]" />
                  <span>Add to Student Agenda &amp; Calendar</span>
                </div>
                <button onClick={() => setSaveToEventModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveToEvents} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Event / Workshop Title</label>
                  <input
                    type="text"
                    required
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="e.g. AI Systems Guest Lecture"
                    className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Event Type</label>
                    <select
                      value={eventType}
                      onChange={(e: any) => setEventType(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl focus:outline-none focus:border-[#2563EB]"
                    >
                      <option value="workshop">Workshop</option>
                      <option value="class">Class</option>
                      <option value="exam">Exam</option>
                      <option value="competition">Competition</option>
                      <option value="deadline">Deadline</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Date &amp; Start Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={eventStart}
                      onChange={(e) => setEventStart(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Location or Meeting Link</label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="e.g. Google Meet or Room 302"
                    className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSaveToEventModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEvent}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                  >
                    {savingEvent ? "Saving..." : "Add to Calendar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Save Certificate */}
        {saveCertModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl border border-blue-200 shadow-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>Save Certificate to Student Record</span>
                </div>
                <button onClick={() => setSaveCertModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCertificate} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Certificate Title</label>
                  <input
                    type="text"
                    required
                    value={certTitle}
                    onChange={(e) => setCertTitle(e.target.value)}
                    placeholder="e.g. Python for Data Science"
                    className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Issuing Organization</label>
                  <input
                    type="text"
                    value={certIssuer}
                    onChange={(e) => setCertIssuer(e.target.value)}
                    placeholder="e.g. Coursera, DeepLearning.AI, or University"
                    className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Verification URL / Credential ID</label>
                  <input
                    type="text"
                    value={certVerifyLink}
                    onChange={(e) => setCertVerifyLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-blue-200 text-[11px] text-slate-500">
                  Saved certificates are marked as <strong>Personal Copy</strong> until verified through Edworld or an approved verification authority.
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSaveCertModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingCert}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                  >
                    {savingCert ? "Saving..." : "Save Certificate"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Upload Document */}
        {uploadDocModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl border border-blue-200 shadow-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900">Upload to Study Files</h3>
                <button onClick={() => setUploadDocModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadDocument} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Document Title</label>
                  <input
                    type="text"
                    required
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder="e.g. Operating Systems Notes"
                    className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadDocModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingDoc}
                    className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-bold text-xs"
                  >
                    {uploadingDoc ? "Saving..." : "Save File"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Compose Modal */}
        {isComposeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-in fade-in">
            <div className="bg-white w-full max-w-xl rounded-3xl border border-blue-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-blue-200 flex items-center justify-between bg-slate-50/50">
                <span className="text-sm font-bold text-slate-900">New Message</span>
                <button
                  onClick={() => setIsComposeOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendEmail} className="flex-1 flex flex-col p-4 space-y-3 overflow-y-auto">
                {composeError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{composeError}</span>
                  </div>
                )}
                {composeSuccess && (
                  <div className="p-3 rounded-xl bg-[#EFF6FF] border border-blue-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{composeSuccess}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <input
                    type="text"
                    required
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    placeholder="To (recipients separated by comma)"
                    className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div className="space-y-1">
                  <input
                    type="text"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="Subject"
                    className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div className="flex-1 min-h-[160px]">
                  <textarea
                    required={composeFiles.length === 0}
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="Write your email here..."
                    className="w-full h-full p-3 text-xs border border-blue-200 rounded-xl focus:outline-none focus:border-[#2563EB] resize-none"
                  />
                </div>

                <label className="block text-sm font-medium">
                  Attach files or images (3 MB total)
                  <input type="file" multiple disabled={sendingEmail} className="mt-1 block w-full text-xs"
                    onChange={(event) => setComposeFiles(Array.from(event.target.files ?? []))} />
                </label>

                <div className="pt-2 flex items-center justify-between border-t border-blue-100">
                  <div className="text-[10px] text-slate-400">
                    Sending from: <strong>{mailbox?.address}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsComposeOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sendingEmail}
                      className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {sendingEmail ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
