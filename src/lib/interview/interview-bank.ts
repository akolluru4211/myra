import rawQuestions from "../data/interview_questions_1000.json" with { type: "json" };

export interface InterviewQuestion {
  id: string;
  sector: string;
  round: string;
  level: string;
  question: string;
}

export interface PickInterviewOptions {
  sector?: string;
  round?: string;
  level?: string;
  limit?: number;
  seed?: number;
  includeFallbackIfEmpty?: boolean;
}

export interface SectorStat {
  sector: string;
  count: number;
  rounds: string[];
}

const questionsBank: InterviewQuestion[] = rawQuestions as InterviewQuestion[];

/**
 * Returns all 1,000 interview questions from the bank.
 */
export function getAllInterviewQuestions(): InterviewQuestion[] {
  return questionsBank;
}

/**
 * Simple pseudo-random number generator for reproducible seed-based sampling.
 */
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Shuffles an array in place (or cloned) using Fisher-Yates.
 */
function shuffle<T>(array: T[], seed?: number): T[] {
  const arr = [...array];
  const rng = typeof seed === "number" ? createSeededRandom(seed) : Math.random;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Filter and pick interview questions for a given sector, round, and career level.
 */
export function pickInterviewQuestions(options: PickInterviewOptions = {}): InterviewQuestion[] {
  const {
    sector = "",
    round = "",
    level = "",
    limit = 10,
    seed,
    includeFallbackIfEmpty = true,
  } = options;

  const sLower = sector.trim().toLowerCase();
  const rLower = round.trim().toLowerCase();
  const lLower = level.trim().toLowerCase();

  const sectorWords = sLower
    .split(/[\s,+/&|_-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3);

  const matchesLevel = (qLevel: string) => {
    if (!lLower) return true;
    const qL = qLevel.toLowerCase();
    return qL.includes(lLower) || qL.includes("all");
  };

  // Phase 1: Try strict substring match on sector and round
  let matched = questionsBank.filter((q) => {
    const qSec = q.sector.toLowerCase();
    const matchSector = !sLower || qSec.includes(sLower);
    const matchRound = !rLower || q.round.toLowerCase().includes(rLower);
    return matchSector && matchRound && matchesLevel(q.level);
  });

  // Phase 2: If no strict substring match, try multi-word token match on sector
  if (matched.length === 0 && sectorWords.length > 0) {
    matched = questionsBank.filter((q) => {
      const qSec = q.sector.toLowerCase();
      // Match if all meaningful words match or at least the primary words match
      const hasWordMatch = sectorWords.every((w) => qSec.includes(w)) ||
        (sectorWords.length > 1 && sectorWords.some((w) => w.length >= 4 && qSec.includes(w)));
      const matchRound = !rLower || q.round.toLowerCase().includes(rLower);
      return hasWordMatch && matchRound && matchesLevel(q.level);
    });
  }

  // Phase 3: If still no match and round was specified, try relaxing round constraint within sector
  if (matched.length === 0 && rLower && sectorWords.length > 0) {
    matched = questionsBank.filter((q) => {
      const qSec = q.sector.toLowerCase();
      const hasWordMatch = sectorWords.some((w) => qSec.includes(w));
      return hasWordMatch && matchesLevel(q.level);
    });
  }

  // Phase 4: Fallback to General questions
  if (matched.length === 0 && includeFallbackIfEmpty) {
    matched = questionsBank.filter((q) => {
      const isGeneral = q.sector.toLowerCase().includes("general");
      const matchRound = !rLower || q.round.toLowerCase().includes(rLower);
      return isGeneral && (matchRound || matchesLevel(q.level));
    });

    if (matched.length === 0) {
      matched = questionsBank.filter((q) => q.sector.toLowerCase().includes("general"));
    }
  }

  const shuffled = shuffle(matched, seed);
  return shuffled.slice(0, Math.max(1, limit));
}

/**
 * Formats a list of questions into the standard [QUESTION_BANK] block for Myra's prompt.
 */
export function formatQuestionBankBlock(items: InterviewQuestion[]): string {
  if (!items || items.length === 0) {
    return "[QUESTION_BANK]\n(No questions loaded. Ask the student for their field/sector and experience level)\n[/QUESTION_BANK]";
  }

  const lines = items.map(
    (d) => `${d.id} (${d.sector} | ${d.round} | ${d.level}): "${d.question}"`
  );

  return `[QUESTION_BANK]\n${lines.join("\n")}\n[/QUESTION_BANK]`;
}

/**
 * Returns a unique sorted list of all 46 sectors in the question bank.
 */
export function getAvailableSectors(): string[] {
  const set = new Set<string>();
  for (const q of questionsBank) {
    set.add(q.sector);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/**
 * Returns statistics and round breakdowns for each sector.
 */
export function getSectorStats(): SectorStat[] {
  const map = new Map<string, { count: number; rounds: Set<string> }>();

  for (const q of questionsBank) {
    if (!map.has(q.sector)) {
      map.set(q.sector, { count: 0, rounds: new Set() });
    }
    const entry = map.get(q.sector)!;
    entry.count++;
    entry.rounds.add(q.round);
  }

  const result: SectorStat[] = [];
  map.forEach((data, sec) => {
    result.push({
      sector: sec,
      count: data.count,
      rounds: Array.from(data.rounds),
    });
  });

  return result.sort((a, b) => b.count - a.count);
}
