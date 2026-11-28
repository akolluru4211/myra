"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { 
  Award, 
  Search, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Users, 
  RefreshCw, 
  ArrowLeft, 
  Filter, 
  AlertCircle, 
  Check, 
  X, 
  Calendar, 
  Plus, 
  FileText 
} from "lucide-react";

export default function AdminAmbassadorsManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"applications" | "ambassadors">("applications");
  const [applications, setApplications] = useState<any[]>([]);
  const [ambassadors, setAmbassadors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Status Change / Assignment Modal State
  const [selectedAmbassador, setSelectedAmbassador] = useState<any>(null);
  const [actionKind, setActionKind] = useState<"status" | "task" | "event" | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const url = `/api/ambassador/admin?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications || []);
        setAmbassadors(data.ambassadors || []);
      }
    } catch (err) {
      console.warn("Could not load ambassador admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [statusFilter]);

  const handleUpdateStatus = async (targetStatus: "active" | "suspended") => {
    if (!selectedAmbassador || !statusReason.trim()) {
      setActionMsg({ type: "error", text: "A reason is required for ambassador status modification." });
      return;
    }
    try {
      setSaving(true);
      const res = await fetch("/api/ambassador/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          ambassadorId: selectedAmbassador.id,
          targetStatus,
          reason: statusReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg({ type: "success", text: "Ambassador status updated successfully." });
        setTimeout(() => {
          setSelectedAmbassador(null);
          setActionKind(null);
          fetchRecords();
        }, 1200);
      } else {
        setActionMsg({ type: "error", text: data.error || "Failed to update status." });
      }
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message || "Failed to update." });
    } finally {
      setSaving(false);
    }
  };

  const handleAssignTask = async () => {
    if (!selectedAmbassador || !taskTitle.trim()) {
      setActionMsg({ type: "error", text: "Task title is required." });
      return;
    }
    try {
      setSaving(true);
      const res = await fetch("/api/ambassador/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign_task",
          ambassadorId: selectedAmbassador.id,
          newTask: { title: taskTitle, description: taskDesc },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg({ type: "success", text: "Task assigned successfully." });
        setTimeout(() => {
          setSelectedAmbassador(null);
          setActionKind(null);
          fetchRecords();
        }, 1200);
      } else {
        setActionMsg({ type: "error", text: data.error || "Failed to assign task." });
      }
    } catch (err: any) {
      setActionMsg({ type: "error", text: err.message || "Failed to assign task." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="border-blue-200/80 p-6 space-y-4 border-b">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-blue-200">
              Staff Leadership Management
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-slate-900 mt-1">
              College Ambassador Program Administration
            </h1>
          </div>
          <Link
            href="/admin"
            className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-blue-200 text-xs font-bold text-slate-700 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Review Queue</span>
          </Link>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-blue-100 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("applications")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "applications"
                ? "bg-[#2563EB] text-white shadow-xs"
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-blue-200/60"
            }`}
          >
            Applications ({applications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ambassadors")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ambassadors"
                ? "bg-[#2563EB] text-white shadow-xs"
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-blue-200/60"
            }`}
          >
            Active Ambassadors ({ambassadors.length})
          </button>
        </div>
      </div>

      {/* Applications View */}
      {activeTab === "applications" && (
        <div className="border-blue-200/80 overflow-hidden border-b">
          <div className="p-4 sm:p-5 border-b border-blue-100 flex items-center justify-between">
            <div className="text-sm font-black font-display text-slate-900">
              Ambassador Applications
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-blue-200 text-xs text-slate-700 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 font-mono text-xs">
              Loading applications...
            </div>
          ) : applications.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No applications matching current filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{app.student_name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          app.status === "approved"
                            ? "bg-[#EFF6FF] text-[#1E40AF] border border-blue-200"
                            : app.status === "declined"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : app.status === "changes_requested"
                            ? "bg-[#EFF6FF] text-[#1E40AF] border border-blue-200"
                            : "bg-[#EFF6FF] text-[#1E40AF] border border-blue-200"
                        }`}
                      >
                        {app.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {app.email} • {app.college_name} ({app.degree_year || "Student"})
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      Statement: &ldquo;{app.why_ambassador}&rdquo;
                    </p>
                  </div>

                  <Link
                    href="/admin"
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                  >
                    Review in Queue
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Ambassadors View */}
      {activeTab === "ambassadors" && (
        <div className="border-blue-200/80 overflow-hidden border-b">
          <div className="p-4 sm:p-5 border-b border-blue-100 text-sm font-black font-display text-slate-900">
            Active Campus Roster
          </div>

          {ambassadors.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No approved ambassadors active on campus yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {ambassadors.map((amb) => (
                <div
                  key={amb.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{amb.student_name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] font-bold border border-blue-200">
                        {amb.referral_code}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          amb.is_active ? "bg-[#EFF6FF] text-[#1E40AF]" : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {amb.is_active ? "Active" : "Suspended"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {amb.college_name} • Appointed {new Date(amb.joined_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAmbassador(amb);
                        setActionKind("task");
                        setTaskTitle("");
                        setTaskDesc("");
                        setActionMsg(null);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#EFF6FF] hover:bg-indigo-100 text-[#2563EB] text-xs font-bold cursor-pointer"
                    >
                      Assign Task
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAmbassador(amb);
                        setActionKind("status");
                        setStatusReason("");
                        setActionMsg(null);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Change Status
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Task / Status Modal */}
      {selectedAmbassador && actionKind && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="border-blue-200 max-w-md w-full p-6 space-y-4 border-b">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <h3 className="text-base font-black font-display text-slate-900">
                {actionKind === "task" ? "Assign Campus Task" : "Modify Ambassador Status"}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedAmbassador(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Close
              </button>
            </div>

            {actionKind === "task" ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Task Title *:</label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. Put up EdWorld posters in CS block"
                    className="w-full p-2 bg-slate-50 border border-blue-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Description:</label>
                  <textarea
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    rows={2}
                    placeholder="Task deliverables or instructions..."
                    className="w-full p-2 bg-slate-50 border border-blue-200 rounded-xl"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAssignTask}
                  disabled={saving}
                  className="w-full py-2 rounded-xl bg-[#2563EB] text-white font-bold cursor-pointer shadow-xs"
                >
                  {saving ? "Saving..." : "Confirm Task Assignment"}
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Administrative Reason (Required) *:
                  </label>
                  <textarea
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    rows={3}
                    placeholder="Reason for suspension or reinstatement..."
                    className="w-full p-2 bg-slate-50 border border-blue-200 rounded-xl"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("active")}
                    disabled={saving}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                  >
                    Set Active
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("suspended")}
                    disabled={saving}
                    className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                  >
                    Suspend Access
                  </button>
                </div>
              </div>
            )}

            {actionMsg && (
              <div
                className={`p-2.5 rounded-xl text-xs ${
                  actionMsg.type === "success"
                    ? "bg-[#EFF6FF] text-emerald-800 border border-blue-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {actionMsg.text}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
