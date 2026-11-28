"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { 
  Users, 
  Briefcase, 
  Award, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Hammer, 
  Layers, 
  Filter, 
  Search, 
  FileCheck, 
  X, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserCheck
} from "lucide-react";

interface QueueItem {
  id: string;
  review_type: string;
  requester_id: string;
  requester_name: string;
  requester_email: string;
  institution: string;
  title: string;
  status: "pending" | "changes_requested" | "approved" | "declined";
  evidence: any;
  current_values: any;
  proposed_values: any;
  reviewer_id?: string;
  reviewer_name?: string;
  internal_notes?: string;
  applicant_feedback?: string;
  last_decision_at?: string;
  created_at: string;
  version: number;
}

export default function AdminHubPage() {
  const { user } = useAuth();
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [counts, setCounts] = useState({
    pending_count: 0,
    changes_requested_count: 0,
    resolved_count: 0,
    total_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Review Modal State
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [actionType, setActionType] = useState<"approve" | "request_changes" | "decline" | null>(null);
  const [reason, setReason] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [applicantFeedback, setApplicantFeedback] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const url = `/api/admin/queue?status=${statusFilter}&type=${typeFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setQueueItems(data.items || []);
        if (data.counts) {
          setCounts({
            pending_count: parseInt(data.counts.pending_count || "0", 10),
            changes_requested_count: parseInt(data.counts.changes_requested_count || "0", 10),
            resolved_count: parseInt(data.counts.resolved_count || "0", 10),
            total_count: parseInt(data.counts.total_count || "0", 10),
          });
        }
      }
    } catch (err) {
      console.warn("Could not load review queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter, typeFilter]);

  const handleTakeAction = async () => {
    if (!selectedItem || !actionType) return;
    if ((actionType === "request_changes" || actionType === "decline") && !reason.trim()) {
      setErrorMsg("A clear reason is required when requesting changes or declining.");
      return;
    }

    try {
      setProcessing(true);
      setErrorMsg(null);

      const res = await fetch("/api/admin/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: selectedItem.id,
          action: actionType,
          reason,
          internalNotes,
          applicantFeedback: applicantFeedback || reason,
          currentVersion: selectedItem.version,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedItem(null);
        setActionType(null);
        setReason("");
        setInternalNotes("");
        setApplicantFeedback("");
        fetchQueue();
      } else {
        setErrorMsg(data.error || "Action failed to submit");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit decision");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Welcome & Review Summary */}
      <div className="border-blue-200/80 p-6 space-y-4 border-b">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-blue-200">
              Staff Control Center
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-slate-900 mt-1">
              Unified Review Queue &amp; Approvals
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/users"
              className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-blue-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Users className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>User Directory</span>
            </Link>
            <Link
              href="/admin/ambassadors"
              className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-blue-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Ambassadors</span>
            </Link>
          </div>
        </div>

        {/* Filter Counters linked to filtered queue */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === "pending"
                ? "bg-[#EFF6FF] border-amber-300 ring-2 ring-amber-400/20"
                : "bg-slate-50 hover:bg-slate-100/80 border-blue-200/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase font-mono">Pending Review</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black font-display text-slate-900 mt-1">
              {counts.pending_count}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Awaiting staff decision</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("changes_requested")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === "changes_requested"
                ? "bg-[#EFF6FF] border-purple-300 ring-2 ring-purple-400/20"
                : "bg-slate-50 hover:bg-slate-100/80 border-blue-200/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase font-mono">Changes Requested</span>
              <AlertCircle className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black font-display text-slate-900 mt-1">
              {counts.changes_requested_count}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">With applicant for updates</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-[#EFF6FF] border-indigo-300 ring-2 ring-indigo-400/20"
                : "bg-slate-50 hover:bg-slate-100/80 border-blue-200/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase font-mono">Total Requests</span>
              <Layers className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div className="text-2xl font-black font-display text-slate-900 mt-1">
              {counts.total_count}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">All incoming student items</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("approved")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === "approved"
                ? "bg-[#EFF6FF] border-emerald-300 ring-2 ring-emerald-400/20"
                : "bg-slate-50 hover:bg-slate-100/80 border-blue-200/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase font-mono">Resolved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black font-display text-slate-900 mt-1">
              {counts.resolved_count}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Approved or closed</p>
          </button>
        </div>
      </div>

      {/* Filter Tabs for Review Type */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "all", label: "All Workflows" },
          { id: "ambassador_application", label: "Ambassador Applications" },
          { id: "profile_correction", label: "Profile Corrections" },
          { id: "edbuild_submission", label: "EdBuild Submissions" },
          { id: "event_listing", label: "Events & Hackathons" },
          { id: "job_listing", label: "Job Postings" },
          { id: "certification_request", label: "Certifications" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTypeFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              typeFilter === tab.id
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white hover:bg-slate-100 text-slate-600 border border-blue-200/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Unified Review Queue Table */}
      <div className="border-blue-200/80 overflow-hidden border-b">
        <div className="p-4 sm:p-5 border-b border-blue-100 flex items-center justify-between">
          <div className="text-sm font-black font-display text-slate-900">
            Queue Items ({queueItems.length})
          </div>
          <button
            type="button"
            onClick={fetchQueue}
            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 font-mono text-xs">
            Loading review queue...
          </div>
        ) : queueItems.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="font-bold text-slate-700">All caught up!</p>
            <p>No pending review requests in this filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {queueItems.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {item.review_type.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        item.status === "approved"
                          ? "bg-[#EFF6FF] text-[#1E40AF] border border-blue-200"
                          : item.status === "declined"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : item.status === "changes_requested"
                          ? "bg-[#EFF6FF] text-[#1E40AF] border border-blue-200"
                          : "bg-[#EFF6FF] text-[#1E40AF] border border-blue-200"
                      }`}
                    >
                      {item.status.toUpperCase()}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(item.created_at).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h3>

                  <div className="text-xs text-slate-500 font-medium">
                    Requester: <strong className="text-slate-800">{item.requester_name}</strong>{" "}
                    ({item.institution || "College"})
                  </div>

                  {item.applicant_feedback && (
                    <div className="text-[11px] text-[#1E40AF] bg-[#EFF6FF] p-2 rounded-lg border border-purple-100">
                      Feedback: {item.applicant_feedback}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItem(item);
                      setActionType("approve");
                      setReason("");
                      setApplicantFeedback("");
                      setErrorMsg(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    Review &amp; Decide
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review & Decision Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-blue-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded">
                  Staff Review
                </span>
                <h3 className="text-base font-black font-display text-slate-900 mt-1">
                  {selectedItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Close
              </button>
            </div>

            {/* Submission Evidence / Proposed Values */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-blue-200 space-y-2 text-xs">
              <div className="font-bold text-slate-800 uppercase font-mono text-[10px]">
                Submission Details:
              </div>
              <div>
                <strong>Requester:</strong> {selectedItem.requester_name} ({selectedItem.requester_email})
              </div>
              <div>
                <strong>College / Institution:</strong> {selectedItem.institution}
              </div>

              {selectedItem.proposed_values && (
                <div className="pt-2 border-t border-blue-200/80">
                  <strong className="block mb-1 text-indigo-900 font-mono text-[10px] uppercase">
                    Proposed Data:
                  </strong>
                  <pre className="p-2.5 rounded-xl bg-white border border-blue-200 text-[11px] font-mono overflow-x-auto text-slate-800">
                    {JSON.stringify(selectedItem.proposed_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Decision Action Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">Select Review Action:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActionType("approve")}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    actionType === "approve"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setActionType("request_changes")}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    actionType === "request_changes"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  Request Changes
                </button>
                <button
                  type="button"
                  onClick={() => setActionType("decline")}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    actionType === "decline"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  Decline
                </button>
              </div>
            </div>

            {/* Reason / Applicant Message */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">
                Decision Reason / Applicant-Facing Feedback:
                {(actionType === "request_changes" || actionType === "decline") && (
                  <span className="text-rose-600 ml-1">*Required</span>
                )}
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setApplicantFeedback(e.target.value);
                }}
                rows={3}
                placeholder="Explain the reason or specify what the applicant needs to update before resubmitting..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Internal Staff Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">
                Internal Staff Notes (Private):
              </label>
              <input
                type="text"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Notes for internal audit trail only..."
                className="w-full p-2 text-xs bg-slate-50 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-blue-100">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTakeAction}
                disabled={processing}
                className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                {processing ? "Recording..." : `Confirm ${actionType?.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
