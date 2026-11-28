"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Mic, 
  Radio, 
  Brain, 
  CheckCircle2,
  Activity,
  Layers,
  ShieldCheck,
  Award
} from "lucide-react";
import { VOICE_PROFILES, VoiceChoice } from "@/lib/interview/voice-profiles";

export type MyraState = "idle" | "speaking" | "listening" | "thinking" | "feedback";
export type TeddyState = MyraState;

interface MyraInterviewerAvatarProps {
  state: MyraState;
  questionText?: string;
  isAudioMuted?: boolean;
  voiceChoice?: VoiceChoice;
  speakingSpeed?: number;
  companyTrack?: string;
  onToggleMute?: () => void;
  onSpeechEnd?: () => void;
}

export default function MyraInterviewerAvatar({
  state,
  questionText = "",
  isAudioMuted = false,
  voiceChoice = "elena-tech-lead",
  speakingSpeed = 1.0,
  companyTrack = "Big Tech (FAANG)",
  onToggleMute,
  onSpeechEnd,
}: MyraInterviewerAvatarProps) {
  const [speechActive, setSpeechActive] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [activeFrequencyLevels, setActiveFrequencyLevels] = useState<number[]>([15, 30, 45, 25, 55, 35, 20]);

  const persona = VOICE_PROFILES[voiceChoice] || VOICE_PROFILES["elena-tech-lead"];

  // Real-time animated frequency visualizer for voice
  useEffect(() => {
    let animId: NodeJS.Timeout;
    if (state === "speaking") {
      animId = setInterval(() => {
        setActiveFrequencyLevels([
          Math.floor(20 + Math.random() * 60),
          Math.floor(35 + Math.random() * 65),
          Math.floor(15 + Math.random() * 75),
          Math.floor(40 + Math.random() * 55),
          Math.floor(25 + Math.random() * 70),
          Math.floor(30 + Math.random() * 60),
          Math.floor(15 + Math.random() * 50),
        ]);
      }, 100);
    } else {
      setActiveFrequencyLevels([10, 10, 10, 10, 10, 10, 10]);
    }
    return () => clearInterval(animId);
  }, [state]);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Natural Neural Text-To-Speech triggered when interviewer speaks
  useEffect(() => {
    if (!synthRef.current) return;

    if (state === "speaking" && questionText && !isAudioMuted) {
      synthRef.current.cancel(); // Stop pending speech

      const utterance = new SpeechSynthesisUtterance(questionText);
      const profile = VOICE_PROFILES[voiceChoice] || VOICE_PROFILES["elena-tech-lead"];
      
      utterance.rate = Math.round((profile.defaultRate * speakingSpeed) * 100) / 100;
      utterance.pitch = profile.defaultPitch;

      // Select highest quality matching natural voice
      const voices = synthRef.current.getVoices();
      const matchedVoice = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          profile.voiceHints.some((hint) => v.name.toLowerCase().includes(hint.toLowerCase()))
      );
      if (matchedVoice) utterance.voice = matchedVoice;

      utterance.onstart = () => setSpeechActive(true);
      utterance.onend = () => {
        setSpeechActive(false);
        onSpeechEnd?.();
      };
      utterance.onerror = () => {
        setSpeechActive(false);
        onSpeechEnd?.();
      };

      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    } else {
      if (synthRef.current) synthRef.current.cancel();
      setSpeechActive(false);
    }

    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, [state, questionText, isAudioMuted, voiceChoice, speakingSpeed, onSpeechEnd]);

  const getStatusBadge = () => {
    switch (state) {
      case "speaking":
        return {
          label: "Speaking Question",
          color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          icon: Radio,
          dotColor: "bg-emerald-400 animate-ping",
        };
      case "listening":
        return {
          label: "Listening to Candidate...",
          color: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
          icon: Mic,
          dotColor: "bg-indigo-400 animate-pulse",
        };
      case "thinking":
        return {
          label: "Evaluating Architecture & Trade-offs...",
          color: "bg-amber-500/15 text-amber-300 border-amber-500/30",
          icon: Brain,
          dotColor: "bg-amber-400 animate-pulse",
        };
      case "feedback":
        return {
          label: "Formulating Question Probe",
          color: "bg-purple-500/15 text-purple-300 border-purple-500/30",
          icon: Sparkles,
          dotColor: "bg-purple-400",
        };
      case "idle":
      default:
        return {
          label: "Live Video Feed Ready",
          color: "bg-white/10 text-slate-300 border-white/10",
          icon: Sparkles,
          dotColor: "bg-emerald-400",
        };
    }
  };

  const badge = getStatusBadge();
  const IconComponent = badge.icon;

  return (
    <div className="edworld-blue-card relative w-full h-full flex flex-col justify-between p-5 sm:p-6  border border-white/10 rounded-3xl shadow-xl text-white overflow-hidden select-none">
      
      {/* Background Ambience Glow */}
      <div className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700 ${
        state === "speaking" ? "bg-emerald-500" : state === "listening" ? "bg-indigo-500" : "bg-blue-500"
      }`} />

      {/* Top Header: Participant Tag & Audio Controls */}
      <div className="w-full flex items-center justify-between z-10 gap-2">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md transition-all ${badge.color}`}>
          <span className={`w-2 h-2 rounded-full shrink-0 ${badge.dotColor}`} />
          <IconComponent className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{badge.label}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-400 hidden sm:inline-block">
            {companyTrack}
          </span>
          {onToggleMute && (
            <button
              type="button"
              onClick={onToggleMute}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isAudioMuted
                  ? "bg-rose-500/20 border-rose-500/30 text-rose-300 hover:bg-rose-500/30"
                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
              title={isAudioMuted ? "Unmute Interviewer" : "Mute Interviewer"}
              aria-label={isAudioMuted ? "Unmute Interviewer" : "Mute Interviewer"}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Center Video Frame with Interviewer Avatar & Live Frequency Waveform */}
      <div className="relative flex flex-col items-center justify-center my-auto z-10 py-4">
        
        {/* Pulsing Speaker Radiance */}
        {state === "speaking" && (
          <div className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full border border-emerald-400/30 animate-ping pointer-events-none" />
        )}

        {/* Video Tile Box */}
        <div
          className={`relative w-36 h-36 sm:w-48 sm:h-48 rounded-3xl overflow-hidden border-2 transition-all duration-300 shadow-2xl bg-[#141B2D] ${
            state === "speaking"
              ? "border-emerald-400 shadow-emerald-500/20 scale-105"
              : state === "listening"
              ? "border-indigo-400 shadow-indigo-500/10 scale-100"
              : "border-white/15"
          }`}
        >
          <Image
            src="/images/myra-avatar.png"
            alt={persona.interviewerName}
            fill
            priority
            className="object-cover object-top"
          />

          {/* Real-Time Live Frequency Waveform Overlay */}
          <div className="absolute bottom-0 inset-x-0 h-14 bg-gradient-to-t from-[#0E131F]/90 via-[#0E131F]/60 to-transparent flex items-end justify-center pb-2.5 gap-1.5 px-4">
            {activeFrequencyLevels.map((lvl, fIdx) => (
              <span
                key={fIdx}
                className={`w-1 rounded-full transition-all duration-100 ${
                  state === "speaking" ? "bg-emerald-400" : "bg-slate-500"
                }`}
                style={{ height: `${state === "speaking" ? Math.max(6, lvl / 3) : 4}px` }}
              />
            ))}
          </div>
        </div>

        {/* Participant Name Badge */}
        <div className="mt-4 text-center space-y-0.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-white shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{persona.interviewerName}</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {persona.roleTitle}
          </p>
        </div>
      </div>

      {/* Bottom Telemetry Strip */}
      <div className="w-full text-center z-10 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1 text-slate-400">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real-time voice telemetry active</span>
        </span>
        <span className="font-mono text-slate-500">HD 1080p • 60fps</span>
      </div>

    </div>
  );
}
