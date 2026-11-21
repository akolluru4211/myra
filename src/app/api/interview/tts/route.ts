import { NextRequest, NextResponse } from "next/server";
import { VOICE_PROFILES, VoiceChoice } from "@/lib/interview/voice-profiles";

export const dynamic = "force-dynamic";

// In-memory cache for synthesized speech metadata & static prompts
const TTS_AUDIO_CACHE = new Map<string, any>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { 
      text, 
      questionId, 
      voiceId = "elena-tech-lead", 
      speed = 1.0,
      candidateName = "Candidate",
      role = "Software Engineer",
      isIntro = false
    } = body;

    const chosenVoiceKey: VoiceChoice = VOICE_PROFILES[voiceId as VoiceChoice] ? (voiceId as VoiceChoice) : "elena-tech-lead";
    const voiceProfile = VOICE_PROFILES[chosenVoiceKey];

    let finalText = text;
    if (isIntro && voiceProfile.introGreeting) {
      finalText = voiceProfile.introGreeting(candidateName, role);
    }

    if (!finalText || typeof finalText !== "string") {
      return NextResponse.json(
        { error: "Text is required for TTS synthesis." }, 
        { status: 400 }
      );
    }
    
    // Clamp speed between 0.75x and 1.5x
    const numericSpeed = Math.min(Math.max(Number(speed) || 1.0, 0.75), 1.5);
    const finalRate = Math.round((voiceProfile.defaultRate * numericSpeed) * 100) / 100;

    const cacheKey = `${questionId || finalText.slice(0, 60)}_${chosenVoiceKey}_${finalRate}`;

    // Check cache
    if (TTS_AUDIO_CACHE.has(cacheKey)) {
      return NextResponse.json({
        success: true,
        cached: true,
        ...TTS_AUDIO_CACHE.get(cacheKey),
      });
    }

    // High quality speech synthesis parameters
    const synthesisData = {
      success: true,
      text: finalText,
      voiceId: voiceProfile.id,
      voiceName: voiceProfile.name,
      interviewerName: voiceProfile.interviewerName,
      roleTitle: voiceProfile.roleTitle,
      voiceHints: voiceProfile.voiceHints,
      rate: finalRate,
      pitch: voiceProfile.defaultPitch,
      bridgePhrases: voiceProfile.bridgePhrases,
      clientFallbackRequired: true,
      availableVoices: Object.values(VOICE_PROFILES).map(v => ({
        id: v.id,
        name: v.name,
        interviewerName: v.interviewerName,
        roleTitle: v.roleTitle,
        accent: v.accent,
      })),
    };

    TTS_AUDIO_CACHE.set(cacheKey, synthesisData);

    return NextResponse.json(synthesisData);
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      textOnlyFallback: true,
      error: err.message || "TTS error"
    });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    voices: Object.values(VOICE_PROFILES).map(v => ({
      id: v.id,
      name: v.name,
      interviewerName: v.interviewerName,
      roleTitle: v.roleTitle,
      accent: v.accent,
      defaultPitch: v.defaultPitch,
      defaultRate: v.defaultRate,
    })),
  });
}
