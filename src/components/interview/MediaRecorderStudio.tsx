"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  RotateCcw, 
  Send, 
  Sparkles,
  Volume2,
  VolumeX,
  AlertCircle,
  Clock,
  Radio,
  CheckCircle2,
  Check,
  Activity,
  ChevronRight,
  Keyboard,
  ArrowRight,
  ShieldCheck,
  Flame,
  HelpCircle,
  Pause,
  FileCode2,
  X,
  MessageSquare,
  Maximize2
} from "lucide-react";
import MyraInterviewerAvatar, { MyraState } from "./MyraInterviewerAvatar";
import FullScreenLockdownModal from "./FullScreenLockdownModal";
import { VoiceChoice, VOICE_PROFILES } from "@/lib/interview/voice-profiles";

interface MediaRecorderStudioProps {
  questionText: string;
  category: string;
  difficultyLevel: 0 | 1 | 2;
  suggestedDurationSeconds?: number;
  userId?: string;
  sessionId?: string;
  questionId?: string;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  adaptiveFocus?: string;
  targetRole?: string;
  companyTrack?: string;
  resumeContext?: string;
  voiceChoice?: VoiceChoice;
  speakingSpeed?: number;
  audioOptIn?: boolean;
  initialUseKeyboardFallback?: boolean;
  onSubmitSession: (sessionData: {
    audioBase64?: string;
    videoUrl?: string;
    transcript: string;
    durationSeconds: number;
    isAudioOnly?: boolean;
    voiceOptIn?: boolean;
    scratchpadNotes?: string;
    fullscreenExitEvents?: Array<{ timestamp: string; questionIndex: number }>;
  }) => Promise<void>;
}

