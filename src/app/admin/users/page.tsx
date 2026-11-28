"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  ArrowLeft, 
  X, 
  ChevronRight, 
  Mail, 
  GraduationCap, 
  Building2, 
  ShieldCheck, 
  Edit3, 
  AlertCircle, 
  RotateCcw,
  Check
} from "lucide-react";

interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  college: string;
  degree_year: string;
  career_stage: string;
  primary_goal: string;
  role: string;
  is_suspended: boolean;
  created_at: string;
}

export default function AdminUsersDirectoryPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Profile Correction State
  const [editingUser, setEditingUser] = useState<DirectoryUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editCollege, setEditCollege] = useState("");
  const [editDegreeYear, setEditDegreeYear] = useState("");
  const [editCareerStage, setEditCareerStage] = useState("");
  const [editPrimaryGoal, setEditPrimaryGoal] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [correctionMsg, setCorrectionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const url = `/api/admin/directory?college=${collegeFilter}&role=${roleFilter}&status=${statusFilter}&search=${searchQuery}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.warn("Could not load users directory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [collegeFilter, roleFilter, statusFilter]);

  const handleOpenEdit = (target: DirectoryUser) => {
    setEditingUser(target);
    setEditName(target.name);
    setEditCollege(target.college);
    setEditDegreeYear(target.degree_year);
    setEditCareerStage(target.career_stage);
    setEditPrimaryGoal(target.primary_goal);
    setReason("");
    setCorrectionMsg(null);
  };

  const handleSaveCorrection = async () => {
    if (!editingUser) return;
    if (!reason.trim()) {
      setCorrectionMsg({ type: "error", text: "A clear reason is required for administrative audit trail." });
      return;
    }

    try {
      setSaving(true);
      setCorrectionMsg(null);

      const fieldsToUpdate: any = {};
      if (editName !== editingUser.name) fieldsToUpdate.name = editName;
      if (editCollege !== editingUser.college) fieldsToUpdate.institution = editCollege;
      if (editDegreeYear !== editingUser.degree_year) fieldsToUpdate.grade_level = editDegreeYear;
      if (editCareerStage !== editingUser.career_stage) fieldsToUpdate.career_stage = editCareerStage;
      if (editPrimaryGoal !== editingUser.primary_goal) fieldsToUpdate.primary_goal = editPrimaryGoal;

      if (Object.keys(fieldsToUpdate).length === 0) {
        setCorrectionMsg({ type: "error", text: "No fields were modified." });
        setSaving(false);
        return;
      }

      const res = await fetch("/api/admin/directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: editingUser.id,
          fieldsToUpdate,
          reason,
          notifyStudent: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCorrectionMsg({ type: "success", text: "Profile details updated and recorded in audit log." });
        setTimeout(() => {
          setEditingUser(null);
          fetchUsers();
        }, 1200);
      } else {
        setCorrectionMsg({ type: "error", text: data.error || "Failed to update profile." });
      }
    } catch (err: any) {
      setCorrectionMsg({ type: "error", text: err.message || "Failed to save profile correction." });
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
              Staff Directory &amp; Audit
            </span>
            <h1 className="text-xl sm:text-2xl font-black font-display text-slate-900 mt-1">
              Authorized Student Profile Management
            </h1>
          </div>
          <Link
            href="/admin"
            className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-blue-200 text-xs font-bold text-slate-700 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Queue</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
              placeholder="Search student or email..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-blue-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-blue-200 text-xs text-slate-700 font-medium"
          >
            <option value="all">All Roles</option>
            <option value="STUDENT">Students</option>
            <option value="AMBASSADOR">Ambassadors</option>
            <option value="ADMIN">Administrators</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-blue-200 text-xs text-slate-700 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="suspended">Suspended Accounts</option>
          </select>

          <button
            type="button"
            onClick={fetchUsers}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-[#2563EB] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="border-blue-200/80 overflow-hidden border-b">
        <div className="p-4 sm:p-5 border-b border-blue-100 flex items-center justify-between">
          <div className="text-sm font-black font-display text-slate-900">
            Student Records ({users.length})
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 font-mono text-xs">
            Loading student directory...
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No student records matching filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{u.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {u.role}
                    </span>
                    {u.is_suspended && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        Suspended
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {u.email} • {u.college} ({u.degree_year})
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Goal: {u.primary_goal}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(u)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-[#EFF6FF] hover:text-[#2563EB] text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Correct Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Correction Modal with Proposed vs Current Values & Audit Reason */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-3xl border border-blue-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded">
                  Staff Profile Correction
                </span>
                <h3 className="text-base font-black font-display text-slate-900 mt-1">
                  {editingUser.name} ({editingUser.email})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Close
              </button>
            </div>

            {/* Current vs Proposed Side-by-Side Review */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Student Display Name:</label>
                <div className="text-[11px] text-slate-400 mb-1">Current: {editingUser.name}</div>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-blue-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">College / University:</label>
                <div className="text-[11px] text-slate-400 mb-1">Current: {editingUser.college}</div>
                <input
                  type="text"
                  value={editCollege}
                  onChange={(e) => setEditCollege(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-blue-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Grade / Degree Year:</label>
                <div className="text-[11px] text-slate-400 mb-1">Current: {editingUser.degree_year}</div>
                <input
                  type="text"
                  value={editDegreeYear}
                  onChange={(e) => setEditDegreeYear(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-blue-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Primary Career Goal:</label>
                <div className="text-[11px] text-slate-400 mb-1">Current: {editingUser.primary_goal}</div>
                <input
                  type="text"
                  value={editPrimaryGoal}
                  onChange={(e) => setEditPrimaryGoal(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-blue-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Reason for Profile Correction (Recorded to Audit Trail) <span className="text-rose-600">*</span>:
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Student submitted official college ID showing corrected university spelling..."
                  className="w-full p-2 bg-slate-50 border border-blue-200 rounded-xl"
                />
              </div>
            </div>

            {correctionMsg && (
              <div
                className={`p-2.5 rounded-xl text-xs ${
                  correctionMsg.type === "success"
                    ? "bg-[#EFF6FF] text-emerald-800 border border-blue-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {correctionMsg.text}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-blue-100">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCorrection}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {saving ? "Saving..." : "Save Approved Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
