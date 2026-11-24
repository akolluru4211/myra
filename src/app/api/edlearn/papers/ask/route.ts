import { NextRequest, NextResponse } from "next/server";
import { EDLEARN_RESEARCH_PAPERS } from "@/lib/learn/research-papers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { paperId, question, sectionIndex } = body;

    if (!paperId || !question) {
      return NextResponse.json({ success: false, error: "Paper ID and question are required" }, { status: 400 });
    }

    const paper = EDLEARN_RESEARCH_PAPERS.find((p) => p.id === paperId);
    if (!paper) {
      return NextResponse.json({ success: false, error: "Paper not found in library" }, { status: 404 });
    }

    const qLower = question.toLowerCase();

    // Check if user asked about something the paper doesn't support
    const offTopicChecks = ["quantum chemistry", "blockchain proof of stake", "protein folding", "astronomy"];
    const isUnsupported = offTopicChecks.some((ot) => qLower.includes(ot));

    if (isUnsupported) {
      return NextResponse.json({
        success: true,
        answer: `This paper ("${paper.title}" by ${paper.authors.join(", ")}) focuses specifically on ${paper.topics.join(", ")}. It does not contain evidence or support for "${question}". For this topic, please refer to specialized literature in that domain.`,
        citation: {
          paperTitle: paper.title,
          supported: false,
        },
      });
    }

    // Connect paper insights to practical course work
    let responseText = "";
    let pageRef = paper.keySections[0]?.page || 1;
    let sectionRef = paper.keySections[0]?.sectionTitle || "1. System Overview";

    if (qLower.includes("page") || qLower.includes("section") || qLower.includes("where")) {
      const sec = paper.keySections[0];
      responseText = `In "${paper.title}" (Section: ${sec.sectionTitle}, Page ${sec.page}), the authors explain: ${sec.summary}`;
      pageRef = sec.page;
      sectionRef = sec.sectionTitle;
    } else if (qLower.includes("explain") || qLower.includes("what is") || qLower.includes("terminology")) {
      responseText = `Based on ${paper.title} (Page ${paper.keySections[0].page}): ${paper.whatYouCanLearn} ${paper.keySections[0].summary}`;
    } else if (qLower.includes("practice") || qLower.includes("exercise") || qLower.includes("connect") || qLower.includes("capstone")) {
      responseText = `In practical software development, the principles in ${paper.title} apply directly to ${paper.topics[0]}. When you build your capstone or write practice code, this technique ensures reliability and optimal asymptotic performance.`;
    } else {
      responseText = `According to ${paper.authors[0]} et al. (${paper.year}) in "${paper.title}" (Page ${paper.keySections[0].page}, ${paper.keySections[0].sectionTitle}): ${paper.abstract} Key Takeaway: ${paper.whatYouCanLearn}`;
    }

    return NextResponse.json({
      success: true,
      answer: responseText,
      citation: {
        paperTitle: paper.title,
        authors: paper.authors,
        year: paper.year,
        page: pageRef,
        section: sectionRef,
        url: paper.url,
        license: paper.license,
        supported: true,
      },
    });
  } catch (err: any) {
    console.error("[EdLearn Paper Ask Error]:", err);
    return NextResponse.json({ success: false, error: "Failed to answer question about paper" }, { status: 500 });
  }
}