export default function MediaRecorderStudio({
  questionText,
  category,
  difficultyLevel,
  suggestedDurationSeconds = 120,
  userId = "user",
  sessionId = "session",
  questionId = "q",
  currentQuestionIndex = 1,
  totalQuestions = 3,
  adaptiveFocus,
  targetRole = "Software Engineer",
  companyTrack = "Big Tech (FAANG)",
  resumeContext = "",
  voiceChoice = "elena-tech-lead",
  speakingSpeed = 1.0,
  audioOptIn = false,
  initialUseKeyboardFallback = false,
  onSubmitSession,
}: MediaRecorderStudioProps) {
  // Media streams & modes
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [useKeyboardMode, setUseKeyboardMode] = useState(initialUseKeyboardFallback);

  // Active question & follow-up state
  const [activePromptText, setActivePromptText] = useState(questionText);
  const [isFollowUpRound, setIsFollowUpRound] = useState(false);
  const [followUpReference, setFollowUpReference] = useState<string | null>(null);

  // Continuous Live Voice Loop State
  const [recordingState, setRecordingState] = useState<"idle" | "speaking_question" | "recording" | "evaluating_turn" | "submitting">("idle");
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [answerError, setAnswerError] = useState("");
  const primaryAnswerRef = useRef("");
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);
  const [isThinkingPaused, setIsThinkingPaused] = useState<boolean>(false);

  // Technical Scratchpad
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [scratchpadText, setScratchpadText] = useState("");

  // Decibel audio level meter
  const [audioMeterLevel, setAudioMeterLevel] = useState<number>(10);

  // Interviewer Voice Avatar State
  const [isMyraVoiceMuted, setIsMyraVoiceMuted] = useState(false);
  const [isMyraSpeaking, setIsMyraSpeaking] = useState(false);
  const [bargeInDetected, setBargeInDetected] = useState(false);

  // Fullscreen Lockdown State
  const [isLockdownActive, setIsLockdownActive] = useState(true);
  const [fullscreenExitEvents, setFullscreenExitEvents] = useState<Array<{ timestamp: string; questionIndex: number }>>([]);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const lastSpokenTimestampRef = useRef<number>(Date.now());
  const activePromptRef = useRef<string>(questionText);

  const persona = VOICE_PROFILES[voiceChoice] || VOICE_PROFILES["elena-tech-lead"];

  // Keep activePromptRef in sync
  useEffect(() => {
    activePromptRef.current = activePromptText;
  }, [activePromptText]);

  // Update prompt whenever incoming base question changes
  useEffect(() => {
    setActivePromptText(questionText);
    setIsFollowUpRound(false);
    setFollowUpReference(null);
    setLiveTranscript("");
    setAnswerError("");
    primaryAnswerRef.current = "";
    setSecondsElapsed(0);
    setIsThinkingPaused(false);
    triggerQuestionSpeech(questionText);
  }, [questionText]);

  // 1. Initialize Camera & Mic
  useEffect(() => {
    if (useKeyboardMode) return;

    async function startMedia() {
      try {
        const userMedia = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(userMedia);
        setIsAudioOnly(false);
        if (videoRef.current) videoRef.current.srcObject = userMedia;
      } catch (err) {
        try {
          const audioMedia = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          setStream(audioMedia);
          setIsAudioOnly(true);
        } catch (e) {
          console.warn("[Media Permissions Note]:", e);
          setUseKeyboardMode(true);
        }
      }
    }
    startMedia();

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
    };
  }, [useKeyboardMode]);

  // 2. Setup Web Speech Recognition
  useEffect(() => {
    if (useKeyboardMode) return;

    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = "en-US";

        recog.onresult = (event: any) => {
          let fullText = "";
          for (let i = 0; i < event.results.length; i++) {
            fullText += event.results[i][0].transcript + " ";
          }
          const trimmed = fullText.trim();
          setLiveTranscript(trimmed);
          lastSpokenTimestampRef.current = Date.now();
          setAudioMeterLevel(Math.min(95, 30 + Math.floor(Math.random() * 55)));

          // BARGE-IN: If candidate speaks while interviewer is speaking, halt interviewer immediately
          if (isMyraSpeaking) {
            handleBargeIn();
          }

          if (!isThinkingPaused) {
            resetSilenceDetection();
          }
        };

        recog.onerror = (err: any) => {
          console.warn("[Speech Recognition Event Note]:", err?.error);
        };

        recog.onend = () => {
          if (recordingState === "recording" && !useKeyboardMode) {
            try { recog.start(); } catch (e) {}
          }
        };

        recognitionRef.current = recog;
      } else {
        console.warn("[Web Speech Not Supported - Switching to Typed Mode]");
        setUseKeyboardMode(true);
      }
    }
  }, [isMyraSpeaking, recordingState, useKeyboardMode, isThinkingPaused]);

  // 3. Trigger Question Speech
  const triggerQuestionSpeech = (promptToSpeak: string) => {
    setIsMyraSpeaking(true);
    setRecordingState("speaking_question");
    setSilenceCountdown(null);

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
  };

  // 4. Handle Barge-In
  const handleBargeIn = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsMyraSpeaking(false);
    setBargeInDetected(true);
    if (recordingState !== "recording") {
      startListeningToCandidate();
    }
    setTimeout(() => setBargeInDetected(false), 2000);
  };

  // 5. Speech Finished -> Open Mic & Start Listening
  const handleMyraSpeechEnd = () => {
    setIsMyraSpeaking(false);
    startListeningToCandidate();
  };

  const startListeningToCandidate = () => {
    setRecordingState("recording");
    lastSpokenTimestampRef.current = Date.now();

    if (recognitionRef.current && !useKeyboardMode) {
      try {
        recognitionRef.current.start();
      } catch (e) {}
    }

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    if (!isThinkingPaused) {
      resetSilenceDetection();
    }
  };

  // 6. Silence Detection Timer (~3.5s of silence after candidate has spoken)
  const resetSilenceDetection = useCallback(() => {
    if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
    setSilenceCountdown(null);

    silenceTimerRef.current = setInterval(() => {
      if (isThinkingPaused) return;

      const elapsedSinceSpoken = Date.now() - lastSpokenTimestampRef.current;
      const wordCount = liveTranscript.trim().split(/\s+/).filter(Boolean).length;

      if (wordCount >= 6 && elapsedSinceSpoken >= 2200) {
        setSilenceCountdown(2);
        if (elapsedSinceSpoken >= 3800) {
          clearInterval(silenceTimerRef.current!);
          setSilenceCountdown(null);
          handleFinishAnswer();
        }
      }
    }, 500);
  }, [liveTranscript, isThinkingPaused]);

  // 7. Request Thinking Pause
  const handleRequestThinkingPause = () => {
    setIsThinkingPaused(true);
    setSilenceCountdown(null);
    if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
    
    // Automatically resume listening after 30 seconds
    setTimeout(() => {
      setIsThinkingPaused(false);
      lastSpokenTimestampRef.current = Date.now();
    }, 30000);
  };

  // 8. Candidate Finishes Answer
  const handleFinishAnswer = async () => {
    const answerText = liveTranscript.trim();
    if (!answerText) {
      setAnswerError("No answer was captured. Try speaking again or switch to typing.");
      return;
    }
    setAnswerError("");
    if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    setRecordingState("evaluating_turn");

    const transcript = isFollowUpRound && primaryAnswerRef.current
      ? [primaryAnswerRef.current, answerText].join("\n\n")
      : answerText;

    try {
      const res = await fetch("/api/interview/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: activePromptRef.current,
          candidateTranscript: answerText,
          isFollowUp: isFollowUpRound,
          questionIndex: currentQuestionIndex,
          totalQuestions,
          targetRole,
          category,
          resumeContext,
          userId,
          sessionId,
        }),
      });

      const data = await res.json();

      if (data.action === "repeat") {
        triggerQuestionSpeech(activePromptRef.current);
        return;
      }

      if (data.action === "follow_up" && data.followUpQuestion && !isFollowUpRound) {
        primaryAnswerRef.current = answerText;
        setIsFollowUpRound(true);
        setFollowUpReference(data.referencedPhrase || null);
        setActivePromptText(data.followUpQuestion);
        setLiveTranscript("");
        triggerQuestionSpeech(data.followUpQuestion);
        return;
      }

      await submitCurrentQuestion(transcript);
    } catch (turnErr) {
      console.warn("[Turn Evaluation Fallback]:", turnErr);
      await submitCurrentQuestion(transcript);
    }
  };

  const submitCurrentQuestion = async (finalTranscript: string) => {
    setRecordingState("submitting");
    await onSubmitSession({
      transcript: finalTranscript,
      durationSeconds: Math.max(15, secondsElapsed),
      isAudioOnly,
      voiceOptIn: audioOptIn,
      scratchpadNotes: scratchpadText,
      fullscreenExitEvents,
    });
  };

  // Toggle Camera Track
  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Toggle Mic Track
  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  const getMyraState = (): MyraState => {
    if (recordingState === "submitting" || recordingState === "evaluating_turn") return "thinking";
    if (recordingState === "recording") return "listening";
    if (isMyraSpeaking || recordingState === "speaking_question") return "speaking";
    return "idle";
  };

  const currentWordCount = liveTranscript.trim().split(/\s+/).filter(Boolean).length;
  const currentPaceWpm = secondsElapsed > 0 ? Math.round((currentWordCount / secondsElapsed) * 60) : 0;

  return (
    <div className="relative bg-[#080C14] rounded-3xl overflow-hidden border border-white/10 shadow-2xl text-white select-none font-sans">
      
      {/* Fullscreen Lockdown Controller */}
      <FullScreenLockdownModal
        isActive={isLockdownActive}
        onExitConfirmed={() => {
          setIsLockdownActive(false);
          window.location.href = "/interviews";
        }}
        onWarningTriggered={(count, reason) => {
          setFullscreenExitEvents((prev) => [
            ...prev,
            { timestamp: new Date().toISOString(), questionIndex: currentQuestionIndex },
          ]);
        }}
      />

      {/* Top Meeting Room Navigation Bar */}
      <div className="px-5 py-3.5 bg-[#0C111E] border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>LIVE INTERVIEW</span>
          </div>

          <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white tracking-tight">
              {companyTrack}
            </span>
            <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
              Round {currentQuestionIndex} of {totalQuestions}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer Display */}
          <div className="text-xs font-mono font-bold bg-[#141B2D] px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 text-slate-200">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {recordingState === "recording" ? `${secondsElapsed}s / ${suggestedDurationSeconds}s` : `${suggestedDurationSeconds}s Target`}
            </span>
          </div>

          {/* Repeat Question Button */}
          <button
            type="button"
            onClick={() => triggerQuestionSpeech(activePromptText)}
            disabled={isMyraSpeaking || recordingState === "evaluating_turn"}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all text-slate-200 disabled:opacity-40 cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Repeat Question</span>
          </button>

          {/* Toggle Scratchpad Button */}
          <button
            type="button"
            onClick={() => setIsScratchpadOpen(!isScratchpadOpen)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isScratchpadOpen
                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>{isScratchpadOpen ? "Hide Scratchpad" : "Scratchpad"}</span>
          </button>
        </div>
      </div>

      {/* Main Video Meeting Grid (Google Meet / Zoom Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 sm:p-5 items-stretch">
        
        {/* LEFT TILE: Interviewer Persona Video Feed */}
        <div className={`${isScratchpadOpen ? "lg:col-span-5" : "lg:col-span-6"} min-h-[420px] transition-all duration-300`}>
          <MyraInterviewerAvatar
            state={getMyraState()}
            questionText={activePromptText}
            isAudioMuted={isMyraVoiceMuted}
            voiceChoice={voiceChoice}
            speakingSpeed={speakingSpeed}
            companyTrack={companyTrack}
            onToggleMute={() => setIsMyraVoiceMuted(!isMyraVoiceMuted)}
            onSpeechEnd={handleMyraSpeechEnd}
          />
        </div>

        {/* RIGHT TILE: Candidate Webcam Feed & Live Transcription */}
        <div className={`${isScratchpadOpen ? "lg:col-span-7" : "lg:col-span-6"} relative min-h-[420px] bg-[#0E131F] rounded-3xl overflow-hidden border border-white/10 flex flex-col justify-between p-4 sm:p-5 shadow-xl transition-all duration-300`}>
          
          {/* Top Video Header */}
          <div className="flex items-center justify-between z-10 pb-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-white flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${recordingState === "recording" ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
                <span>You (Candidate)</span>
              </span>

              {bargeInDetected && (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-md animate-pulse">
                  Barge-in active
                </span>
              )}
            </div>

            {/* In-Call Media Toggles */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMic}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  micEnabled
                    ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    : "bg-red-500/20 border-red-500/40 text-red-400"
                }`}
                title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
              >
                {micEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={toggleCamera}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  videoEnabled
                    ? "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    : "bg-red-500/20 border-red-500/40 text-red-400"
                }`}
                title={videoEnabled ? "Turn Off Camera" : "Turn On Camera"}
              >
                {videoEnabled ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Candidate Webcam Stream or Audio Active Card */}
          {!useKeyboardMode && !isAudioOnly && stream ? (
            <div className="relative w-full aspect-video max-h-56 rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-inner my-2">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity ${videoEnabled ? "opacity-100" : "opacity-0"}`}
              />
              {!videoEnabled && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-1">
                  <VideoOff className="w-8 h-8 text-slate-500" />
                  <span className="text-xs">Camera is paused</span>
                </div>
              )}

              {/* Decibel Audio Indicator Badge */}
              <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono text-white flex items-center gap-1.5 border border-white/10">
                <span className="text-emerald-400 font-bold">MIC</span>
                <div className="w-12 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-75 rounded-full"
                    style={{ width: `${micEnabled && recordingState === "recording" ? audioMeterLevel : 5}%` }}
                  />
                </div>
              </div>
            </div>
          ) : !useKeyboardMode ? (
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2 my-2">
              <Mic className="w-8 h-8 text-emerald-400 mx-auto animate-pulse" />
              <div className="text-xs font-bold text-white">Microphone Active &bull; Audio Interview Mode</div>
              <p className="text-[11px] text-slate-400">Speak clearly when responding to the interviewer.</p>
            </div>
          ) : null}

          {/* Active Question Banner */}
          <div className="edworld-blue-card p-3.5 rounded-2xl  border border-white/10 space-y-1 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block">
                {isFollowUpRound ? `${persona.interviewerName}'s Follow-Up Probe` : "Current Interview Question"}
              </span>
              {followUpReference && (
                <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                  Ref: &ldquo;{followUpReference}&rdquo;
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-white leading-snug">
              {activePromptText}
            </p>
          </div>

          {/* KEYBOARD / TYPED MODE FALLBACK */}
          {useKeyboardMode ? (
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Type Your Technical Answer:</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {currentWordCount} words
                </span>
              </div>
              <textarea
                rows={4}
                value={liveTranscript}
                onChange={(e) => setLiveTranscript(e.target.value)}
                placeholder="Type your response using the STAR method (Situation, Task, Action, Result)..."
                className="w-full p-3 rounded-2xl bg-[#141B2D] border border-white/15 text-xs text-white focus:outline-none focus:border-emerald-400 transition-all font-mono"
              />
            </div>
          ) : (
            /* LIVE REAL-TIME TRANSCRIPT HUD */
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live Speech-to-Text:</span>
                </span>
                {recordingState === "recording" && (
                  <span className="font-mono text-slate-400">
                    {currentWordCount} words &bull; ~{currentPaceWpm} WPM
                  </span>
                )}
              </div>

              <div className="edworld-blue-card p-3 rounded-2xl  border border-white/10 min-h-[70px] max-h-28 overflow-y-auto">
                <p className="text-xs text-slate-200 leading-relaxed italic font-sans">
                  {liveTranscript || (
                    <span className="text-slate-500 not-italic">
                      {recordingState === "recording"
                        ? "Listening... speak your response aloud."
                        : isMyraSpeaking
                        ? `Listen to ${persona.interviewerName}'s question above.`
                        : "Ready to answer."}
                    </span>
                  )}
                </p>
              </div>

              {/* Silence & Thinking Countdown Indicator */}
              {silenceCountdown !== null && (
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] font-bold text-amber-300 text-center animate-pulse">
                  Silence detected &bull; Advancing in {silenceCountdown}s... (Click &ldquo;Need a Moment&rdquo; to pause)
                </div>
              )}

              {isThinkingPaused && (
                <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-[11px] font-bold text-indigo-300 text-center">
                  Thinking pause active &bull; Take your time, resume speaking whenever ready.
                </div>
              )}

              {/* Real-Time Live STAR Method Guidance HUD */}
              {(() => {
                const transcriptLower = liveTranscript.toLowerCase();
                const hasSituation = Boolean(transcriptLower.match(/\b(when|at|during|project|context|company|team|client|scenario|system)\b/));
                const hasTask = Boolean(transcriptLower.match(/\b(task|goal|needed to|responsible for|objective|requirement|challenge|problem)\b/));
                const hasAction = Boolean(transcriptLower.match(/\b(i implemented|i built|i designed|i led|i created|i refactored|i decided|my approach|we used|i optimized|i handled)\b/));
                const hasResult = Boolean(transcriptLower.match(/\b(result|increased|reduced|improved|percent|%|achieved|delivered|outcome|latency|saved|speedup)\b/));

                return (
                  <div className="edworld-blue-card p-2.5 rounded-2xl  border border-white/10 flex items-center justify-between flex-wrap gap-2 text-[10px]">
                    <span className="font-mono font-bold uppercase tracking-wider text-slate-400">
                      STAR Score:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border transition-all ${
                        hasSituation ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-white/5 text-slate-500 border-white/5"
                      }`}>
                        {hasSituation && <Check className="w-2.5 h-2.5 text-emerald-400" />}
                        <span>Situation</span>
                      </span>

                      <span className={`px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border transition-all ${
                        hasTask ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-white/5 text-slate-500 border-white/5"
                      }`}>
                        {hasTask && <Check className="w-2.5 h-2.5 text-emerald-400" />}
                        <span>Task</span>
                      </span>

                      <span className={`px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border transition-all ${
                        hasAction ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-white/5 text-slate-500 border-white/5"
                      }`}>
                        {hasAction && <Check className="w-2.5 h-2.5 text-emerald-400" />}
                        <span>Action</span>
                      </span>

                      <span className={`px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border transition-all ${
                        hasResult ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-white/5 text-slate-500 border-white/5"
                      }`}>
                        {hasResult && <Check className="w-2.5 h-2.5 text-emerald-400" />}
                        <span>Result</span>
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Action Button Controls */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 mt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRequestThinkingPause}
                disabled={isThinkingPaused || recordingState !== "recording"}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isThinkingPaused
                    ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                    : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
                title="Pause silence timer for 30s to think"
              >
                <Pause className="w-3 h-3 text-amber-400" />
                <span>Need a Moment</span>
              </button>

              {!useKeyboardMode && (
                <button
                  type="button"
                  onClick={() => setUseKeyboardMode(true)}
                  className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Type Answer
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => submitCurrentQuestion(liveTranscript || "[Skipped question]")}
                disabled={recordingState === "submitting" || recordingState === "evaluating_turn"}
                className="px-3.5 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Skip Question
              </button>

              <button
                type="button"
                onClick={handleFinishAnswer}
                disabled={recordingState === "submitting" || recordingState === "evaluating_turn" || isMyraSpeaking}
                aria-describedby={answerError ? "interview-answer-error" : undefined}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {recordingState === "evaluating_turn" ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-black" />
                    <span>Evaluating answer...</span>
                  </>
                ) : (
                  <>
                    <span>I&apos;m Done Answering</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
              {answerError && <p id="interview-answer-error" role="alert" className="text-sm text-rose-700">{answerError}</p>}
            </div>
          </div>

        </div>

      </div>

      {/* Collapsible Slide-Out Technical Scratchpad Drawer */}
      {isScratchpadOpen && (
        <div className="p-4 bg-[#0C111E] border-t border-white/10 transition-all animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white">Technical Scratchpad &amp; Architecture Notes</span>
              <span className="text-[10px] text-slate-400">(Draft pseudo-code, data structures, or trade-offs while speaking)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsScratchpadOpen(false)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            rows={5}
            value={scratchpadText}
            onChange={(e) => setScratchpadText(e.target.value)}
            placeholder="// Sketch your approach, system components, API contracts, or STAR points here...&#10;function solution() {&#10;  // draft logic&#10;}"
            className="w-full p-3 rounded-2xl bg-[#080C14] border border-white/10 text-xs font-mono text-emerald-300 focus:outline-none focus:border-indigo-400"
          />
        </div>
      )}

    </div>
  );
}
