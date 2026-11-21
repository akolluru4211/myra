import { NextRequest, NextResponse } from "next/server";
import {
  pickInterviewQuestions,
  formatQuestionBankBlock,
  getAvailableSectors,
  getSectorStats,
  getAllInterviewQuestions,
} from "@/lib/interview/interview-bank";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // List sectors only
    if (searchParams.get("listSectors") === "true") {
      const sectors = getAvailableSectors();
      return NextResponse.json({
        totalQuestions: getAllInterviewQuestions().length,
        totalSectors: sectors.length,
        sectors,
      });
    }

    // Sector breakdown stats
    if (searchParams.get("stats") === "true") {
      const stats = getSectorStats();
      return NextResponse.json({
        totalQuestions: getAllInterviewQuestions().length,
        totalSectors: stats.length,
        stats,
      });
    }

    const sector = searchParams.get("sector") || "";
    const round = searchParams.get("round") || "";
    const level = searchParams.get("level") || "";
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const seedParam = searchParams.get("seed");
    const seed = seedParam ? parseInt(seedParam, 10) : undefined;
    const formatPrompt = searchParams.get("formatPrompt") === "true";

    const questions = pickInterviewQuestions({
      sector,
      round,
      level,
      limit: Math.min(Math.max(1, limit), 50),
      seed,
    });

    const promptBlock = formatPrompt ? formatQuestionBankBlock(questions) : undefined;

    return NextResponse.json({
      success: true,
      count: questions.length,
      filters: { sector, round, level, limit, seed },
      questions,
      promptBlock,
    });
  } catch (error: any) {
    console.error("Failed to query interview question bank:", error);
    return NextResponse.json(
      { error: "Failed to query interview question bank", details: error?.message },
      { status: 500 }
    );
  }
}
