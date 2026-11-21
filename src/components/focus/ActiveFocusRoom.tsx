"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  Sparkles, 
  Award, 
  RotateCcw,
  BookOpen,
  ArrowRight,
  Lock,
  Pause,
  Play
} from "lucide-react";
import { FocusSessionState } from "@/hooks/useFocusLock";
import { DISTRACTION_TARGETS } from "@/lib/focus-tokens";

interface ActiveFocusRoomProps {
  session: FocusSessionState;
  onReset: () => void;
  onTriggerEmergencyUnlock: () => void;
}

export default function ActiveFocusRoom({
  session,
  onReset,
  onTriggerEmergencyUnlock,
}: ActiveFocusRoomProps) {
  // Ambient Sound Generator via Web Audio API
  const [ambientSound, setAmbientSound] = useState<"off" | "rain" | "whitenoise">("off");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundNodeRef = useRef<AudioNode | null>(null);

  const toggleSound = (type: "rain" | "whitenoise") => {
    if (ambientSound === type) {
      stopAmbientSound();
      setAmbientSound("off");
      return;
    }

    stopAmbientSound();
    playAmbientSound(type);
    setAmbientSound(type);
  };

  const playAmbientSound = (type: "rain" | "whitenoise") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      if (type === "whitenoise") {
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
      } else {
        // Rain sound (Brownian noise)
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        }
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      if (type === "rain") {
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
      } else {
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.Q.setValueAtTime(1, ctx.currentTime);
      }

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      whiteNoise.start(0);
      soundNodeRef.current = whiteNoise;
    } catch (e) {
      console.warn("Ambient sound initialization failed:", e);
    }
  };

  const stopAmbientSound = () => {
    try {
      if (soundNodeRef.current) {
        (soundNodeRef.current as any).stop?.();
        soundNodeRef.current.disconnect();
        soundNodeRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch (e) {
      // Ignore audio teardown error
    }
  };

  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        ((session.totalDurationSeconds - session.remainingSeconds) /
          session.totalDurationSeconds) *
          100
      )
    )
  );

  const blockedNames = DISTRACTION_TARGETS.filter((t) =>
    session.blockedTargets.includes(t.id)
  ).map((t) => t.name);

  // SESSION COMPLETED SCREEN
  if (session.isCompleted) {
    return (
      <div className="liquid-glass-card p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-sm">
          <Award className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="liquid-pill inline-block px-3 py-1 bg-emerald-500/20 text-emerald-800 text-xs font-semibold border-emerald-500/30">
            Session Accomplished
          </span>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Deep Work Sprint Completed!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            You successfully completed your {Math.round(session.totalDurationSeconds / 60)}-minute study block on <strong>{session.subjectName}</strong> without falling into social media distractions!
          </p>
        </div>

        {/* XP Award Pill */}
        <div className="liquid-pill inline-flex items-center gap-2 px-4 py-2 bg-amber-500/15 border-amber-500/30 text-amber-900 font-bold text-sm shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>+{session.xpAwarded} Deep Work Focus XP Awarded!</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-200/60">
          <button
            onClick={onReset}
            className="liquid-btn-secondary px-5 py-2.5 text-xs font-semibold cursor-pointer"
          >
            Start Another Focus Session
          </button>

          <Link
            href="/dashboard"
            className="liquid-btn-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Return to Dashboard</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      
      {/* 1. MAIN CLOCK CANVAS */}
      <div className="liquid-glass-card p-8 sm:p-12 text-center space-y-6">
        
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="liquid-pill px-2.5 py-1 bg-amber-500/15 border-amber-500/25 text-amber-900 text-xs font-bold">
              Active Focus Lock
            </span>
            <span className="text-xs font-mono font-medium text-slate-500">
              {Math.round(session.totalDurationSeconds / 60)}m Block
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="liquid-pill text-xs font-medium px-2.5 py-1 bg-white/70 border-white/80 text-slate-800 flex items-center gap-1.5 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Strikes: {session.strikeCount} / {session.maxStrikes}</span>
            </span>
          </div>
        </div>

        {/* Large Digital Clock */}
        <div className="py-4 space-y-1">
          <span className="text-6xl sm:text-7xl lg:text-8xl font-black text-slate-900 font-mono tracking-tight select-none">
            {formatTime(session.remainingSeconds)}
          </span>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest font-mono">
            Focus Countdown Active
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 max-w-lg mx-auto">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Session Progress</span>
            <span className="font-semibold text-slate-900">{progressPercent}% Complete</span>
          </div>

          <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/60">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Target Study Subject Quick Action */}
        <div className="liquid-glass-card bg-white/70 border-white/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              Target Learning Module
            </span>
            <h4 className="text-sm font-bold text-slate-900">{session.subjectName}</h4>
          </div>

          <Link
            href={session.subjectHref}
            className="liquid-btn-primary px-4 py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-300" />
            <span>Open Study Arena</span>
            <ExternalLink className="w-3.5 h-3.5 text-white" />
          </Link>
        </div>

        {/* Ambient Sound Toggles & Emergency Controls */}
        <div className="pt-4 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3">
          
          {/* Ambient Sounds */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-slate-800" />
              Ambient:
            </span>

            <button
              type="button"
              onClick={() => toggleSound("rain")}
              className={`liquid-pill px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                ambientSound === "rain"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white/70 text-slate-700 hover:text-slate-900 border-white/80"
              }`}
            >
              🌧️ Rain
            </button>

            <button
              type="button"
              onClick={() => toggleSound("whitenoise")}
              className={`liquid-pill px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                ambientSound === "whitenoise"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white/70 text-slate-700 hover:text-slate-900 border-white/80"
              }`}
            >
              📻 White Noise
            </button>

            {ambientSound !== "off" && (
              <button
                type="button"
                onClick={stopAmbientSound}
                className="p-1 rounded-md text-slate-500 hover:text-rose-600 cursor-pointer"
                title="Mute Ambient"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Emergency Unlock Trigger */}
          <button
            type="button"
            onClick={onTriggerEmergencyUnlock}
            className="text-xs font-medium text-slate-500 hover:text-rose-600 underline cursor-pointer"
          >
            Emergency Early Unlock
          </button>
        </div>

      </div>

      {/* 2. ACTIVE RESTRICTIONS CAPSULE */}
      <div className="liquid-glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-rose-600" />
            Restricted Social Media &amp; Games ({blockedNames.length})
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold">Shield Active</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {blockedNames.map((name) => (
            <span
              key={name}
              className="liquid-pill px-3 py-1 bg-rose-500/10 border-rose-500/20 text-xs font-medium text-rose-800 flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
              <span>{name}</span>
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}
