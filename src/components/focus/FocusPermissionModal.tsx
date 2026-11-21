"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Lock, 
  X, 
  Check, 
  AlertTriangle, 
  Clock, 
  Sparkles,
  Smartphone,
  ExternalLink
} from "lucide-react";
import { DistractionTarget, DISTRACTION_TARGETS } from "@/lib/focus-tokens";

interface FocusPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMinutes: number;
  subjectName: string;
  selectedTargets: string[];
  xpReward: number;
  onConfirmAndStart: () => void;
}

export default function FocusPermissionModal({
  isOpen,
  onClose,
  targetMinutes,
  subjectName,
  selectedTargets,
  xpReward,
  onConfirmAndStart,
}: FocusPermissionModalProps) {
  const [closedSocialMedia, setClosedSocialMedia] = useState(false);
  const [closedGamesAndChat, setClosedGamesAndChat] = useState(false);
  const [committedToFocus, setCommittedToFocus] = useState(false);

  if (!isOpen) return null;

  const allConsented = closedSocialMedia && closedGamesAndChat && committedToFocus;

  const targetNames = DISTRACTION_TARGETS.filter((t) =>
    selectedTargets.includes(t.id)
  ).map((t) => t.name);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="liquid-glass-card bg-white/95 backdrop-blur-2xl border-white/90 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 font-sans">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 border border-amber-500/30 flex items-center justify-center shrink-0 font-bold shadow-xs">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="liquid-pill text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-500/15 border-amber-500/25 px-2 py-0.5">
                  Protocol Consent
                </span>
                <span className="text-[11px] font-medium text-slate-500">Deep Work Lock</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                Permission &amp; Distraction Lock Agreement
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Target Summary Capsule */}
          <div className="p-4 rounded-xl liquid-glass-card bg-white/60 border-white/80 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-900">
                <Clock className="w-4 h-4 text-blue-600" />
                Target Duration: <strong>{targetMinutes} Minutes</strong>
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Reward: +{xpReward} Focus XP
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200/60 text-xs">
              <span className="font-semibold text-slate-900 block">Study Goal:</span>
              <p className="text-slate-600 font-normal">{subjectName}</p>
            </div>

            <div className="pt-2 border-t border-slate-200/60">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                Restricted Distraction Targets ({targetNames.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {targetNames.map((name) => (
                  <span
                    key={name}
                    className="liquid-pill px-2.5 py-0.5 bg-rose-500/10 border-rose-500/20 text-[11px] font-medium text-rose-800"
                  >
                    🚫 {name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* User Permission & Action Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Required Student Commitments (Tick to Confirm):</span>
            </h4>

            {/* Item 1: Social Media Closure */}
            <label
              onClick={() => setClosedSocialMedia(!closedSocialMedia)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                closedSocialMedia
                  ? "bg-emerald-500/10 border-emerald-500/30 backdrop-blur-xs"
                  : "liquid-glass-card bg-white/50 border-white/70 hover:bg-white"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                  closedSocialMedia ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-200"
                }`}
              >
                {closedSocialMedia && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-slate-900 block">
                  I confirm closing Instagram, Snapchat &amp; Social Feeds
                </span>
                <p className="text-slate-600 font-normal text-[11px] leading-relaxed">
                  I have closed all open tabs, phone notifications, or windows for Instagram, Snapchat, YouTube, and TikTok.
                </p>
              </div>
            </label>

            {/* Item 2: Games & Chat */}
            <label
              onClick={() => setClosedGamesAndChat(!closedGamesAndChat)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                closedGamesAndChat
                  ? "bg-emerald-500/10 border-emerald-500/30 backdrop-blur-xs"
                  : "liquid-glass-card bg-white/50 border-white/70 hover:bg-white"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                  closedGamesAndChat ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-200"
                }`}
              >
                {closedGamesAndChat && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-slate-900 block">
                  I confirm closing Discord, Steam &amp; Game Launchers
                </span>
                <p className="text-slate-600 font-normal text-[11px] leading-relaxed">
                  I will not open gaming clients or active group chats until the learning block is accomplished.
                </p>
              </div>
            </label>

            {/* Item 3: Grant Permission to Enforce Lock */}
            <label
              onClick={() => setCommittedToFocus(!committedToFocus)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                committedToFocus
                  ? "bg-emerald-500/10 border-emerald-500/30 backdrop-blur-xs"
                  : "liquid-glass-card bg-white/50 border-white/70 hover:bg-white"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                  committedToFocus ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-200"
                }`}
              >
                {committedToFocus && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-slate-900 block">
                  I give EdWorld permission to monitor &amp; restrict distractions
                </span>
                <p className="text-slate-600 font-normal text-[11px] leading-relaxed">
                  If I switch tabs or open restricted sites, EdWorld will immediately trigger a Distraction Shield and record a strike.
                </p>
              </div>
            </label>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium text-[11px]">
              Tip: Install the <strong>EdWorld Focus Guard</strong> extension for automatic URL blocking in Chrome/Edge.
            </span>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-200/60 flex items-center justify-between gap-3 bg-white/70 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="liquid-btn-secondary px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!allConsented}
            onClick={onConfirmAndStart}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              allConsented
                ? "liquid-btn-primary cursor-pointer shadow-md"
                : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
            }`}
          >
            <Lock className="w-4 h-4 text-amber-300" />
            <span>Lock In &amp; Begin {targetMinutes}m Study Session</span>
          </button>
        </div>

      </div>
    </div>
  );
}
