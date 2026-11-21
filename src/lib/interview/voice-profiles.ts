export type VoiceChoice =
  | "elena-tech-lead"
  | "marcus-director"
  | "priya-architect"
  | "myra-neutral"
  | "myra-warm"
  | "myra-executive";

export interface VoiceConfig {
  id: VoiceChoice;
  name: string;
  interviewerName: string;
  roleTitle: string;
  accent: string;
  avatarImage?: string;
  defaultPitch: number;
  defaultRate: number;
  voiceHints: string[];
  introGreeting: (candidateName: string, role: string) => string;
  bridgePhrases: string[];
}

export const VOICE_PROFILES: Record<VoiceChoice, VoiceConfig> = {
  "elena-tech-lead": {
    id: "elena-tech-lead",
    name: "Elena Vance (Lead Technical Interviewer)",
    interviewerName: "Elena Vance",
    roleTitle: "Staff Software Engineer • Technical Lead",
    accent: "US Professional / Conversational",
    defaultPitch: 1.0,
    defaultRate: 1.0,
    voiceHints: ["Natural", "Google US English", "en-US-Neural2-F", "Samantha", "Ava", "Jenny"],
    introGreeting: (candidateName, role) =>
      `Hi ${candidateName || "there"}! Welcome to your technical interview session for ${role}. Take a deep breath — we want this to feel just like a real engineering conversation. When you're ready, let's explore your first question.`,
    bridgePhrases: [
      "Thank you for breaking that down clearly.",
      "That is a very structured approach. Let us build on that.",
      "Understood. Moving forward to our next question.",
      "Great insights on the trade-offs there.",
    ],
  },
  "marcus-director": {
    id: "marcus-director",
    name: "Marcus Reed (Engineering Director)",
    interviewerName: "Marcus Reed",
    roleTitle: "Director of Engineering • System Architecture Lead",
    accent: "US / UK Measured & Authoritative",
    defaultPitch: 0.95,
    defaultRate: 0.96,
    voiceHints: ["Daniel", "Alex", "en-US-Neural2-C", "Google UK English Male", "Oliver", "Guy"],
    introGreeting: (candidateName, role) =>
      `Hello ${candidateName || "candidate"}, glad to meet you. Today we're diving into system architecture and engineering execution for the ${role} position. Let's start with our first scenario.`,
    bridgePhrases: [
      "Appreciate the clarity on that system design constraint.",
      "Makes sense. Let's test how that holds up under load.",
      "Solid reasoning. Let us transition to the next scenario.",
      "Good analysis of edge cases and failover paths.",
    ],
  },
  "priya-architect": {
    id: "priya-architect",
    name: "Priya Sharma (Principal Cloud Architect)",
    interviewerName: "Priya Sharma",
    roleTitle: "Principal Architect • Distributed Systems Lead",
    accent: "Global English / Energetic & Precise",
    defaultPitch: 1.05,
    defaultRate: 1.02,
    voiceHints: ["Google UK English Female", "en-IN-Neural2-D", "Victoria", "Karen", "Natural"],
    introGreeting: (candidateName, role) =>
      `Hi ${candidateName || "there"}, welcome! I'm thrilled to speak with you today about ${role}. Don't worry about being perfect — I'm looking at how you reason through engineering problems. Here is our opening question.`,
    bridgePhrases: [
      "Really liked how you identified the bottlenecks early.",
      "Spot on with the data structures choice. Let's proceed.",
      "Understood. Let's look at the next engineering challenge.",
      "Excellent breakdown of time and space complexity.",
    ],
  },
  "myra-neutral": {
    id: "myra-neutral",
    name: "Myra Neutral (Clear & Balanced)",
    interviewerName: "Myra",
    roleTitle: "Technical Interviewer",
    accent: "Neutral / Standard English",
    defaultPitch: 1.0,
    defaultRate: 1.0,
    voiceHints: ["Natural", "Google US English", "en-US-Neural2-F", "Samantha", "Karen"],
    introGreeting: (candidateName, role) =>
      `Welcome ${candidateName || "there"} to your live mock interview session for ${role}. Let's begin with your first question.`,
    bridgePhrases: [
      "Thank you for your response.",
      "Understood. Moving forward.",
      "Good explanation. Let's continue.",
    ],
  },
  "myra-warm": {
    id: "myra-warm",
    name: "Myra Warm (Supportive & Encouraging)",
    interviewerName: "Myra",
    roleTitle: "Career Mentor & Interview Coach",
    accent: "Warm / Supportive",
    defaultPitch: 1.05,
    defaultRate: 0.95,
    voiceHints: ["en-US-Journey-F", "Zira", "Samantha", "Victoria", "Natural"],
    introGreeting: (candidateName, role) =>
      `Hi ${candidateName || "there"}! I'm so glad to practice with you today for ${role}. Take your time, think aloud, and let's get started.`,
    bridgePhrases: [
      "Great job walking me through that.",
      "That makes total sense. Let's try the next one.",
      "You are doing very well. Moving on to question number two.",
    ],
  },
  "myra-executive": {
    id: "myra-executive",
    name: "Myra Executive (Direct & Measured)",
    interviewerName: "Myra Executive",
    roleTitle: "Senior Bar Raiser",
    accent: "Executive / Measured",
    defaultPitch: 0.95,
    defaultRate: 0.98,
    voiceHints: ["Daniel", "Alex", "en-US-Neural2-C", "Google UK English Female", "Victoria"],
    introGreeting: (candidateName, role) =>
      `Welcome to your executive interview assessment for ${role}. We will be evaluating your technical depth and structured problem solving. Here is your question.`,
    bridgePhrases: [
      "Noted. Moving to the next technical requirement.",
      "Clear. Let us assess the next component.",
    ],
  },
};
